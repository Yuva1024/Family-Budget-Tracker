'use client';

import React, { ReactNode } from 'react';

/** Reusable glassmorphic card wrapper */
export default function GlassCard({
    children,
    className = '',
    hover = false,
    onClick,
}: {
    children: ReactNode;
    className?: string;
    hover?: boolean;
    onClick?: () => void;
}) {
    return (
        <div
            onClick={onClick}
            className={`
        glass p-5 transition-all duration-300
        ${hover ? 'hover:bg-[var(--color-card-hover)] hover:shadow-[var(--shadow-glow-cyan)] cursor-pointer hover:-translate-y-0.5' : ''}
        ${className}
      `}
        >
            {children}
        </div>
    );
}
