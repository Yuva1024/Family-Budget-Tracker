'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
    demoUsers,
    demoTasks,
    demoGroceryItems,
    demoExpenses,
    demoMessages,
    getDemoUser,
    type DemoUser,
    type DemoTask,
    type DemoGroceryItem,
    type DemoExpense,
    type DemoMessage,
} from '@/lib/demo-data';

/* ================================================================
   FamilyContext — Supabase-powered shared family state.
   All family members see the same data in real time via granular
   payload-based handlers (INSERT/UPDATE/DELETE).
   Falls back to demo data if Supabase is not configured.
   ================================================================ */

interface FamilyContextValue {
    user: DemoUser;
    members: DemoUser[];
    getUserById: (id: string) => DemoUser | undefined;
    tasks: DemoTask[];
    addTask: (task: Omit<DemoTask, 'id' | 'created_at' | 'completed_at'>) => void;
    updateTaskStatus: (id: string, status: DemoTask['status']) => void;
    groceryItems: DemoGroceryItem[];
    addGroceryItem: (item: Omit<DemoGroceryItem, 'id' | 'created_at' | 'completed_at'>) => void;
    toggleGroceryItem: (id: string) => void;
    deleteGroceryItem: (id: string) => void;
    updateGroceryItem: (id: string, updates: Partial<Pick<DemoGroceryItem, 'item_name' | 'quantity' | 'price'>>) => void;
    expenses: DemoExpense[];
    addExpense: (expense: Omit<DemoExpense, 'id'>) => void;
    updateExpense: (id: string, updates: Partial<Pick<DemoExpense, 'title' | 'amount' | 'category' | 'date' | 'notes'>>) => void;
    deleteExpense: (id: string) => void;
    messages: DemoMessage[];
    sendMessage: (text: string) => void;
    loading: boolean;
}

const FamilyContext = createContext<FamilyContextValue | null>(null);

