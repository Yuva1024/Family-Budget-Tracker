'use client';

import React, { ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

const base =
    'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-accent-cyan)] disabled:opacity-50 disabled:pointer-events-none select-none';

const sizes: Record<string, string> = {
    sm: 'px-3.5 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3 text-base',
};

const variants: Record<Variant, string> = {
    primary:
        'bg-gradient-to-r from-[var(--color-accent-cyan)] to-[var(--color-accent-blue)] text-white shadow-lg hover:shadow-[var(--shadow-glow-cyan)] hover:brightness-110',
    secondary:
        'border border-[var(--color-border-active)] text-[var(--color-foreground)] hover:bg-[var(--color-card-hover)]',
    danger:
        'bg-[var(--color-accent-red)] text-white hover:brightness-110',
    ghost:
        'text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-card)]',
};

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    ...props
}: {
    children: ReactNode;
    variant?: Variant;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
            {children}
        </button>
    );
}
