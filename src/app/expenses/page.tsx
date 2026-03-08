'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFamily } from '@/contexts/FamilyContext';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import { Plus, Wallet, TrendingUp, ChevronDown, Pencil, Trash2, ShoppingCart } from 'lucide-react';
import { format, isSameMonth, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CATEGORIES = ['Groceries', 'Utilities', 'Rent', 'Transport', 'Misc'];
const CATEGORY_COLORS: Record<string, string> = {
    Groceries: '#34d399',
    Utilities: '#3b82f6',
    Rent: '#8b5cf6',
    Transport: '#fbbf24',
    Misc: '#fb923c',
};

export default function ExpensesPage() {
    const { expenses, addExpense, updateExpense, deleteExpense, user, getUserById } = useFamily();
    const [showModal, setShowModal] = useState(false);
    const [filterCat, setFilterCat] = useState('all');
    const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));

    // Add form
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState<number>(0);
    const [category, setCategory] = useState('Groceries');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');

    // Edit state
    const [editingExpense, setEditingExpense] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editAmount, setEditAmount] = useState<number>(0);
    const [editCategory, setEditCategory] = useState('Groceries');
    const [editDate, setEditDate] = useState('');
    const [editNotes, setEditNotes] = useState('');

    // Delete confirmation
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const currentMonthExpenses = useMemo(() => {
        return expenses.filter(e => isSameMonth(parseISO(e.date), parseISO(`${selectedMonth}-01`)));
    }, [expenses, selectedMonth]);

    const monthlyTotal = useMemo(
        () => currentMonthExpenses.reduce((s, e) => s + e.amount, 0),
        [currentMonthExpenses],
    );

    const chartData = useMemo(() => {
        return CATEGORIES.map((cat) => ({
            name: cat,
            amount: currentMonthExpenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0),
        })).filter((d) => d.amount > 0);
    }, [currentMonthExpenses]);

    const filteredExpenses = useMemo(() => {
        return filterCat === 'all' ? currentMonthExpenses : currentMonthExpenses.filter((e) => e.category === filterCat);
    }, [currentMonthExpenses, filterCat]);

    // Generate available months from March 2026 up to the current month
    const availableMonths = useMemo(() => {
        const months = [];
        const current = new Date();
        // Start date: March 1, 2026
        const start = new Date(2026, 2, 1);

        // Always ensure the current month is included if current date is before start
        if (current < start) {
            months.push({
                value: format(current, 'yyyy-MM'),
                label: format(current, 'MMMM yyyy')
            });
            return months;
        }

        const d = new Date(current.getFullYear(), current.getMonth(), 1);
        while (d >= start) {
            months.push({
                value: format(d, 'yyyy-MM'),
                label: format(d, 'MMMM yyyy')
            });
            d.setMonth(d.getMonth() - 1);
        }
        return months;
    }, []);

    const handleAdd = () => {
        if (!title.trim() || !amount) return;
        addExpense({ title: title.trim(), amount, category, paid_by: user.id, date, notes: notes.trim() });
        setShowModal(false);
        setTitle('');
        setAmount(0);
        setCategory('Groceries');
        setNotes('');
    };

    const startEdit = (exp: typeof expenses[0]) => {
        setEditingExpense(exp.id);
        setEditTitle(exp.title);
        setEditAmount(exp.amount);
        setEditCategory(exp.category);
        setEditDate(exp.date);
        setEditNotes(exp.notes);
    };

    const saveEdit = () => {
        if (!editingExpense || !editTitle.trim() || !editAmount) return;
        updateExpense(editingExpense, {
            title: editTitle.trim(),
            amount: editAmount,
            category: editCategory,
            date: editDate,
            notes: editNotes.trim(),
        });
        setEditingExpense(null);
    };

    const confirmDelete = () => {
        if (!deletingId) return;
        deleteExpense(deletingId);
        setDeletingId(null);
    };

    const inputClass =
        'w-full bg-white/[0.04] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-accent-cyan)] transition-colors';

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
                    <Wallet className="text-[var(--color-accent-violet)]" size={28} /> Expenses
                </h1>
                <Button onClick={() => setShowModal(true)}>
                    <Plus size={16} /> Add Expense
                </Button>
            </div>

            {/* Summary + Chart */}
            <div className="grid lg:grid-cols-[1fr_1.5fr] gap-4 mb-8">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    <GlassCard className="relative overflow-hidden h-full flex flex-col justify-center">
                        <div className="absolute top-0 left-0 w-40 h-40 bg-[var(--color-accent-violet)]/5 rounded-full blur-3xl -translate-x-12 -translate-y-12" />
                        <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2 flex items-center gap-1.5">
                            <TrendingUp size={14} /> Monthly Total
                        </p>
                        <p className="text-4xl font-bold bg-gradient-to-r from-[var(--color-accent-violet)] to-[var(--color-accent-cyan)] bg-clip-text text-transparent">
                            ₹{monthlyTotal.toLocaleString()}
                        </p>
                        <p className="text-xs text-[var(--color-muted)] mt-2">{currentMonthExpenses.length} transactions in {format(parseISO(`${selectedMonth}-01`), 'MMM yyyy')}</p>
                    </GlassCard>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
                    <GlassCard>
                        <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-4">Spending by Category</p>
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="name" tick={{ fill: '#8b8d97', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#8b8d97', fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
                                <Tooltip
                                    contentStyle={{ background: '#1e2030', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, fontSize: 12 }}
                                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                />
                                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                                    {chartData.map((entry) => (
                                        <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || '#8b5cf6'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </GlassCard>
                </motion.div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 mb-5">
                <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-[var(--color-muted)]">Month:</p>
                    <div className="relative">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className={`${inputClass} appearance-none pr-8 min-w-[150px]`}
                        >
                            {availableMonths.map((m) => (
                                <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] pointer-events-none" />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-[var(--color-muted)]">Category:</p>
                    <div className="relative">
                        <select
                            value={filterCat}
                            onChange={(e) => setFilterCat(e.target.value)}
                            className={`${inputClass} appearance-none pr-8 min-w-[140px]`}
                        >
                            <option value="all">All Categories</option>
                            {CATEGORIES.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Expenses list */}
            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {filteredExpenses.map((exp, i) => {
                        const paidBy = getUserById(exp.paid_by);
                        const isAutoGrocery = !!exp.grocery_item_id;
                        return (
                            <motion.div
                                key={exp.id}
                                layout
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: i * 0.04 }}
                            >
                                <GlassCard hover className="!p-3 sm:!p-4">
                                    {/* Mobile: stacked layout, Desktop: single row */}
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                                            style={{ background: CATEGORY_COLORS[exp.category] || '#8b5cf6' }}
                                        >
                                            {isAutoGrocery ? <ShoppingCart size={14} /> : exp.category[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold truncate flex items-center gap-1.5">
                                                {exp.title}
                                                {isAutoGrocery && (
                                                    <span className="text-[10px] bg-[var(--color-accent-green)]/20 text-[var(--color-accent-green)] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                                                        auto
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-xs text-[var(--color-muted)] truncate">
                                                {format(new Date(exp.date), 'MMM d, yyyy')}
                                                {paidBy && ` · ${paidBy.name}`}
                                                {exp.notes && ` · ${exp.notes}`}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                                            <Badge color={
                                                exp.category === 'Groceries' ? 'green' :
                                                    exp.category === 'Utilities' ? 'blue' :
                                                        exp.category === 'Rent' ? 'violet' :
                                                            exp.category === 'Transport' ? 'yellow' : 'orange'
                                            }>
                                                <span className="hidden sm:inline">{exp.category}</span>
                                                <span className="sm:hidden">{exp.category.slice(0, 3)}</span>
                                            </Badge>
                                            <span className="text-sm font-bold text-[var(--color-foreground)] whitespace-nowrap">
                                                ₹{exp.amount.toLocaleString()}
                                            </span>
                                            <button
                                                onClick={() => startEdit(exp)}
                                                className="text-[var(--color-muted)] hover:text-[var(--color-accent-cyan)] transition-colors p-1 sm:p-1.5 rounded-lg hover:bg-white/[0.04]"
                                                title="Edit"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() => setDeletingId(exp.id)}
                                                className="text-[var(--color-muted)] hover:text-[var(--color-accent-red)] transition-colors p-1 sm:p-1.5 rounded-lg hover:bg-white/[0.04]"
                                                title="Delete"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                {filteredExpenses.length === 0 && (
                    <p className="text-center text-[var(--color-muted)] py-12 text-sm">No expenses recorded.</p>
                )}
            </div>

            {/* Add Expense Modal */}
            <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Expense">
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-[var(--color-muted)] font-medium mb-1 block">Title *</label>
                        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Weekly groceries" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-[var(--color-muted)] font-medium mb-1 block">Amount (₹) *</label>
                            <input className={inputClass} type="number" min={0} value={amount || ''} onChange={(e) => setAmount(Number(e.target.value))} placeholder="0" />
                        </div>
                        <div>
                            <label className="text-xs text-[var(--color-muted)] font-medium mb-1 block">Category</label>
                            <select className={`${inputClass} appearance-none`} value={category} onChange={(e) => setCategory(e.target.value)}>
                                {CATEGORIES.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-[var(--color-muted)] font-medium mb-1 block">Date</label>
                        <input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs text-[var(--color-muted)] font-medium mb-1 block">Notes</label>
                        <textarea className={`${inputClass} resize-none h-16`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional..." />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button onClick={handleAdd} disabled={!title.trim() || !amount}>Add Expense</Button>
                    </div>
                </div>
            </Modal>

            {/* Edit Expense Modal */}
            <Modal open={!!editingExpense} onClose={() => setEditingExpense(null)} title="Edit Expense">
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-[var(--color-muted)] font-medium mb-1 block">Title *</label>
                        <input className={inputClass} value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-[var(--color-muted)] font-medium mb-1 block">Amount (₹) *</label>
                            <input className={inputClass} type="number" min={0} value={editAmount || ''} onChange={(e) => setEditAmount(Number(e.target.value))} />
                        </div>
                        <div>
                            <label className="text-xs text-[var(--color-muted)] font-medium mb-1 block">Category</label>
                            <select className={`${inputClass} appearance-none`} value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                                {CATEGORIES.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-[var(--color-muted)] font-medium mb-1 block">Date</label>
                        <input className={inputClass} type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs text-[var(--color-muted)] font-medium mb-1 block">Notes</label>
                        <textarea className={`${inputClass} resize-none h-16`} value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
                    </div>
                    <Button onClick={saveEdit} disabled={!editTitle.trim() || !editAmount} className="w-full" size="lg">
                        Save Changes
                    </Button>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal open={!!deletingId} onClose={() => setDeletingId(null)} title="Delete Expense">
                <div className="space-y-4">
                    <p className="text-sm text-[var(--color-muted)]">Are you sure you want to delete this expense? This action cannot be undone.</p>
                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setDeletingId(null)}>Cancel</Button>
                        <Button onClick={confirmDelete} className="!bg-red-500/20 !text-red-400 hover:!bg-red-500/30">Delete</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
