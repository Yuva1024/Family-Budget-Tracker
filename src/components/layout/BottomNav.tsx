'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ListTodo,
    ShoppingCart,
    Wallet,
    MessageCircle,
} from 'lucide-react';

const tabs = [
    { href: '/', label: 'Home', icon: LayoutDashboard },
    { href: '/tasks', label: 'Tasks', icon: ListTodo },
    { href: '/groceries', label: 'Grocery', icon: ShoppingCart },
    { href: '/expenses', label: 'Spend', icon: Wallet },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--color-surface)]/90 backdrop-blur-xl border-t border-[var(--color-border)] safe-area-bottom">
            <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
                {tabs.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`
                flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 min-w-[56px]
                ${active
                                    ? 'text-[var(--color-accent-cyan)]'
                                    : 'text-[var(--color-muted)] active:text-[var(--color-foreground)]'
                                }
              `}
                        >
                            <Icon size={22} strokeWidth={active ? 2.2 : 1.5} />
                            <span className="text-[10px] font-medium">{label}</span>
                            {active && (
                                <span className="absolute top-0 w-6 h-0.5 rounded-full bg-[var(--color-accent-cyan)]" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
