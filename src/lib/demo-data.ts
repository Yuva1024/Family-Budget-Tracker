/* ================================================================
   Demo / seed data — used when Supabase is not configured.
   Every entity references the demo family and demo users.
   ================================================================ */

export interface DemoUser {
    id: string;
    name: string;
    avatar_url: string;
    role: 'admin' | 'member';
}

export interface DemoTask {
    id: string;
    title: string;
    description: string;
    assigned_to: string[];
    deadline: string;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'in-progress' | 'completed';
    created_by: string;
    created_at: string;
    completed_at: string | null;
}

export interface DemoGroceryItem {
    id: string;
    item_name: string;
    quantity: number;
    price: number;
    checked: boolean;
    added_by: string;
    created_at: string;
    completed_at: string | null;
}

export interface DemoExpense {
    id: string;
    title: string;
    amount: number;
    category: string;
    paid_by: string;
    date: string;
    notes: string;
    grocery_item_id?: string | null;
}

export interface DemoMessage {
    id: string;
    user_id: string;
    message: string;
    created_at: string;
}

// ── Users ──
export const demoUsers: DemoUser[] = [
    { id: 'u1', name: 'Alex', avatar_url: '', role: 'admin' },
    { id: 'u2', name: 'Jamie', avatar_url: '', role: 'member' },
    { id: 'u3', name: 'Taylor', avatar_url: '', role: 'member' },
    { id: 'u4', name: 'Morgan', avatar_url: '', role: 'member' },
];

export const currentDemoUser = demoUsers[0];

// ── Tasks ──
export const demoTasks: DemoTask[] = [
    {
        id: 't1',
        title: 'Pick up dry cleaning',
        description: 'From the shop on Main Street before 5 PM.',
        assigned_to: ['u2'],
        deadline: new Date(Date.now() + 3600 * 1000 * 4).toISOString(),
        priority: 'high',
        status: 'pending',
        created_by: 'u1',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        completed_at: null,
    },
    {
        id: 't2',
        title: 'Schedule dentist appointment',
        description: 'For Morgan — preferably next Wednesday.',
        assigned_to: ['u1'],
        deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
        priority: 'medium',
        status: 'pending',
        created_by: 'u3',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        completed_at: null,
    },
    {
        id: 't3',
        title: 'Pay electricity bill',
        description: 'Due amount ₹3,200.',
        assigned_to: ['u1'],
        deadline: new Date(Date.now() + 86400000 * 1).toISOString(),
        priority: 'high',
        status: 'in-progress',
        created_by: 'u1',
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        completed_at: null,
    },
    {
        id: 't4',
        title: 'Fix bathroom tap',
        description: 'Leaking slowly — call plumber or DIY.',
        assigned_to: ['u4'],
        deadline: new Date(Date.now() + 86400000 * 7).toISOString(),
        priority: 'low',
        status: 'pending',
        created_by: 'u2',
        created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        completed_at: null,
    },
    {
        id: 't5',
        title: 'Organize weekend trip',
        description: 'Finalize destination and bookings.',
        assigned_to: ['u1', 'u3'],
        deadline: new Date(Date.now() - 86400000 * 2).toISOString(),
        priority: 'medium',
        status: 'completed',
        created_by: 'u1',
        created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
        completed_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
];

// ── Grocery items ──
export const demoGroceryItems: DemoGroceryItem[] = [
    { id: 'g1', item_name: 'Milk (1L)', quantity: 2, price: 60, checked: false, added_by: 'u1', created_at: new Date().toISOString(), completed_at: null },
    { id: 'g2', item_name: 'Eggs (12 pack)', quantity: 1, price: 85, checked: false, added_by: 'u2', created_at: new Date().toISOString(), completed_at: null },
    { id: 'g3', item_name: 'Bread', quantity: 1, price: 45, checked: true, added_by: 'u1', created_at: new Date().toISOString(), completed_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 'g4', item_name: 'Rice (5 kg)', quantity: 1, price: 350, checked: false, added_by: 'u3', created_at: new Date().toISOString(), completed_at: null },
    { id: 'g5', item_name: 'Tomatoes', quantity: 4, price: 30, checked: true, added_by: 'u4', created_at: new Date().toISOString(), completed_at: new Date(Date.now() - 172800000).toISOString() },
    { id: 'g6', item_name: 'Onions', quantity: 3, price: 25, checked: false, added_by: 'u2', created_at: new Date().toISOString(), completed_at: null },
    { id: 'g7', item_name: 'Cooking oil', quantity: 1, price: 180, checked: false, added_by: 'u1', created_at: new Date().toISOString(), completed_at: null },
];

// ── Expenses ──
export const demoExpenses: DemoExpense[] = [
    { id: 'e1', title: 'Weekly Groceries', amount: 1250, category: 'Groceries', paid_by: 'u1', date: new Date().toISOString().split('T')[0], notes: '' },
    { id: 'e2', title: 'Electricity Bill', amount: 3200, category: 'Utilities', paid_by: 'u1', date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0], notes: 'March bill' },
    { id: 'e3', title: 'Bus Pass', amount: 500, category: 'Transport', paid_by: 'u2', date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0], notes: '' },
    { id: 'e4', title: 'Netflix Subscription', amount: 649, category: 'Misc', paid_by: 'u3', date: new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0], notes: 'Monthly' },
    { id: 'e5', title: 'Rent', amount: 15000, category: 'Rent', paid_by: 'u1', date: new Date(Date.now() - 86400000 * 10).toISOString().split('T')[0], notes: 'March rent' },
    { id: 'e6', title: 'Plumber visit', amount: 800, category: 'Utilities', paid_by: 'u4', date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], notes: 'Kitchen tap' },
];

// ── Messages ──
export const demoMessages: DemoMessage[] = [
    { id: 'm1', user_id: 'u1', message: 'Hey everyone, I updated the grocery list!', created_at: new Date(Date.now() - 3600000 * 2).toISOString() },
    { id: 'm2', user_id: 'u2', message: 'Great, I\'ll pick up the milk on my way home 🥛', created_at: new Date(Date.now() - 3600000 * 1.5).toISOString() },
    { id: 'm3', user_id: 'u3', message: 'Don\'t forget the dentist appointment!', created_at: new Date(Date.now() - 3600000 * 1).toISOString() },
    { id: 'm4', user_id: 'u4', message: 'I paid the plumber today — ₹800.', created_at: new Date(Date.now() - 1800000).toISOString() },
    { id: 'm5', user_id: 'u1', message: 'Thanks Morgan! Should we plan the weekend trip?', created_at: new Date(Date.now() - 600000).toISOString() },
];

/** Helper: get user by id */
export function getDemoUser(id: string): DemoUser | undefined {
    return demoUsers.find((u) => u.id === id);
}
