'use client';

import React, { ReactNode } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { FamilyProvider } from '@/contexts/FamilyContext';
import AppShell from '@/components/layout/AppShell';
import AuthPage from '@/app/auth/page';
import FamilySetup from '@/components/FamilySetup';
import { Loader2 } from 'lucide-react';

/** Innermost gate: show loading / auth / family-setup / app */
function AuthGate({ children }: { children: ReactNode }) {
    const { user, profile, loading, profileLoading } = useAuth();

    // Loading state — wait for BOTH auth session AND profile to resolve
    if (loading || (user && profileLoading)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-accent-cyan)] to-[var(--color-accent-violet)] flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        FF
                    </div>
                    <Loader2 size={24} className="animate-spin text-[var(--color-accent-cyan)]" />
                    <p className="text-sm text-[var(--color-muted)]">Loading FamilyFlow...</p>
                </div>
            </div>
        );
    }

    // Not authenticated → show auth page
    if (!user) {
        return <AuthPage />;
    }

    // Authenticated and profile loaded, but no family → show family setup
    if (!profile?.family_id) {
        return <FamilySetup />;
    }

    // Authenticated and in a family → show the app
    return (
        <FamilyProvider>
            <AppShell>{children}</AppShell>
        </FamilyProvider>
    );
}

/** Client-side providers */
export default function ClientProviders({ children }: { children: ReactNode }) {
    return (
        <AuthProvider>
            <AuthGate>{children}</AuthGate>
        </AuthProvider>
    );
}
