'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useFamily } from '@/contexts/FamilyContext';
import Avatar from '@/components/ui/Avatar';
import { Send } from 'lucide-react';
import { format } from 'date-fns';

export default function ChatPage() {
    const { messages, sendMessage, user, getUserById } = useFamily();
    const [text, setText] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        const trimmed = text.trim();
        if (!trimmed) return;
        sendMessage(trimmed);
        setText('');
    };

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] lg:h-[calc(100vh-5rem)]">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <h1 className="text-2xl lg:text-3xl font-bold">Family Chat</h1>
                <span className="text-xs text-[var(--color-muted)] bg-white/[0.04] px-2.5 py-1 rounded-full">
                    💬 {messages.length} messages
                </span>
            </div>

            {/* Messages area */}
            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto rounded-2xl glass p-4 space-y-4 mb-4"
            >
                {messages.map((msg, i) => {
                    const sender = getUserById(msg.user_id);
                    const isMe = msg.user_id === user.id;
                    return (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03, duration: 0.3 }}
                            className={`flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}
                        >
                            <Avatar name={sender?.name || '?'} size={32} className="flex-shrink-0 mt-0.5" />
                            <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                <span className={`text-[11px] font-medium mb-1 ${isMe ? 'text-right text-[var(--color-accent-cyan)]' : 'text-[var(--color-accent-violet)]'}`}>
                                    {sender?.name || 'Unknown'}
                                </span>
                                <div
                                    className={`
                    px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                    ${isMe
                                            ? 'bg-gradient-to-br from-[var(--color-accent-cyan)]/20 to-[var(--color-accent-blue)]/10 border border-[var(--color-accent-cyan)]/20 rounded-br-md'
                                            : 'bg-white/[0.04] border border-[var(--color-border)] rounded-bl-md'
                                        }
                  `}
                                >
                                    {msg.message}
                                </div>
                                <span className="text-[10px] text-[var(--color-muted)] mt-1 px-1">
                                    {format(new Date(msg.created_at), 'h:mm a')}
                                </span>
                            </div>
                        </motion.div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Input area */}
            <div className="flex items-center gap-3">
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Write a message..."
                    className="flex-1 bg-white/[0.04] border border-[var(--color-border)] rounded-full px-5 py-3 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-accent-cyan)] transition-colors"
                />
                <button
                    onClick={handleSend}
                    disabled={!text.trim()}
                    className="w-11 h-11 rounded-full bg-gradient-to-r from-[var(--color-accent-cyan)] to-[var(--color-accent-blue)] flex items-center justify-center text-white shadow-lg hover:shadow-[var(--shadow-glow-cyan)] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
}
