'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import { LogIn, UserPlus, Eye, EyeOff, Loader2 } from 'lucide-react';

type Mode = 'login' | 'signup';

export default function AuthPage() {
    const { signIn, signUp } = useAuth();
    const [mode, setMode] = useState<Mode>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        if (mode === 'signup') {
            if (!name.trim()) { setError('Name is required'); setLoading(false); return; }
            const { error: err } = await signUp(email, password, name.trim());
            if (err) {
                setError(err);
            } else {
                setSuccess('Account created! Check your email for confirmation, then log in.');
                setMode('login');
            }
        } else {
            const { error: err } = await signIn(email, password);
            if (err) {
                setError(err);
            }
            // If successful, the auth listener in AuthContext will update the state
            // and the providers will redirect away from /auth
        }
        setLoading(false);
    };

    const inputClass =
        'w-full bg-white/[0.04] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-accent-cyan)] transition-colors';

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-background)]">
            {/* Decorative blobs */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-[var(--color-accent-cyan)]/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-[var(--color-accent-violet)]/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', damping: 24, stiffness: 260 }}
                className="glass-strong w-full max-w-md p-8 relative z-10"
            >
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[var(--color-accent-cyan)] to-[var(--color-accent-violet)] flex items-center justify-center text-white font-bold text-base shadow-lg">
                        FF
                    </div>
                    <span className="text-2xl font-bold tracking-tight">FamilyFlow</span>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-white/[0.03] rounded-full p-1 mb-6">
                    {(['login', 'signup'] as Mode[]).map((m) => (
                        <button
                            key={m}
                            onClick={() => { setMode(m); setError(null); setSuccess(null); }}
                            className={`flex-1 py-2 rounded-full text-sm font-medium transition-all ${mode === m
                                    ? 'bg-gradient-to-r from-[var(--color-accent-cyan)] to-[var(--color-accent-blue)] text-white shadow'
                                    : 'text-[var(--color-muted)]'
                                }`}
                        >
                            {m === 'login' ? 'Log In' : 'Sign Up'}
                        </button>
                    ))}
                </div>

                {/* Error / Success messages */}
                {error && (
                    <div className="mb-4 px-4 py-2.5 rounded-xl bg-[var(--color-accent-red)]/10 border border-[var(--color-accent-red)]/20 text-[var(--color-accent-red)] text-sm">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-4 px-4 py-2.5 rounded-xl bg-[var(--color-accent-green)]/10 border border-[var(--color-accent-green)]/20 text-[var(--color-accent-green)] text-sm">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'signup' && (
                        <div>
                            <label className="text-xs text-[var(--color-muted)] font-medium mb-1 block">Name</label>
                            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
                        </div>
                    )}
                    <div>
                        <label className="text-xs text-[var(--color-muted)] font-medium mb-1 block">Email</label>
                        <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                    </div>
                    <div>
                        <label className="text-xs text-[var(--color-muted)] font-medium mb-1 block">Password</label>
                        <div className="relative">
                            <input
                                className={`${inputClass} pr-10`}
                                type={showPw ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                minLength={6}
                                required
                            />
                            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">
                                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                    <Button type="submit" className="w-full" size="lg" disabled={loading}>
                        {loading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : mode === 'login' ? (
                            <><LogIn size={16} /> Log In</>
                        ) : (
                            <><UserPlus size={16} /> Create Account</>
                        )}
                    </Button>
                </form>
            </motion.div>
        </div>
    );
}
