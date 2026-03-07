'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useFamily } from '@/contexts/FamilyContext';
import { useAuth } from '@/contexts/AuthContext';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { Users, Copy, Check, Shield, User } from 'lucide-react';

export default function MembersPage() {
    const { members, user } = useFamily();
    const { familyInviteCode } = useAuth();
    const [copied, setCopied] = useState(false);

    const inviteCode = familyInviteCode || 'Loading...';

    const handleCopy = () => {
        if (!familyInviteCode) return;
        navigator.clipboard.writeText(familyInviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
                    <Users className="text-[var(--color-accent-blue)]" size={28} /> Family Members
                </h1>
            </div>

            {/* Invite card */}
            <GlassCard className="mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--color-accent-cyan)]/5 rounded-full blur-3xl translate-x-12 -translate-y-12" />
                <h2 className="text-sm font-semibold mb-2">Invite Family Members</h2>
                <p className="text-xs text-[var(--color-muted)] mb-4">Share this code to invite new members to your family group.</p>
                <div className="flex items-center gap-3">
                    <div className="flex-1 bg-white/[0.04] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm font-mono tracking-wider text-[var(--color-accent-cyan)] select-all">
                        {inviteCode}
                    </div>
                    <Button variant="secondary" size="md" onClick={handleCopy} disabled={!familyInviteCode}>
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? 'Copied!' : 'Copy'}
                    </Button>
                </div>
            </GlassCard>

            {/* Members list */}
            <div className="grid sm:grid-cols-2 gap-4">
                {members.map((member, i) => {
                    const isCurrentUser = member.id === user.id;
                    return (
                        <motion.div
                            key={member.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08, duration: 0.4 }}
                        >
                            <GlassCard hover className="flex items-center gap-4">
                                <Avatar name={member.name} size={48} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold">{member.name}</p>
                                        {isCurrentUser && (
                                            <span className="text-[10px] bg-[var(--color-accent-cyan)]/10 text-[var(--color-accent-cyan)] px-1.5 py-0.5 rounded-full">You</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-[var(--color-muted)] capitalize">{member.role}</p>
                                </div>
                                <Badge color={member.role === 'admin' ? 'violet' : 'muted'}>
                                    {member.role === 'admin' ? <Shield size={12} /> : <User size={12} />}
                                    {member.role}
                                </Badge>
                            </GlassCard>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
