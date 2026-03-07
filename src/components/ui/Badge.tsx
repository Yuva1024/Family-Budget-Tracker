'use client';

import React from 'react';

const colors: Record<string, string> = {
    cyan: 'bg-[var(--color-accent-cyan)]/15 text-[var(--color-accent-cyan)]',
    violet: 'bg-[var(--color-accent-violet)]/15 text-[var(--color-accent-violet)]',
    green: 'bg-[var(--color-accent-green)]/15 text-[var(--color-accent-green)]',
    yellow: 'bg-[var(--color-accent-yellow)]/15 text-[var(--color-accent-yellow)]',
    red: 'bg-[var(--color-accent-red)]/15 text-[var(--color-accent-red)]',
    blue: 'bg-[var(--color-accent-blue)]/15 text-[var(--color-accent-blue)]',
    orange: 'bg-[var(--color-accent-orange)]/15 text-[var(--color-accent-orange)]',
    muted: 'bg-white/5 text-[var(--color-muted)]',
};

export default function Badge({
    children,
    color = 'muted',
    className = '',
}: {
    children: React.ReactNode;
    color?: keyof typeof colors;
    className?: string;
}) {
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[color] || colors.muted} ${className}`}
        >
            {children}
        </span>
    );
}
