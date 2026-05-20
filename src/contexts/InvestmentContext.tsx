'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { Database } from '@/lib/database.types';

type InvestmentRow = Database['public']['Tables']['investments']['Row'];
export type InvestmentType = Database['public']['Tables']['investments']['Row']['type'];

interface InvestmentContextValue {
    investments: InvestmentRow[];
    loading: boolean;
    addInvestment: (investment: Omit<InvestmentRow, 'id' | 'created_at' | 'updated_at' | 'family_id'>) => Promise<void>;
    updateInvestment: (id: string, updates: Partial<Omit<InvestmentRow, 'id' | 'created_at' | 'family_id'>>) => Promise<void>;
    deleteInvestment: (id: string) => Promise<void>;
    totalCurrentValue: number;
    totalPrincipalValue: number;
}

const InvestmentContext = createContext<InvestmentContextValue | null>(null);

export function InvestmentProvider({ children }: { children: ReactNode }) {
    const { profile } = useAuth();
    const [investments, setInvestments] = useState<InvestmentRow[]>([]);
    const [loading, setLoading] = useState(true);

    const familyId = profile?.family_id;

    // Fetch initial data
    useEffect(() => {
        if (!supabase || !familyId) {
            setTimeout(() => {
                setInvestments([]);
                setLoading(false);
            }, 0);
            return;
        }

        const fetchInvestments = async () => {
            const { data, error } = await supabase!
                .from('investments')
                .select('*')
                .eq('family_id', familyId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching investments:', error);
            } else {
                setInvestments(data || []);
            }
            setLoading(false);
        };

        fetchInvestments();

        // Setup realtime subscription
        const channel = supabase!.channel('investments_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'investments',
                    filter: `family_id=eq.${familyId}`
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setInvestments((prev) => [payload.new as InvestmentRow, ...prev.filter(i => i.id !== payload.new.id)]);
                    } else if (payload.eventType === 'UPDATE') {
                        setInvestments((prev) => prev.map((i) => (i.id === payload.new.id ? payload.new as InvestmentRow : i)));
                    } else if (payload.eventType === 'DELETE') {
                        setInvestments((prev) => prev.filter((i) => i.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase!.removeChannel(channel);
        };
    }, [familyId]);

    const addInvestment = useCallback(async (investment: Omit<InvestmentRow, 'id' | 'created_at' | 'updated_at' | 'family_id'>) => {
        if (!supabase || !familyId) return;

        // Optimistic update
        const tempId = `inv_${Date.now()}`;
        const newInv: InvestmentRow = {
            ...investment,
            id: tempId,
            family_id: familyId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        setInvestments(prev => [newInv, ...prev]);

        const { data, error } = await supabase!
            .from('investments')
            .insert({
                ...investment,
                family_id: familyId,
            })
            .select()
            .single();

        if (error) {
            console.error('Error adding investment:', error);
            // Revert optimistic update
            setInvestments(prev => prev.filter(i => i.id !== tempId));
        } else if (data) {
            // Replace temp id with real id
            setInvestments(prev => prev.map(i => i.id === tempId ? data : i));
        }
    }, [familyId]);

    const updateInvestment = useCallback(async (id: string, updates: Partial<Omit<InvestmentRow, 'id' | 'created_at' | 'family_id'>>) => {
        if (!supabase || !familyId) return;

        // Optimistic update
        setInvestments(prev => prev.map(i => i.id === id ? { ...i, ...updates, updated_at: new Date().toISOString() } : i));

        const { error } = await supabase!
            .from('investments')
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('family_id', familyId);

        if (error) {
            console.error('Error updating investment:', error);
            // In a real app we might want to revert the optimistic update here or show a toast
        }
    }, [familyId]);

    const deleteInvestment = useCallback(async (id: string) => {
        if (!supabase || !familyId) return;

        // Optimistic update
        setInvestments(prev => prev.filter(i => i.id !== id));

        const { error } = await supabase!
            .from('investments')
            .delete()
            .eq('id', id)
            .eq('family_id', familyId);

        if (error) {
            console.error('Error deleting investment:', error);
        }
    }, [familyId]);

    const totalCurrentValue = investments.reduce((sum, inv) => sum + (inv.current_value || 0), 0);
    const totalPrincipalValue = investments.reduce((sum, inv) => sum + (inv.principal_amount || 0), 0);

    return (
        <InvestmentContext.Provider
            value={{
                investments,
                loading,
                addInvestment,
                updateInvestment,
                deleteInvestment,
                totalCurrentValue,
                totalPrincipalValue,
            }}
        >
            {children}
        </InvestmentContext.Provider>
    );
}

export function useInvestments() {
    const ctx = useContext(InvestmentContext);
    if (!ctx) throw new Error('useInvestments must be used within <InvestmentProvider>');
    return ctx;
}
