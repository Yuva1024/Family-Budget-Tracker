'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useFamily } from '@/contexts/FamilyContext';
import { useAuth } from '@/contexts/AuthContext';
import { copyToClipboard } from '@/lib/utils/clipboard';
import GlassCard from '@/components/ui/GlassCard';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import {
  ListTodo,
  CheckCircle2,
  Wallet,
  ShoppingCart,
  Clock,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Users,
  Copy,
  Check,
} from 'lucide-react';
import { format, isBefore, addHours } from 'date-fns';

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.45, ease: 'easeOut' as const } }),
};

export default function DashboardPage() {
  const { user, tasks, groceryItems, expenses, members, getUserById } = useFamily();
  const { familyInviteCode } = useAuth();

  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    if (!familyInviteCode) return;
    const success = await copyToClipboard(familyInviteCode);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const pendingTasks = tasks.filter((t) => t.status !== 'completed');
  const completedToday = tasks.filter(
    (t) => t.status === 'completed' && t.completed_at && new Date(t.completed_at).toDateString() === new Date().toDateString(),
  );
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const pendingGroceries = groceryItems.filter((g) => !g.checked);
  const urgentTasks = pendingTasks.filter(
    (t) => t.deadline && isBefore(new Date(t.deadline), addHours(new Date(), 24)),
  );

  return (
    <div>
      {/* Welcome header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-1">
          Welcome back, <span className="bg-gradient-to-r from-[var(--color-accent-cyan)] to-[var(--color-accent-violet)] bg-clip-text text-transparent">{user.name}</span>
        </h1>
        <p className="text-[var(--color-muted)] text-sm">
          {format(new Date(), 'EEEE, MMMM d, yyyy')} — Here&apos;s your family overview.
        </p>
      </motion.div>

      {/* Stat cards — clickable */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8">
        {[
          { label: 'Pending Tasks', value: pendingTasks.length, icon: ListTodo, color: 'var(--color-accent-cyan)', href: '/tasks' },
          { label: 'Completed Today', value: completedToday.length, icon: CheckCircle2, color: 'var(--color-accent-green)', href: '/tasks' },
          { label: 'Budget Spent', value: `₹${totalExpenses.toLocaleString()}`, icon: Wallet, color: 'var(--color-accent-violet)', href: '/expenses' },
          { label: 'Grocery Pending', value: pendingGroceries.length, icon: ShoppingCart, color: 'var(--color-accent-yellow)', href: '/groceries' },
        ].map((stat, i) => (
          <motion.div key={stat.label} custom={i} variants={fadeUp} initial="hidden" animate="show">
            <Link href={stat.href}>
              <GlassCard hover className="flex flex-col gap-3 cursor-pointer">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--color-muted)] font-medium uppercase tracking-wider">{stat.label}</span>
                  <stat.icon size={18} style={{ color: stat.color }} />
                </div>
                <span className="text-2xl lg:text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</span>
              </GlassCard>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Asymmetric two-column layout — clickable sections */}
      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-4 lg:gap-5 mb-8">
        {/* Left — Tasks */}
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show">
          <Link href="/tasks" className="block h-full">
            <GlassCard hover className="h-full cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <Clock size={16} className="text-[var(--color-accent-cyan)]" /> Today&apos;s Tasks
                </h2>
                <div className="flex items-center gap-2">
                  {urgentTasks.length > 0 && (
                    <Badge color="red"><AlertTriangle size={12} /> {urgentTasks.length} urgent</Badge>
                  )}
                  <ArrowRight size={16} className="text-[var(--color-muted)]" />
                </div>
              </div>
              <div className="space-y-3">
                {pendingTasks.slice(0, 5).map((task) => {
                  const creator = getUserById(task.created_by);
                  const isUrgent = task.deadline && isBefore(new Date(task.deadline), addHours(new Date(), 24));
                  return (
                    <div
                      key={task.id}
                      className={`flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-[var(--color-border)] ${isUrgent ? 'border-l-2 border-l-[var(--color-accent-red)]' : ''}`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 priority-dot-${task.priority}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <p className="text-xs text-[var(--color-muted)] mt-0.5">
                          {task.deadline ? format(new Date(task.deadline), 'MMM d, h:mm a') : 'No deadline'}
                          {creator && ` · by ${creator.name}`}
                        </p>
                      </div>
                      <Badge color={task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'yellow' : 'green'}>{task.priority}</Badge>
                    </div>
                  );
                })}
                {pendingTasks.length === 0 && <p className="text-sm text-[var(--color-muted)] text-center py-6">No pending tasks — add one!</p>}
              </div>
            </GlassCard>
          </Link>
        </motion.div>

        {/* Right — Budget + Grocery */}
        <div className="space-y-4 lg:space-y-5">
          <motion.div custom={5} variants={fadeUp} initial="hidden" animate="show">
            <Link href="/expenses" className="block">
              <GlassCard hover className="relative overflow-hidden cursor-pointer">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-accent-violet)]/5 rounded-full blur-2xl -translate-y-8 translate-x-8" />
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold flex items-center gap-2">
                    <TrendingUp size={16} className="text-[var(--color-accent-violet)]" /> Budget Overview
                  </h2>
                  <ArrowRight size={16} className="text-[var(--color-muted)]" />
                </div>
                <div className="space-y-2">
                  {['Groceries', 'Utilities', 'Rent', 'Transport', 'Misc'].map((cat) => {
                    const catTotal = expenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0);
                    if (catTotal === 0) return null;
                    const pct = totalExpenses > 0 ? Math.min((catTotal / totalExpenses) * 100, 100) : 0;
                    return (
                      <div key={cat}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-[var(--color-muted)]">{cat}</span>
                          <span className="font-medium">₹{catTotal.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/[0.06]">
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent-violet)] to-[var(--color-accent-cyan)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {totalExpenses === 0 && <p className="text-sm text-[var(--color-muted)] text-center py-4">No expenses yet</p>}
                </div>
                {totalExpenses > 0 && (
                  <p className="text-right text-sm font-semibold mt-3 text-[var(--color-accent-violet)]">Total: ₹{totalExpenses.toLocaleString()}</p>
                )}
              </GlassCard>
            </Link>
          </motion.div>

          <motion.div custom={6} variants={fadeUp} initial="hidden" animate="show">
            <Link href="/groceries" className="block">
              <GlassCard hover className="cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold flex items-center gap-2">
                    <ShoppingCart size={16} className="text-[var(--color-accent-yellow)]" /> Grocery Activity
                  </h2>
                  <ArrowRight size={16} className="text-[var(--color-muted)]" />
                </div>
                <ul className="space-y-2">
                  {groceryItems.slice(0, 4).map((g) => {
                    const addedBy = getUserById(g.added_by);
                    return (
                      <li key={g.id} className="flex items-center gap-3 text-sm">
                        <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${g.checked ? 'bg-[var(--color-accent-green)] border-[var(--color-accent-green)] text-white' : 'border-[var(--color-border-active)]'}`}>
                          {g.checked && '✓'}
                        </span>
                        <span className={`flex-1 ${g.checked ? 'line-through text-[var(--color-muted)]' : ''}`}>{g.item_name}</span>
                        {addedBy && <Avatar name={addedBy.name} size={20} />}
                      </li>
                    );
                  })}
                  {groceryItems.length === 0 && <p className="text-sm text-[var(--color-muted)] text-center py-4">No grocery items yet</p>}
                </ul>
              </GlassCard>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Bottom Section — Members (Mobile Friendly) */}
      <motion.div custom={7} variants={fadeUp} initial="hidden" animate="show" className="mb-8">
        <GlassCard className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--color-accent-blue)]/5 rounded-full blur-3xl translate-x-12 -translate-y-12" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

            {/* Members List */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <Users size={16} className="text-[var(--color-accent-blue)]" /> Family Members
                </h2>
                <Link href="/members" className="text-xs text-[var(--color-accent-cyan)] hover:underline flex items-center gap-1">
                  View all <ArrowRight size={12} />
                </Link>
              </div>
              <div className="flex -space-x-3 overflow-x-auto pb-2">
                {members.slice(0, 6).map((member) => (
                  <div key={member.id} className="relative group">
                    <Avatar name={member.name} size={40} className="ring-2 ring-[var(--color-card)] relative z-10 transition-transform group-hover:-translate-y-1" />
                  </div>
                ))}
                {members.length > 6 && (
                  <div className="w-10 h-10 rounded-full bg-white/[0.05] border-2 border-[var(--color-card)] flex items-center justify-center text-xs font-semibold relative z-10">
                    +{members.length - 6}
                  </div>
                )}
                {members.length === 0 && <p className="text-sm text-[var(--color-muted)]">No members found</p>}
              </div>
            </div>

            {/* Invite Code */}
            <div className="md:w-72 bg-white/[0.02] border border-[var(--color-border)] rounded-2xl p-4">
              <h3 className="text-xs font-semibold text-[var(--color-muted)] mb-2 uppercase tracking-wider">Family Invite Code</h3>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white/[0.04] rounded-lg px-3 py-2 text-sm font-mono tracking-wider text-[var(--color-accent-cyan)] select-all truncate">
                  {familyInviteCode || 'Loading...'}
                </div>
                <button
                  onClick={handleCopy}
                  disabled={!familyInviteCode}
                  className="w-10 h-10 flex items-center justify-center rounded-lg bg-[var(--color-accent-cyan)]/10 text-[var(--color-accent-cyan)] hover:bg-[var(--color-accent-cyan)]/20 transition-colors disabled:opacity-50"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

    </div>
  );
}
