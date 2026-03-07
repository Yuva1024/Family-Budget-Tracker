'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFamily } from '@/contexts/FamilyContext';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import { Plus, ShoppingCart, CheckCircle2, Trash2, Pencil, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

export default function GroceriesPage() {
    const { groceryItems, addGroceryItem, toggleGroceryItem, deleteGroceryItem, updateGroceryItem, user, getUserById } = useFamily();

    const [newName, setNewName] = useState('');
    const [newQty, setNewQty] = useState(1);
    const [newPrice, setNewPrice] = useState(0);

    // Edit state
    const [editingItem, setEditingItem] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editQty, setEditQty] = useState(1);
    const [editPrice, setEditPrice] = useState(0);

    // History section open/closed
    const [historyOpen, setHistoryOpen] = useState(false);

    // Pending: unchecked items (persist until completed or deleted)
    const pending = useMemo(() => groceryItems.filter((g) => !g.checked), [groceryItems]);

    // Completed today: checked items completed today
    const completedToday = useMemo(() =>
        groceryItems.filter((g) => g.checked && g.completed_at && isToday(new Date(g.completed_at))),
        [groceryItems],
    );

    // History: completed items grouped by date (excluding today)
    const historyByDate = useMemo(() => {
        const past = groceryItems.filter((g) => g.checked && g.completed_at && !isToday(new Date(g.completed_at)));
        const groups: Record<string, typeof past> = {};
        past.forEach((item) => {
            const dateKey = format(new Date(item.completed_at!), 'yyyy-MM-dd');
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(item);
        });
        // Sort by date descending
        return Object.entries(groups)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([date, items]) => ({ date, items }));
    }, [groceryItems]);

    const expectedTotal = pending.reduce((s, g) => s + g.price * g.quantity, 0);
    const purchasedTodayTotal = completedToday.reduce((s, g) => s + g.price * g.quantity, 0);

    const handleAdd = () => {
        if (!newName.trim()) return;
        addGroceryItem({ item_name: newName.trim(), quantity: newQty, price: newPrice, checked: false, added_by: user.id });
        setNewName('');
        setNewQty(1);
        setNewPrice(0);
    };

    const startEdit = (item: typeof groceryItems[0]) => {
        setEditingItem(item.id);
        setEditName(item.item_name);
        setEditQty(item.quantity);
        setEditPrice(item.price);
    };

    const saveEdit = () => {
        if (!editingItem || !editName.trim()) return;
        updateGroceryItem(editingItem, { item_name: editName.trim(), quantity: editQty, price: editPrice });
        setEditingItem(null);
    };

    const formatDateLabel = (dateStr: string) => {
        const d = new Date(dateStr);
        if (isYesterday(d)) return 'Yesterday';
        return format(d, 'EEEE, MMM d');
    };

    const inputClass =
        'w-full bg-white/[0.04] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-accent-cyan)] transition-colors';

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
                    <ShoppingCart className="text-[var(--color-accent-yellow)]" size={28} /> Grocery List
                </h1>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                    { label: 'Pending Total', value: `₹${expectedTotal.toLocaleString()}`, color: 'var(--color-accent-yellow)' },
                    { label: 'Bought Today', value: `₹${purchasedTodayTotal.toLocaleString()}`, color: 'var(--color-accent-green)' },
                    { label: 'Items Left', value: `${pending.length}`, color: 'var(--color-muted)' },
                ].map((s) => (
                    <GlassCard key={s.label} className="text-center">
                        <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mb-1">{s.label}</p>
                        <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
                    </GlassCard>
                ))}
            </div>

            {/* Add item form */}
            <GlassCard className="mb-6">
                <p className="text-xs text-[var(--color-muted)] font-medium mb-3">Add Item</p>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-[var(--color-muted)] mb-1 block">Item Name *</label>
                        <input
                            className={inputClass}
                            placeholder="e.g. Milk, Rice, Eggs..."
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        />
                    </div>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="text-xs text-[var(--color-muted)] mb-1 block">Quantity</label>
                            <input className={inputClass} type="number" min={1} value={newQty} onChange={(e) => setNewQty(Number(e.target.value))} />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-[var(--color-muted)] mb-1 block">Price ₹</label>
                            <input className={inputClass} type="number" min={0} step={0.5} value={newPrice || ''} onChange={(e) => setNewPrice(Number(e.target.value))} placeholder="0" />
                        </div>
                        <div className="flex items-end">
                            <Button onClick={handleAdd} disabled={!newName.trim()} className="flex-shrink-0">
                                <Plus size={16} /> Add
                            </Button>
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Pending Items */}
            <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-3">
                Pending ({pending.length})
            </h2>
            <div className="space-y-2 mb-8">
                <AnimatePresence mode="popLayout">
                    {pending.map((item) => {
                        const addedBy = getUserById(item.added_by);
                        return (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 30, scale: 0.95 }}
                                transition={{ duration: 0.25 }}
                            >
                                <GlassCard className="flex items-center gap-3 !p-3">
                                    <button
                                        onClick={() => toggleGroceryItem(item.id)}
                                        className="w-5 h-5 rounded-md border border-[var(--color-border-active)] flex items-center justify-center flex-shrink-0 hover:border-[var(--color-accent-green)] transition-colors"
                                    />
                                    <span className="flex-1 text-sm font-medium">{item.item_name}</span>
                                    <span className="text-xs text-[var(--color-muted)]">×{item.quantity}</span>
                                    <span className="text-xs font-medium text-[var(--color-accent-cyan)]">₹{(item.price * item.quantity).toLocaleString()}</span>
                                    {addedBy && <Avatar name={addedBy.name} size={22} />}
                                    <button onClick={() => startEdit(item)} className="text-[var(--color-muted)] hover:text-[var(--color-accent-cyan)] transition-colors p-1" title="Edit">
                                        <Pencil size={14} />
                                    </button>
                                    <button onClick={() => deleteGroceryItem(item.id)} className="text-[var(--color-muted)] hover:text-[var(--color-accent-red)] transition-colors p-1" title="Delete">
                                        <Trash2 size={14} />
                                    </button>
                                </GlassCard>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                {pending.length === 0 && <p className="text-sm text-[var(--color-muted)] text-center py-6">All items purchased ✅</p>}
            </div>

            {/* Completed Today */}
            {completedToday.length > 0 && (
                <>
                    <h2 className="text-sm font-semibold text-[var(--color-accent-green)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <CheckCircle2 size={14} /> Bought Today ({completedToday.length})
                    </h2>
                    <div className="space-y-2 mb-8">
                        <AnimatePresence mode="popLayout">
                            {completedToday.map((item) => {
                                const addedBy = getUserById(item.added_by);
                                return (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -30, scale: 0.95 }}
                                        transition={{ duration: 0.25 }}
                                    >
                                        <GlassCard className="flex items-center gap-3 !p-3 opacity-70">
                                            <button
                                                onClick={() => toggleGroceryItem(item.id)}
                                                className="w-5 h-5 rounded-md bg-[var(--color-accent-green)] flex items-center justify-center flex-shrink-0"
                                            >
                                                <CheckCircle2 size={14} className="text-white" />
                                            </button>
                                            <span className="flex-1 text-sm line-through text-[var(--color-muted)]">{item.item_name}</span>
                                            <span className="text-xs text-[var(--color-muted)]">×{item.quantity}</span>
                                            <span className="text-xs font-medium text-[var(--color-accent-green)]">₹{(item.price * item.quantity).toLocaleString()}</span>
                                            {addedBy && <Avatar name={addedBy.name} size={22} />}
                                        </GlassCard>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                </>
            )}

            {/* Purchase History */}
            {historyByDate.length > 0 && (
                <div className="mt-4">
                    <button
                        onClick={() => setHistoryOpen(!historyOpen)}
                        className="flex items-center gap-2 text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-3 hover:text-[var(--color-foreground)] transition-colors"
                    >
                        {historyOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        <Clock size={14} />
                        Purchase History ({historyByDate.reduce((s, g) => s + g.items.length, 0)} items)
                    </button>

                    <AnimatePresence>
                        {historyOpen && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                            >
                                {historyByDate.map(({ date, items }) => (
                                    <div key={date} className="mb-6">
                                        <p className="text-xs font-semibold text-[var(--color-accent-violet)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            <Clock size={12} />
                                            {formatDateLabel(date)} — ₹{items.reduce((s, g) => s + g.price * g.quantity, 0).toLocaleString()}
                                        </p>
                                        <div className="space-y-1.5">
                                            {items.map((item) => {
                                                const addedBy = getUserById(item.added_by);
                                                return (
                                                    <GlassCard key={item.id} className="flex items-center gap-3 !p-2.5 opacity-50">
                                                        <CheckCircle2 size={14} className="text-[var(--color-accent-green)] flex-shrink-0" />
                                                        <span className="flex-1 text-xs line-through text-[var(--color-muted)]">{item.item_name}</span>
                                                        <span className="text-[10px] text-[var(--color-muted)]">×{item.quantity}</span>
                                                        <span className="text-[10px] font-medium text-[var(--color-accent-green)]">₹{(item.price * item.quantity).toLocaleString()}</span>
                                                        {addedBy && <Avatar name={addedBy.name} size={18} />}
                                                    </GlassCard>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Edit Modal */}
            <Modal open={!!editingItem} onClose={() => setEditingItem(null)} title="Edit Item">
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-[var(--color-muted)] font-medium mb-1 block">Item Name</label>
                        <input className={inputClass} value={editName} onChange={(e) => setEditName(e.target.value)} />
                    </div>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="text-xs text-[var(--color-muted)] font-medium mb-1 block">Quantity</label>
                            <input className={inputClass} type="number" min={1} value={editQty} onChange={(e) => setEditQty(Number(e.target.value))} />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-[var(--color-muted)] font-medium mb-1 block">Price ₹</label>
                            <input className={inputClass} type="number" min={0} step={0.5} value={editPrice || ''} onChange={(e) => setEditPrice(Number(e.target.value))} />
                        </div>
                    </div>
                    <Button onClick={saveEdit} disabled={!editName.trim()} className="w-full" size="lg">
                        Save Changes
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
