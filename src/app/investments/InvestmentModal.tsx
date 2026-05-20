'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useInvestments, InvestmentType } from '@/contexts/InvestmentContext';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';

interface InvestmentModalProps {
    investment?: any;
    onClose: () => void;
}

const INVESTMENT_TYPES: InvestmentType[] = ['FD', 'RD', 'SIP', 'Bond', 'Real Estate', 'Asset', 'Cash', 'Stock', 'Other'];

export default function InvestmentModal({ investment, onClose }: InvestmentModalProps) {
    const { addInvestment, updateInvestment, deleteInvestment } = useInvestments();
    const { profile } = useAuth();

    const [formData, setFormData] = useState({
        name: '',
        type: 'FD' as InvestmentType,
        principal_amount: '',
        current_value: '',
        institution: '',
        interest_rate: '',
        start_date: '',
        maturity_date: '',
        notes: '',
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (investment) {
            setFormData({
                name: investment.name || '',
                type: investment.type as InvestmentType || 'FD',
                principal_amount: investment.principal_amount?.toString() || '',
                current_value: investment.current_value?.toString() || '',
                institution: investment.institution || '',
                interest_rate: investment.interest_rate?.toString() || '',
                start_date: investment.start_date || '',
                maturity_date: investment.maturity_date || '',
                notes: investment.notes || '',
            });
        }
    }, [investment]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile?.id) return;

        setLoading(true);

        try {
            const dataToSave = {
                name: formData.name,
                type: formData.type,
                principal_amount: parseFloat(formData.principal_amount) || 0,
                current_value: parseFloat(formData.current_value) || parseFloat(formData.principal_amount) || 0,
                institution: formData.institution || null,
                interest_rate: formData.interest_rate ? parseFloat(formData.interest_rate) : null,
                start_date: formData.start_date || null,
                maturity_date: formData.maturity_date || null,
                notes: formData.notes || null,
                is_active: true,
            };

            if (investment?.id) {
                await updateInvestment(investment.id, dataToSave);
            } else {
                await addInvestment({ ...dataToSave, added_by: profile.id });
            }
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (investment?.id && window.confirm('Are you sure you want to delete this asset? This cannot be undone.')) {
            setLoading(true);
            await deleteInvestment(investment.id);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
                    <h2 className="text-lg font-semibold">{investment ? 'Edit Asset' : 'Add New Asset'}</h2>
                    <button onClick={onClose} className="p-2 -mr-2 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-white/[0.05] transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-6">
                    <form id="investment-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-[var(--color-muted)] mb-1.5 uppercase tracking-wider">Asset Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full bg-white/[0.03] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--color-accent-cyan)] focus:bg-white/[0.05] transition-colors"
                                placeholder="e.g. HDFC Fixed Deposit"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-[var(--color-muted)] mb-1.5 uppercase tracking-wider">Type</label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="w-full bg-white/[0.03] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--color-accent-cyan)] focus:bg-white/[0.05] transition-colors appearance-none"
                                >
                                    {INVESTMENT_TYPES.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[var(--color-muted)] mb-1.5 uppercase tracking-wider">Institution</label>
                                <input
                                    type="text"
                                    name="institution"
                                    value={formData.institution}
                                    onChange={handleChange}
                                    className="w-full bg-white/[0.03] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--color-accent-cyan)] focus:bg-white/[0.05] transition-colors"
                                    placeholder="Bank/Broker/Location"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-[var(--color-muted)] mb-1.5 uppercase tracking-wider">Invested Amount (₹)</label>
                                <input
                                    type="number"
                                    name="principal_amount"
                                    value={formData.principal_amount}
                                    onChange={handleChange}
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full bg-white/[0.03] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--color-accent-cyan)] focus:bg-white/[0.05] transition-colors"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[var(--color-muted)] mb-1.5 uppercase tracking-wider">Current Value (₹)</label>
                                <input
                                    type="number"
                                    name="current_value"
                                    value={formData.current_value}
                                    onChange={handleChange}
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full bg-white/[0.03] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--color-accent-cyan)] focus:bg-white/[0.05] transition-colors"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-[var(--color-muted)] mb-1.5 uppercase tracking-wider">Interest Rate (%)</label>
                                <input
                                    type="number"
                                    name="interest_rate"
                                    value={formData.interest_rate}
                                    onChange={handleChange}
                                    step="0.01"
                                    className="w-full bg-white/[0.03] border border-[var(--color-border)] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[var(--color-accent-cyan)] focus:bg-white/[0.05] transition-colors"
                                    placeholder="e.g. 7.5"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[var(--color-muted)] mb-1.5 uppercase tracking-wider">Start Date</label>
                                <input
                                    type="date"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleChange}
                                    className="w-full bg-white/[0.03] border border-[var(--color-border)] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[var(--color-accent-cyan)] focus:bg-white/[0.05] transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-[var(--color-muted)] mb-1.5 uppercase tracking-wider">Maturity Date</label>
                                <input
                                    type="date"
                                    name="maturity_date"
                                    value={formData.maturity_date}
                                    onChange={handleChange}
                                    className="w-full bg-white/[0.03] border border-[var(--color-border)] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[var(--color-accent-cyan)] focus:bg-white/[0.05] transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-[var(--color-muted)] mb-1.5 uppercase tracking-wider">Notes</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                rows={2}
                                className="w-full bg-white/[0.03] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--color-accent-cyan)] focus:bg-white/[0.05] transition-colors resize-none"
                                placeholder="Any additional details..."
                            />
                        </div>
                    </form>
                </div>

                <div className="p-4 border-t border-[var(--color-border)] flex items-center justify-between bg-black/20">
                    {investment ? (
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={loading}
                            className="text-sm font-medium text-[var(--color-accent-red)] hover:bg-[var(--color-accent-red)]/10 px-4 py-2 rounded-lg transition-colors"
                        >
                            Delete Asset
                        </button>
                    ) : (
                        <div></div>
                    )}
                    <div className="flex gap-3">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" form="investment-form" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Asset'}
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