export function FamilyProvider({ children }: { children: ReactNode }) {
    const { profile } = useAuth();
    const isRealUser = isSupabaseConfigured && !!profile;
    const familyId = profile?.family_id;

    const currentUser: DemoUser = profile
        ? { id: profile.id, name: profile.name, avatar_url: profile.avatar_url || '', role: profile.role }
        : demoUsers[0];

    const [members, setMembers] = useState<DemoUser[]>(() => (isRealUser ? [currentUser] : demoUsers));
    const [tasks, setTasks] = useState<DemoTask[]>(() => (isRealUser ? [] : demoTasks));
    const [groceryItems, setGroceryItems] = useState<DemoGroceryItem[]>(() => (isRealUser ? [] : demoGroceryItems));
    const [expenses, setExpenses] = useState<DemoExpense[]>(() => (isRealUser ? [] : demoExpenses));
    const [messages, setMessages] = useState<DemoMessage[]>(() => (isRealUser ? [] : demoMessages));
    const [loading, setLoading] = useState(isRealUser);

    // Track temp IDs we created optimistically so we can skip the realtime echo
    const pendingTempIds = useRef<Set<string>>(new Set());

    // ─── Fetch all family data from Supabase (initial load only) ───
    const fetchAllData = useCallback(async () => {
        if (!supabase || !familyId) return;
        setLoading(true);

        const [membersRes, tasksRes, groceryRes, expensesRes, messagesRes] = await Promise.all([
            supabase.from('profiles').select('*').eq('family_id', familyId),
            supabase.from('tasks').select('*').eq('family_id', familyId).order('created_at', { ascending: false }),
            supabase.from('grocery_items').select('*').eq('family_id', familyId).order('created_at', { ascending: false }),
            supabase.from('expenses').select('*').eq('family_id', familyId).order('created_at', { ascending: false }),
            supabase.from('messages').select('*').eq('family_id', familyId).order('created_at', { ascending: true }),
        ]);

        if (membersRes.data) {
            setMembers(membersRes.data.map((p: any) => ({
                id: p.id, name: p.name, avatar_url: p.avatar_url || '', role: p.role,
            })));
        }
        if (tasksRes.data) {
            setTasks(tasksRes.data.map((t: any) => ({
                id: t.id, title: t.title, description: t.description || '',
                assigned_to: t.assigned_to || [], deadline: t.deadline,
                priority: t.priority, status: t.status,
                created_by: t.created_by, created_at: t.created_at, completed_at: t.completed_at,
            })));
        }
        if (groceryRes.data) {
            setGroceryItems(groceryRes.data.map((g: any) => ({
                id: g.id, item_name: g.item_name, quantity: g.quantity,
                price: Number(g.price), checked: g.checked, added_by: g.added_by, created_at: g.created_at, completed_at: g.completed_at || null,
            })));
        }
        if (expensesRes.data) {
            setExpenses(expensesRes.data.map((e: any) => ({
                id: e.id, title: e.title, amount: Number(e.amount),
                category: e.category, paid_by: e.paid_by, date: e.date, notes: e.notes || '', grocery_item_id: e.grocery_item_id || null,
            })));
        }
        if (messagesRes.data) {
            setMessages(messagesRes.data.map((m: any) => ({
                id: m.id, user_id: m.user_id, message: m.message, created_at: m.created_at,
            })));
        }

        setLoading(false);
    }, [familyId]);

    // Fetch data on mount and when family changes
    useEffect(() => {
        if (isRealUser && familyId) {
            fetchAllData();
        }
    }, [isRealUser, familyId, fetchAllData]);

    // ─── Granular Realtime Subscriptions ───
    useEffect(() => {
        if (!supabase || !familyId) return;

        const channel = supabase
            .channel(`family-${familyId}`)

            // ── PROFILES (members) ──
            .on('postgres_changes', {
                event: 'INSERT', schema: 'public', table: 'profiles',
                filter: `family_id=eq.${familyId}`,
            }, (payload) => {
                const p = payload.new as any;
                setMembers((prev) => {
                    if (prev.some((m) => m.id === p.id)) return prev;
                    return [...prev, { id: p.id, name: p.name, avatar_url: p.avatar_url || '', role: p.role }];
                });
            })
            .on('postgres_changes', {
                event: 'UPDATE', schema: 'public', table: 'profiles',
                filter: `family_id=eq.${familyId}`,
            }, (payload) => {
                const p = payload.new as any;
                setMembers((prev) =>
                    prev.map((m) => m.id === p.id ? { id: p.id, name: p.name, avatar_url: p.avatar_url || '', role: p.role } : m)
                );
            })

            // ── TASKS ──
            .on('postgres_changes', {
                event: 'INSERT', schema: 'public', table: 'tasks',
                filter: `family_id=eq.${familyId}`,
            }, (payload) => {
                const t = payload.new as any;
                setTasks((prev) => {
                    if (prev.some((x) => x.id === t.id)) return prev;
                    const withoutTemps = prev.filter((x) => {
                        if (pendingTempIds.current.has(x.id)) { pendingTempIds.current.delete(x.id); return false; }
                        return true;
                    });
                    const newTask: DemoTask = {
                        id: t.id, title: t.title, description: t.description || '',
                        assigned_to: t.assigned_to || [], deadline: t.deadline,
                        priority: t.priority, status: t.status,
                        created_by: t.created_by, created_at: t.created_at, completed_at: t.completed_at,
                    };
                    return [newTask, ...withoutTemps];
                });
            })
            .on('postgres_changes', {
                event: 'UPDATE', schema: 'public', table: 'tasks',
                filter: `family_id=eq.${familyId}`,
            }, (payload) => {
                const t = payload.new as any;
                setTasks((prev) =>
                    prev.map((x) => x.id === t.id ? {
                        id: t.id, title: t.title, description: t.description || '',
                        assigned_to: t.assigned_to || [], deadline: t.deadline,
                        priority: t.priority, status: t.status,
                        created_by: t.created_by, created_at: t.created_at, completed_at: t.completed_at,
                    } : x)
                );
            })
            .on('postgres_changes', {
                event: 'DELETE', schema: 'public', table: 'tasks',
                filter: `family_id=eq.${familyId}`,
            }, (payload) => {
                const old = payload.old as any;
                setTasks((prev) => prev.filter((x) => x.id !== old.id));
            })

            // ── GROCERY ITEMS ──
            .on('postgres_changes', {
                event: 'INSERT', schema: 'public', table: 'grocery_items',
                filter: `family_id=eq.${familyId}`,
            }, (payload) => {
                const g = payload.new as any;
                setGroceryItems((prev) => {
                    if (prev.some((x) => x.id === g.id)) return prev;
                    const withoutTemps = prev.filter((x) => {
                        if (pendingTempIds.current.has(x.id)) { pendingTempIds.current.delete(x.id); return false; }
                        return true;
                    });
                    const newItem: DemoGroceryItem = {
                        id: g.id, item_name: g.item_name, quantity: g.quantity,
                        price: Number(g.price), checked: g.checked, added_by: g.added_by, created_at: g.created_at, completed_at: g.completed_at || null,
                    };
                    return [newItem, ...withoutTemps];
                });
            })
            .on('postgres_changes', {
                event: 'UPDATE', schema: 'public', table: 'grocery_items',
                filter: `family_id=eq.${familyId}`,
            }, (payload) => {
                const g = payload.new as any;
                setGroceryItems((prev) =>
                    prev.map((x) => x.id === g.id ? {
                        id: g.id, item_name: g.item_name, quantity: g.quantity,
                        price: Number(g.price), checked: g.checked, added_by: g.added_by, created_at: g.created_at, completed_at: g.completed_at || null,
                    } : x)
                );
            })
            .on('postgres_changes', {
                event: 'DELETE', schema: 'public', table: 'grocery_items',
                filter: `family_id=eq.${familyId}`,
            }, (payload) => {
                const old = payload.old as any;
                setGroceryItems((prev) => prev.filter((x) => x.id !== old.id));
            })

            // ── EXPENSES ──
            .on('postgres_changes', {
                event: 'INSERT', schema: 'public', table: 'expenses',
                filter: `family_id=eq.${familyId}`,
            }, (payload) => {
                const e = payload.new as any;
                setExpenses((prev) => {
                    if (prev.some((x) => x.id === e.id)) return prev;
                    const withoutTemps = prev.filter((x) => {
                        if (pendingTempIds.current.has(x.id)) { pendingTempIds.current.delete(x.id); return false; }
                        return true;
                    });
                    const newExpense: DemoExpense = {
                        id: e.id, title: e.title, amount: Number(e.amount),
                        category: e.category, paid_by: e.paid_by, date: e.date, notes: e.notes || '', grocery_item_id: e.grocery_item_id || null,
                    };
                    return [newExpense, ...withoutTemps];
                });
            })
            .on('postgres_changes', {
                event: 'UPDATE', schema: 'public', table: 'expenses',
                filter: `family_id=eq.${familyId}`,
            }, (payload) => {
                const e = payload.new as any;
                setExpenses((prev) =>
                    prev.map((x) => x.id === e.id ? {
                        id: e.id, title: e.title, amount: Number(e.amount),
                        category: e.category, paid_by: e.paid_by, date: e.date, notes: e.notes || '', grocery_item_id: e.grocery_item_id || null,
                    } : x)
                );
            })
            .on('postgres_changes', {
                event: 'DELETE', schema: 'public', table: 'expenses',
                filter: `family_id=eq.${familyId}`,
            }, (payload) => {
                const old = payload.old as any;
                setExpenses((prev) => prev.filter((x) => x.id !== old.id));
            })

            // ── MESSAGES ──
            .on('postgres_changes', {
                event: 'INSERT', schema: 'public', table: 'messages',
                filter: `family_id=eq.${familyId}`,
            }, (payload) => {
                const m = payload.new as any;
                setMessages((prev) => {
                    if (prev.some((x) => x.id === m.id)) return prev;
                    const withoutTemps = prev.filter((x) => {
                        if (pendingTempIds.current.has(x.id)) { pendingTempIds.current.delete(x.id); return false; }
                        return true;
                    });
                    const newMsg: DemoMessage = {
                        id: m.id, user_id: m.user_id, message: m.message, created_at: m.created_at,
                    };
                    return [...withoutTemps, newMsg];
                });
            })
            .on('postgres_changes', {
                event: 'DELETE', schema: 'public', table: 'messages',
                filter: `family_id=eq.${familyId}`,
            }, (payload) => {
                const old = payload.old as any;
                setMessages((prev) => prev.filter((x) => x.id !== old.id));
            })

            .subscribe();

        return () => { if (supabase) supabase.removeChannel(channel); };
    }, [familyId]);

    const getUserById = useCallback(
        (id: string): DemoUser | undefined => {
            const found = members.find((m) => m.id === id);
            if (found) return found;
            return isRealUser ? undefined : getDemoUser(id);
        },
        [members, isRealUser],
    );

    // ── Task CRUD → Supabase ──
    const addTask = useCallback(async (task: Omit<DemoTask, 'id' | 'created_at' | 'completed_at'>) => {
        const tempId = `t${Date.now()}`;
        const newTask = { ...task, id: tempId, created_at: new Date().toISOString(), completed_at: null };
        setTasks((prev) => [newTask, ...prev]);

        if (!supabase || !familyId) return;

        const { data } = await supabase.from('tasks').insert({
            family_id: familyId, title: task.title, description: task.description,
            assigned_to: task.assigned_to, deadline: task.deadline,
            priority: task.priority, status: task.status, created_by: task.created_by,
        }).select().single();

        if (data) {
            setTasks((prev) => prev.map((t) =>
                t.id === tempId ? { ...t, id: data.id, created_at: data.created_at } : t
            ));
        }
    }, [familyId]);

    const updateTaskStatus = useCallback(async (id: string, status: DemoTask['status']) => {
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status, completed_at: status === 'completed' ? new Date().toISOString() : t.completed_at } : t)));

        if (!supabase) return;

        await supabase.from('tasks').update({
            status,
            completed_at: status === 'completed' ? new Date().toISOString() : null,
        }).eq('id', id);
    }, []);

    // ── Grocery CRUD → Supabase ──
    const addGroceryItem = useCallback(async (item: Omit<DemoGroceryItem, 'id' | 'created_at' | 'completed_at'>) => {
        const tempId = `g${Date.now()}`;
        const newItem = { ...item, id: tempId, created_at: new Date().toISOString(), completed_at: null };
        setGroceryItems((prev) => [newItem, ...prev]);

        if (!supabase || !familyId) return;

        const { data } = await supabase.from('grocery_items').insert({
            family_id: familyId, item_name: item.item_name,
            quantity: item.quantity, price: item.price, checked: item.checked, added_by: item.added_by,
        }).select().single();

        if (data) {
            // Replace temp item with real one (real ID) so realtime handler skips it
            setGroceryItems((prev) => prev.map((g) =>
                g.id === tempId ? { ...g, id: data.id, created_at: data.created_at } : g
            ));
        }
    }, [familyId]);

    const toggleGroceryItem = useCallback(async (id: string) => {
        let item: DemoGroceryItem | undefined;
        setGroceryItems((prev) => prev.map((g) => {
            if (g.id === id) {
                item = g;
                const nowChecked = !g.checked;
                return {
                    ...g,
                    checked: nowChecked,
                    completed_at: nowChecked ? new Date().toISOString() : null,
                };
            }
            return g;
        }));

        if (!item) return;
        const nowChecked = !item.checked;
        const completedAt = nowChecked ? new Date().toISOString() : null;

        // Auto-create or remove expense
        if (nowChecked && item.price > 0) {
            // Create expense for this grocery item
            const expTempId = `e${Date.now()}`;
            const expense: DemoExpense = {
                id: expTempId,
                title: item.item_name,
                amount: item.price * item.quantity,
                category: 'Groceries',
                paid_by: currentUser.id,
                date: new Date().toISOString().split('T')[0],
                notes: `Auto-added from grocery list`,
                grocery_item_id: id,
            };
            setExpenses((prev) => [expense, ...prev]);

            if (supabase && familyId) {
                const [gRes, expRes] = await Promise.all([
                    supabase.from('grocery_items').update({ checked: true, completed_at: completedAt }).eq('id', id),
                    supabase.from('expenses').insert({
                        family_id: familyId, title: expense.title, amount: expense.amount,
                        category: expense.category, paid_by: expense.paid_by, date: expense.date,
                        notes: expense.notes, grocery_item_id: id,
                    }).select().single(),
                ]);

                if (gRes.error) console.error("Error updating grocery_items check:", gRes.error);
                if (expRes.error) console.error("Error inserting auto-expense:", expRes.error);

                if (expRes.data) {
                    setExpenses((prev) => prev.map((e) =>
                        e.id === expTempId ? { ...e, id: expRes.data.id } : e
                    ));
                }
            }
        } else if (!nowChecked) {
            // Remove auto-created expense when unchecking
            setExpenses((prev) => prev.filter((e) => e.grocery_item_id !== id));

            if (supabase && familyId) {
                const [gRes, expRes] = await Promise.all([
                    supabase.from('grocery_items').update({ checked: false, completed_at: null }).eq('id', id),
                    supabase.from('expenses').delete().eq('grocery_item_id', id),
                ]);

                if (gRes.error) console.error("Error unchecking grocery_items:", gRes.error);
                if (expRes.error) console.error("Error deleting auto-expense:", expRes.error);
            }
        } else {
            // Item has no price — just toggle without expense
            if (supabase) {
                const res = await supabase.from('grocery_items').update({ checked: nowChecked, completed_at: completedAt }).eq('id', id);
                if (res.error) console.error("Error toggling simple grocery item:", res.error);
            }
        }
    }, [familyId, currentUser.id]);

    const deleteGroceryItem = useCallback(async (id: string) => {
        setGroceryItems((prev) => prev.filter((g) => g.id !== id));
        if (!supabase) return;
        await supabase.from('grocery_items').delete().eq('id', id);
    }, []);

    const updateGroceryItem = useCallback(async (id: string, updates: Partial<Pick<DemoGroceryItem, 'item_name' | 'quantity' | 'price'>>) => {
        setGroceryItems((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
        if (!supabase) return;
        await supabase.from('grocery_items').update(updates).eq('id', id);
    }, []);

    // ── Expense CRUD → Supabase ──
    const addExpense = useCallback(async (expense: Omit<DemoExpense, 'id'>) => {
        const tempId = `e${Date.now()}`;
        setExpenses((prev) => [{ ...expense, id: tempId }, ...prev]);

        if (!supabase || !familyId) return;

        const { data } = await supabase.from('expenses').insert({
            family_id: familyId, title: expense.title, amount: expense.amount,
            category: expense.category, paid_by: expense.paid_by, date: expense.date, notes: expense.notes,
        }).select().single();

        if (data) {
            setExpenses((prev) => prev.map((e) =>
                e.id === tempId ? { ...e, id: data.id } : e
            ));
        }
    }, [familyId]);

    const updateExpense = useCallback(async (id: string, updates: Partial<Pick<DemoExpense, 'title' | 'amount' | 'category' | 'date' | 'notes'>>) => {
        setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
        if (!supabase) return;
        await supabase.from('expenses').update(updates).eq('id', id);
    }, []);

    const deleteExpense = useCallback(async (id: string) => {
        setExpenses((prev) => prev.filter((e) => e.id !== id));
        if (!supabase) return;
        await supabase.from('expenses').delete().eq('id', id);
    }, []);

    // ── Messages → Supabase ──
    const sendMessage = useCallback(async (text: string) => {
        const tempId = `m${Date.now()}`;
        setMessages((prev) => [...prev, { id: tempId, user_id: currentUser.id, message: text, created_at: new Date().toISOString() }]);

        if (!supabase || !familyId) return;

        const { data } = await supabase.from('messages').insert({
            family_id: familyId, user_id: currentUser.id, message: text,
        }).select().single();

        if (data) {
            setMessages((prev) => prev.map((m) =>
                m.id === tempId ? { ...m, id: data.id, created_at: data.created_at } : m
            ));
        }
    }, [familyId, currentUser.id]);

    return (
        <FamilyContext.Provider
            value={{
                user: currentUser, members, getUserById, loading,
                tasks, addTask, updateTaskStatus,
                groceryItems, addGroceryItem, toggleGroceryItem, deleteGroceryItem, updateGroceryItem,
                expenses, addExpense, updateExpense, deleteExpense,
                messages, sendMessage,
            }}
        >
            {children}
        </FamilyContext.Provider>
    );
}

export function useFamily() {
    const ctx = useContext(FamilyContext);
    if (!ctx) throw new Error('useFamily must be used within <FamilyProvider>');
    return ctx;
}
