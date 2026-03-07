'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface Profile {
    id: string;
    name: string;
    avatar_url: string | null;
    family_id: string | null;
    role: 'admin' | 'member';
}

interface AuthContextValue {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    loading: boolean;
    profileLoading: boolean;
    familyInviteCode: string | null;
    signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
    createFamily: (familyName: string) => Promise<{ error: string | null }>;
    joinFamily: (inviteCode: string) => Promise<{ error: string | null }>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(true);
    const [familyInviteCode, setFamilyInviteCode] = useState<string | null>(null);

    // ── Profile fetch (single attempt, no retry — the lock fix makes it reliable) ──
    const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
        if (!supabase) return null;
        try {
            const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
            if (error) {
                console.warn('[AuthContext] Profile fetch failed:', error.message);
                return null;
            }
            return data as Profile;
        } catch (err) {
            console.warn('[AuthContext] Profile fetch exception:', err);
            return null;
        }
    }, []);

    const fetchInviteCode = useCallback(async (familyId: string) => {
        if (!supabase) return;
        try {
            const { data } = await supabase.from('families').select('invite_code').eq('id', familyId).single();
            if (data) setFamilyInviteCode(data.invite_code);
        } catch {
            // Non-critical — silently ignore
        }
    }, []);

    const refreshProfile = useCallback(async () => {
        if (user) {
            const p = await fetchProfile(user.id);
            setProfile(p);
            if (p?.family_id) fetchInviteCode(p.family_id);
        }
    }, [user, fetchProfile, fetchInviteCode]);

    // ── Session initialization ──
    useEffect(() => {
        if (!supabase || !isSupabaseConfigured) {
            setProfileLoading(false);
            setLoading(false);
            return;
        }

        const sb = supabase;
        let cancelled = false;

        // Use getSession() for initial restore. With our custom in-memory lock,
        // this no longer fights with navigator.locks.
        const init = async () => {
            try {
                const { data: { session: s } } = await sb.auth.getSession();
                if (cancelled) return;

                setSession(s);
                setUser(s?.user ?? null);

                if (s?.user) {
                    const p = await fetchProfile(s.user.id);
                    if (cancelled) return;
                    setProfile(p);
                    if (p?.family_id) fetchInviteCode(p.family_id);
                }
            } catch (err) {
                console.warn('[AuthContext] Session restore error:', err);
            } finally {
                if (!cancelled) {
                    setProfileLoading(false);
                    setLoading(false);
                }
            }
        };

        init();

        // Listen for ongoing auth changes (sign-in, sign-out, token refresh)
        const { data: { subscription } } = sb.auth.onAuthStateChange(async (event, s) => {
            // Skip INITIAL_SESSION — we already handled it above via getSession()
            if (event === 'INITIAL_SESSION') return;

            setSession(s);
            setUser(s?.user ?? null);

            if (s?.user) {
                if (event === 'SIGNED_IN') {
                    setProfileLoading(true);
                }
                const p = await fetchProfile(s.user.id);
                setProfile(p);
                if (p?.family_id) fetchInviteCode(p.family_id);
                setProfileLoading(false);
            } else {
                setProfile(null);
                setFamilyInviteCode(null);
                setProfileLoading(false);
            }
        });

        return () => {
            cancelled = true;
            subscription.unsubscribe();
        };
    }, [fetchProfile, fetchInviteCode]);

    // ── Auth actions ──
    const signUp = useCallback(async (email: string, password: string, name: string) => {
        if (!supabase) return { error: 'Supabase not configured' };
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) return { error: error.message };
        if (data.user) {
            const { error: profileErr } = await supabase.from('profiles').insert({ id: data.user.id, name, role: 'member' });
            if (profileErr) return { error: profileErr.message };
        }
        return { error: null };
    }, []);

    const signIn = useCallback(async (email: string, password: string) => {
        if (!supabase) return { error: 'Supabase not configured' };
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error: error.message };
        return { error: null };
    }, []);

    const signOut = useCallback(async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setSession(null);
        setFamilyInviteCode(null);
    }, []);

    const createFamily = useCallback(async (familyName: string) => {
        if (!supabase || !user) return { error: 'Not authenticated' };
        const code = `FF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const { data, error } = await supabase.from('families').insert({ name: familyName, invite_code: code }).select().single();
        if (error) return { error: error.message };
        const { error: updateErr } = await supabase.from('profiles').update({ family_id: data.id, role: 'admin' }).eq('id', user.id);
        if (updateErr) return { error: updateErr.message };
        setFamilyInviteCode(code);
        await refreshProfile();
        return { error: null };
    }, [user, refreshProfile]);

    const joinFamily = useCallback(async (inviteCode: string) => {
        if (!supabase || !user) return { error: 'Not authenticated' };
        const code = inviteCode.trim().toUpperCase();
        if (!code) return { error: 'Please enter an invite code' };
        const { data: family, error: findErr } = await supabase
            .from('families')
            .select('id')
            .eq('invite_code', code)
            .maybeSingle();
        if (findErr) return { error: `Database error: ${findErr.message}` };
        if (!family) return { error: `No family found with code "${code}". Please check the code and try again.` };
        const { error: updateErr } = await supabase.from('profiles').update({ family_id: family.id, role: 'member' }).eq('id', user.id);
        if (updateErr) return { error: updateErr.message };
        await refreshProfile();
        return { error: null };
    }, [user, refreshProfile]);

    return (
        <AuthContext.Provider
            value={{ user, profile, session, loading, profileLoading, familyInviteCode, signUp, signIn, signOut, createFamily, joinFamily, refreshProfile }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
    return ctx;
}
