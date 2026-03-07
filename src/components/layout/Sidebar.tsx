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
    Users,
    Settings,
    LogOut,
} from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { useFamily } from '@/contexts/FamilyContext';
import { useAuth } from '@/contexts/AuthContext';

const links = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/tasks', label: 'Tasks', icon: ListTodo },
    { href: '/groceries', label: 'Groceries', icon: ShoppingCart },
    { href: '/expenses', label: 'Expenses', icon: Wallet },
    { href: '/members', label: 'Members', icon: Users },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user } = useFamily();
    const { signOut } = useAuth();

    return (
        <aside className="hidden lg:flex flex-col w-[240px] h-screen sticky top-0 bg-[var(--color-surface)] border-r border-[var(--color-border)] p-4">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8 px-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-accent-cyan)] to-[var(--color-accent-violet)] flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    FF
                </div>
                <span className="text-lg font-bold tracking-tight">FamilyFlow</span>
            </div>

            {/* Nav links */}
            <nav className="flex-1 flex flex-col gap-1">
                {links.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${active
                                    ? 'bg-[var(--color-accent-cyan)]/10 text-[var(--color-accent-cyan)] shadow-[var(--shadow-glow-cyan)]'
                                    : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-white/[0.03]'
                                }
              `}
                        >
                            <Icon size={20} strokeWidth={active ? 2.2 : 1.6} />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            {/* User footer */}
            <div className="flex items-center gap-3 px-3 py-3 mt-2 rounded-xl bg-white/[0.03] border border-[var(--color-border)]">
                <Avatar name={user.name} size={34} />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-[var(--color-muted)] capitalize">{user.role}</p>
                </div>
                <div className="flex items-center gap-1.5">
                    <Link href="/settings" className="text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors p-1">
                        <Settings size={15} />
                    </Link>
                    <button
                        onClick={() => signOut()}
                        className="text-[var(--color-muted)] hover:text-[var(--color-accent-red)] transition-colors p-1"
                        title="Sign out"
                    >
                        <LogOut size={15} />
                    </button>
                </div>
            </div>
        </aside>
    );
}
