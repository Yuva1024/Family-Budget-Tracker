'use client';

import React from 'react';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import { useFamily } from '@/contexts/FamilyContext';
import { useAuth } from '@/contexts/AuthContext';
import Avatar from '@/components/ui/Avatar';
import { Settings as SettingsIcon, User, Bell, Palette, Shield, LogOut } from 'lucide-react';

export default function SettingsPage() {
    const { user } = useFamily();
    const { signOut, profile } = useAuth();

    const sections = [
        { icon: User, label: 'Profile', desc: 'Update your name, avatar, and email.' },
        { icon: Bell, label: 'Notifications', desc: 'Manage push and email notifications.' },
        { icon: Palette, label: 'Appearance', desc: 'Theme, font size, and display preferences.' },
        { icon: Shield, label: 'Privacy', desc: 'Data, permissions, and account deletion.' },
    ];

    return (
        <div>
            <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2 mb-6">
                <SettingsIcon className="text-[var(--color-muted)]" size={28} /> Settings
            </h1>

            {/* Profile card */}
            <GlassCard className="flex items-center gap-4 mb-8">
                <Avatar name={user.name} size={56} />
                <div className="flex-1">
                    <p className="text-lg font-semibold">{user.name}</p>
                    <p className="text-xs text-[var(--color-muted)] capitalize">{user.role} · Family Group</p>
                </div>
            </GlassCard>

            <div className="space-y-3">
                {sections.map(({ icon: Icon, label, desc }) => (
                    <GlassCard key={label} hover className="flex items-center gap-4 cursor-pointer">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                            <Icon size={20} className="text-[var(--color-muted)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold">{label}</p>
                            <p className="text-xs text-[var(--color-muted)]">{desc}</p>
                        </div>
                        <span className="text-[var(--color-muted)]">→</span>
                    </GlassCard>
                ))}
            </div>

            {/* Sign Out section */}
            <div className="mt-8">
                <Button variant="danger" size="lg" onClick={() => signOut()} className="w-full">
                    <LogOut size={16} /> Sign Out
                </Button>
            </div>

            <p className="text-xs text-[var(--color-muted)] text-center mt-8">
                FamilyFlow v1.0 · Built with Next.js + Supabase
            </p>
        </div>
    );
}
