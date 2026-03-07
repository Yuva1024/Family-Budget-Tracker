'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import { Users, Plus, LogIn as JoinIcon, Loader2 } from 'lucide-react';

/**
 * Shown after sign-up when the user has no family_id yet.
 * They can either create a new family or join one via invite code.
 */
export default function FamilySetup() {
    const { createFamily, joinFamily, signOut } = useAuth();
    const [tab, setTab] = useState<'create' | 'join'>('create');
    const [familyName, setFamilyName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreate = async () => {
        if (!familyName.trim()) return;
        setLoading(true);
        setError(null);
        const { error: err } = await createFamily(familyName.trim());
        if (err) setError(err);
        setLoading(false);
    };

    const handleJoin = async () => {
        if (!inviteCode.trim()) return;
        setLoading(true);
        setError(null);
        const { error: err } = await joinFamily(inviteCode.trim());
        if (err) setError(err);
        setLoading(false);
    };

    const inputClass =
        'w-full bg-white/[0.04] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-accent-cyan)] transition-colors';

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-background)]">
            <div className="absolute top-0 left-0 w-96 h-96 bg-[var(--color-accent-cyan)]/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-[var(--color-accent-violet)]/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', damping: 24, stiffness: 260 }}
                className="w-full max-w-md relative z-10"
            >
                <GlassCard className="!p-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Users size={28} className="text-[var(--color-accent-cyan)]" />
                        <h1 className="text-xl font-bold">Set Up Your Family</h1>
                    </div>
                    <p className="text-sm text-[var(--color-muted)] text-center mb-6">
                        Create a new family group or join an existing one to get started.
                    </p>

                    {/* Tabs */}
                    <div className="flex gap-1 bg-white/[0.03] rounded-full p-1 mb-6">
                        <button
                            onClick={() => { setTab('create'); setError(null); }}
                            className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${tab === 'create' ? 'bg-gradient-to-r from-[var(--color-accent-cyan)] to-[var(--color-accent-blue)] text-white shadow' : 'text-[var(--color-muted)]'}`}
                        >
                            Create Family
                        </button>
                        <button
                            onClick={() => { setTab('join'); setError(null); }}
                            className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${tab === 'join' ? 'bg-gradient-to-r from-[var(--color-accent-violet)] to-[var(--color-accent-blue)] text-white shadow' : 'text-[var(--color-muted)]'}`}
                        >
                            Join Family
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 px-4 py-2.5 rounded-xl bg-[var(--color-accent-red)]/10 border border-[var(--color-accent-red)]/20 text-[var(--color-accent-red)] text-sm">
                            {error}
                        </div>
                    )}

                    {tab === 'create' ? (
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-[var(--color-muted)] font-medium mb-1 block">Family Name</label>
                                <input className={inputClass} value={familyName} onChange={(e) => setFamilyName(e.target.value)} placeholder="e.g. The Smiths" />
                            </div>
                            <Button onClick={handleCreate} disabled={!familyName.trim() || loading} className="w-full" size="lg">
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <><Plus size={16} /> Create Family</>}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-[var(--color-muted)] font-medium mb-1 block">Invite Code</label>
                                <input className={`${inputClass} font-mono uppercase tracking-wider`} value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="FF-XXXXXX" />
                            </div>
                            <Button onClick={handleJoin} disabled={!inviteCode.trim() || loading} className="w-full" size="lg">
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <><JoinIcon size={16} /> Join Family</>}
                            </Button>
                        </div>
                    )}

                    <button onClick={signOut} className="w-full text-center text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)] mt-6 transition-colors">
                        Sign out
                    </button>
                </GlassCard>
            </motion.div>
        </div>
    );
}
