'use client';

import React from 'react';

/** Circle avatar with initials fallback */
export default function Avatar({
    name,
    url,
    size = 32,
    className = '',
}: {
    name: string;
    url?: string;
    size?: number;
    className?: string;
}) {
    const initials = name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const hue = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

    return (
        <div
            className={`flex-shrink-0 rounded-full flex items-center justify-center font-semibold text-white select-none ${className}`}
            style={{
                width: size,
                height: size,
                fontSize: size * 0.38,
                background: url ? `url(${url}) center/cover` : `hsl(${hue}, 55%, 48%)`,
            }}
        >
            {!url && initials}
        </div>
    );
}
