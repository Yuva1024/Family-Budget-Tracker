'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFamily } from '@/contexts/FamilyContext';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import { Plus, Search, Clock, AlertTriangle, CheckCircle, ChevronDown, Edit2, Trash2 } from 'lucide-react';
import { format, isBefore, addHours } from 'date-fns';

type Tab = 'pending' | 'in-progress' | 'completed';

const tabColors: Record<Tab, string> = {
    pending: 'var(--color-accent-cyan)',
    'in-progress': 'var(--color-accent-yellow)',
    completed: 'var(--color-accent-green)',
};

export default function TasksPage() {
    const { tasks, members, user, addTask, updateTaskStatus, updateTask, deleteTask, getUserById } = useFamily();

    const [tab, setTab] = useState<Tab>('pending');
    const [search, setSearch] = useState('');
    const [filterPriority, setFilterPriority] = useState<string>('all');
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

    // New task form
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [newDeadline, setNewDeadline] = useState('');
    const [newAssigned, setNewAssigned] = useState<string[]>([]);

    const filteredTasks = useMemo(() => {
        return tasks
            .filter((t) => t.status === tab)
            .filter((t) => !search || t.title.toLowerCase().includes(search.toLowerCase()))
            .filter((t) => filterPriority === 'all' || t.priority === filterPriority)
            .sort((a, b) => {
                if (a.deadline && b.deadline) return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
                return 0;
            });
    }, [tasks, tab, search, filterPriority]);

    const handleSubmitTask = () => {
        if (!newTitle.trim()) return;

        if (editMode && editingTaskId) {
            updateTask(editingTaskId, {
                title: newTitle.trim(),
                description: newDesc.trim(),
                priority: newPriority,
                deadline: newDeadline || new Date(Date.now() + 86400000 * 3).toISOString(),
                assigned_to: newAssigned.length ? newAssigned : [user.id],
            });
        } else {
            addTask({
                title: newTitle.trim(),
                description: newDesc.trim(),
                priority: newPriority,
                deadline: newDeadline || new Date(Date.now() + 86400000 * 3).toISOString(),
                assigned_to: newAssigned.length ? newAssigned : [user.id],
                created_by: user.id,
                status: 'pending',
            });
        }

        handleCloseModal();
    };

    const handleEditTaskClick = (task: any) => {
        setEditMode(true);
        setEditingTaskId(task.id);
        setNewTitle(task.title);
        setNewDesc(task.description || '');
        setNewPriority(task.priority);
        setNewDeadline(task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '');
        setNewAssigned(task.assigned_to || []);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditMode(false);
        setEditingTaskId(null);
        setNewTitle('');
        setNewDesc('');
        setNewPriority('medium');
        setNewDeadline('');
        setNewAssigned([]);
    };

    const inputClass =
        'w-full bg-white/[0.04] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-accent-cyan)] transition-colors';

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl lg:text-3xl font-bold">Tasks</h1>
                <Button onClick={() => { handleCloseModal(); setShowModal(true); }} size="md">
                    <Plus size={16} /> New Task
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                {(['pending', 'in-progress', 'completed'] as Tab[]).map((t) => {
                    const count = tasks.filter((tk) => tk.status === t).length;
                    return (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap
                ${t === tab ? 'text-white shadow-lg' : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)] bg-white/[0.03]'}
              `}
                            style={t === tab ? { background: tabColors[t] } : undefined}
                        >
                            {t === 'in-progress' ? 'In Progress' : t.charAt(0).toUpperCase() + t.slice(1)} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-5">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
                    <input
                        type="text"
                        placeholder="Search tasks..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={`${inputClass} pl-10`}
                    />
                </div>
                <div className="relative">
                    <select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        className={`${inputClass} appearance-none pr-8 min-w-[130px]`}
                    >
                        <option value="all">All Priority</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] pointer-events-none" />
                </div>
            </div>

            {/* Task list */}
            <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                    {filteredTasks.map((task) => {
                        const creator = getUserById(task.created_by);
                        const isUrgent = task.deadline && isBefore(new Date(task.deadline), addHours(new Date(), 24)) && task.status !== 'completed';
                        return (
                            <motion.div
                                key={task.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -30 }}
                                transition={{ duration: 0.3 }}
                            >
                                <GlassCard
                                    hover
                                    className={`relative group ${isUrgent ? 'border-l-2 border-l-[var(--color-accent-red)]' : ''}`}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className={`w-2 h-2 rounded-full flex-shrink-0 priority-dot-${task.priority}`} />
                                                <h3 className="text-sm font-semibold truncate">{task.title}</h3>
                                                {isUrgent && (
                                                    <AlertTriangle size={14} className="text-[var(--color-accent-red)] flex-shrink-0" />
                                                )}
                                            </div>
                                            {task.description && (
                                                <p className="text-xs text-[var(--color-muted)] mb-2 line-clamp-1">{task.description}</p>
                                            )}
                                            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
                                                <span className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {task.deadline ? format(new Date(task.deadline), 'MMM d, h:mm a') : 'No deadline'}
                                                </span>
                                                {creator && <span>· by {creator.name}</span>}
                                                {task.completed_at && (
                                                    <span className="flex items-center gap-1 text-[var(--color-accent-green)]">
                                                        <CheckCircle size={12} /> {format(new Date(task.completed_at), 'MMM d, h:mm a')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <Badge color={task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'yellow' : 'green'}>
                                                {task.priority}
                                            </Badge>
                                            {/* Assigned avatars */}
                                            <div className="flex -space-x-1.5">
                                                {task.assigned_to.slice(0, 3).map((uid) => {
                                                    const m = getUserById(uid);
                                                    return m ? <Avatar key={uid} name={m.name} size={24} className="ring-2 ring-[var(--color-card)]" /> : null;
                                                })}
                                            </div>

                                            {/* Edit & Delete Actions */}
                                            {user.id === task.created_by && (
                                                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEditTaskClick(task)} className="p-1.5 text-[var(--color-muted)] hover:text-[#00c2ff] transition-colors rounded-lg hover:bg-white/[0.05]">
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button onClick={() => deleteTask(task.id)} className="p-1.5 text-[var(--color-muted)] hover:text-[#ff4e4e] transition-colors rounded-lg hover:bg-white/[0.05]">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            )}

                                            {/* Status actions */}
                                            {task.status === 'pending' && (
                                                <Button size="sm" variant="ghost" onClick={() => updateTaskStatus(task.id, 'in-progress')}>
                                                    Start
                                                </Button>
                                            )}
                                            {task.status === 'in-progress' && (
                                                <Button size="sm" variant="primary" onClick={() => updateTaskStatus(task.id, 'completed')}>
                                                    Complete
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                {filteredTasks.length === 0 && (
                    <p className="text-center text-[var(--color-muted)] py-12 text-sm">
                        No {tab} tasks found.
                    </p>
                )}
            </div>

            {/* ── New Task Modal ── */}
            <Modal open={showModal} onClose={handleCloseModal} title={editMode ? "Edit Task" : "Create New Task"}>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-[var(--color-muted)] font-medium mb-1 block">Title *</label>
                        <input className={inputClass} value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Buy medicine" />
                    </div>
                    <div>
                        <label className="text-xs text-[var(--color-muted)] font-medium mb-1 block">Description</label>
                        <textarea className={`${inputClass} resize-none h-20`} value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Optional details..." />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-[var(--color-muted)] font-medium mb-1 block">Priority</label>
                            <select className={`${inputClass} appearance-none`} value={newPriority} onChange={(e) => setNewPriority(e.target.value as 'low' | 'medium' | 'high')}>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-[var(--color-muted)] font-medium mb-1 block">Deadline</label>
                            <input type="datetime-local" className={inputClass} value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-[var(--color-muted)] font-medium mb-1 block">Assign to</label>
                        <div className="flex flex-wrap gap-2">
                            {members.map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() =>
                                        setNewAssigned((p) => (p.includes(m.id) ? p.filter((x) => x !== m.id) : [...p, m.id]))
                                    }
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${newAssigned.includes(m.id)
                                        ? 'border-[var(--color-accent-cyan)] bg-[var(--color-accent-cyan)]/10 text-[var(--color-accent-cyan)]'
                                        : 'border-[var(--color-border)] text-[var(--color-muted)] hover:bg-white/[0.03]'
                                        }`}
                                >
                                    <Avatar name={m.name} size={18} />
                                    {m.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="ghost" onClick={handleCloseModal}>Cancel</Button>
                        <Button onClick={handleSubmitTask} disabled={!newTitle.trim()}>{editMode ? 'Save Changes' : 'Create Task'}</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
