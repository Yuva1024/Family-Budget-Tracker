'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, TrendingUp, PiggyBank, Briefcase, DollarSign, PieChart as PieChartIcon } from 'lucide-react';
import { useInvestments } from '@/contexts/InvestmentContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';
import InvestmentModal from './InvestmentModal';

const COLORS = ['#22d3ee', '#8b5cf6', '#3b82f6', '#34d399', '#fbbf24', '#f87171', '#fb923c'];

export default function InvestmentsPage() {
    const { investments, totalCurrentValue, totalPrincipalValue, loading } = useInvestments();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingInvestment, setEditingInvestment] = useState<any>(null);

    // Group investments by type for the chart
    const investmentsByType = investments.reduce((acc, inv) => {
        acc[inv.type] = (acc[inv.type] || 0) + (inv.current_value || inv.principal_amount || 0);
        return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(investmentsByType)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    const totalGrowth = totalCurrentValue - totalPrincipalValue;
    const growthPercentage = totalPrincipalValue > 0 ? (totalGrowth / totalPrincipalValue) * 100 : 0;

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Investments & Assets</h1>
                    <p className="text-[var(--color-muted)] text-sm mt-1">Track your family's financial growth</p>
                </div>
                <Button onClick={() => { setEditingInvestment(null); setIsModalOpen(true); }} className="gap-2">
                    <Plus size={18} /> <span className="hidden sm:inline">Add Asset</span>
                </Button>
            </header>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 rounded-full border-2 border-[var(--color-accent-cyan)] border-t-transparent animate-spin" />
                </div>
            ) : investments.length === 0 ? (
                <GlassCard className="text-center py-16 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--color-accent-cyan)]/10 text-[var(--color-accent-cyan)] flex items-center justify-center mb-4">
                        <TrendingUp size={32} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No investments yet</h3>
                    <p className="text-[var(--color-muted)] text-sm mb-6 max-w-sm">
                        Start tracking your Fixed Deposits, SIPs, Real Estate, and other assets to see your family's net worth grow.
                    </p>
                    <Button onClick={() => { setEditingInvestment(null); setIsModalOpen(true); }}>Add First Investment</Button>
                </GlassCard>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <GlassCard className="relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-accent-cyan)]/5 rounded-full blur-2xl -translate-y-12 translate-x-12" />
                            <div className="flex items-center gap-3 text-[var(--color-muted)] mb-2">
                                <DollarSign size={18} className="text-[var(--color-accent-cyan)]" />
                                <span className="text-sm font-medium">Total Net Worth</span>
                            </div>
                            <div className="text-3xl font-bold tracking-tight">
                                ₹{totalCurrentValue.toLocaleString('en-IN')}
                            </div>
                        </GlassCard>

                        <GlassCard className="relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-accent-violet)]/5 rounded-full blur-2xl -translate-y-12 translate-x-12" />
                            <div className="flex items-center gap-3 text-[var(--color-muted)] mb-2">
                                <PiggyBank size={18} className="text-[var(--color-accent-violet)]" />
                                <span className="text-sm font-medium">Invested Amount</span>
                            </div>
                            <div className="text-3xl font-bold tracking-tight">
                                ₹{totalPrincipalValue.toLocaleString('en-IN')}
                            </div>
                        </GlassCard>

                        <GlassCard className="relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-accent-green)]/5 rounded-full blur-2xl -translate-y-12 translate-x-12" />
                            <div className="flex items-center gap-3 text-[var(--color-muted)] mb-2">
                                <TrendingUp size={18} className="text-[var(--color-accent-green)]" />
                                <span className="text-sm font-medium">Total Returns</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <div className={`text-3xl font-bold tracking-tight ${totalGrowth >= 0 ? 'text-[var(--color-accent-green)]' : 'text-[var(--color-accent-red)]'}`}>
                                    {totalGrowth >= 0 ? '+' : ''}₹{totalGrowth.toLocaleString('en-IN')}
                                </div>
                                <div className={`text-sm font-medium ${totalGrowth >= 0 ? 'text-[var(--color-accent-green)]' : 'text-[var(--color-accent-red)]'}`}>
                                    ({totalGrowth >= 0 ? '+' : ''}{growthPercentage.toFixed(2)}%)
                                </div>
                            </div>
                        </GlassCard>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Chart */}
                        <GlassCard className="lg:col-span-1 flex flex-col min-h-[350px]">
                            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                                <PieChartIcon size={18} className="text-[var(--color-accent-cyan)]" /> Asset Allocation
                            </h2>
                            <div className="flex-1 w-full relative min-h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: any) => `₹${Number(value || 0).toLocaleString('en-IN')}`}
                                            contentStyle={{
                                                backgroundColor: 'var(--color-surface)',
                                                borderColor: 'var(--color-border)',
                                                borderRadius: '0.75rem',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                                color: 'var(--color-foreground)'
                                            }}
                                            itemStyle={{ color: 'var(--color-foreground)' }}
                                        />
                                        <Legend
                                            layout="horizontal"
                                            verticalAlign="bottom"
                                            align="center"
                                            wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </GlassCard>

                        {/* List */}
                        <GlassCard className="lg:col-span-2">
                            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                                <Briefcase size={18} className="text-[var(--color-accent-violet)]" /> Active Assets
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-[var(--color-border)] text-[var(--color-muted)] text-sm">
                                            <th className="pb-3 font-medium">Asset Name</th>
                                            <th className="pb-3 font-medium">Type</th>
                                            <th className="pb-3 font-medium text-right">Invested</th>
                                            <th className="pb-3 font-medium text-right">Current Value</th>
                                            <th className="pb-3 font-medium text-right">Returns</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {investments.map((inv) => {
                                            const returns = inv.current_value - inv.principal_amount;
                                            const retPct = inv.principal_amount > 0 ? (returns / inv.principal_amount) * 100 : 0;
                                            return (
                                                <tr
                                                    key={inv.id}
                                                    className="border-b border-[var(--color-border)]/50 hover:bg-white/[0.02] transition-colors cursor-pointer"
                                                    onClick={() => { setEditingInvestment(inv); setIsModalOpen(true); }}
                                                >
                                                    <td className="py-3">
                                                        <div className="font-medium text-sm">{inv.name}</div>
                                                        {inv.institution && <div className="text-xs text-[var(--color-muted)] mt-0.5">{inv.institution}</div>}
                                                    </td>
                                                    <td className="py-3">
                                                        <span className="px-2.5 py-1 bg-white/[0.05] border border-[var(--color-border)] rounded-md text-xs font-medium">
                                                            {inv.type}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-right text-sm">
                                                        ₹{inv.principal_amount.toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="py-3 text-right font-medium text-sm">
                                                        ₹{inv.current_value.toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="py-3 text-right">
                                                        <div className={`text-sm font-medium ${returns >= 0 ? 'text-[var(--color-accent-green)]' : 'text-[var(--color-accent-red)]'}`}>
                                                            {returns >= 0 ? '+' : ''}₹{returns.toLocaleString('en-IN')}
                                                        </div>
                                                        <div className={`text-xs ${returns >= 0 ? 'text-[var(--color-accent-green)]/80' : 'text-[var(--color-accent-red)]/80'}`}>
                                                            {returns >= 0 ? '+' : ''}{retPct.toFixed(1)}%
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </GlassCard>
                    </div>
                </>
            )}

            <AnimatePresence>
                {isModalOpen && (
                    <InvestmentModal
                        investment={editingInvestment}
                        onClose={() => {
                            setIsModalOpen(false);
                            setEditingInvestment(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
