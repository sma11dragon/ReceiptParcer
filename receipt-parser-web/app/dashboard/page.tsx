"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ScanLine, LogOut, Bot, Check, AlertCircle, Plus, Trash2, TrendingUp, PieChart as PieChartIcon, Activity, Sparkles, MessageSquare, Filter, Calendar, Search, ArrowUpDown, ChevronDown, FileText, ExternalLink, ArrowUp, ArrowDown } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useMobile } from '@/hooks/useMobile';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Label, Line, ComposedChart } from 'recharts';

// Vibrant Multicolor Palette
const COLORS = ['#F472B6', '#38BDF8', '#A78BFA', '#34D399', '#FBBF24', '#FB7185', '#22D3EE', '#C084FC'];

const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent, index, name } = props;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return percent > 0.05 ? (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={10}>
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    ) : null;
};

// Category color mapping - consistent colors for categories
const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
    'Meals - Breakfast': { bg: '#fef3c7', text: '#d97706' },
    'Meals - Lunch': { bg: '#dbeafe', text: '#2563eb' },
    'Meals - Dinner': { bg: '#ede9fe', text: '#7c3aed' },
    'Meals - Drinks': { bg: '#fce7f3', text: '#db2777' },
    'Groceries': { bg: '#d1fae5', text: '#059669' },
    'Transport': { bg: '#cffafe', text: '#0891b2' },
    'Shopping': { bg: '#ffedd5', text: '#ea580c' },
    'Entertainment': { bg: '#f3e8ff', text: '#9333ea' },
    'Healthcare': { bg: '#fee2e2', text: '#dc2626' },
    'Utilities': { bg: '#f1f5f9', text: '#475569' },
    'Travel': { bg: '#ecfccb', text: '#65a30d' },
    'Others': { bg: '#f3f4f6', text: '#4b5563' },
};

const getCategoryColor = (category: string) => {
    // Check for exact match first
    if (CATEGORY_COLORS[category]) {
        return CATEGORY_COLORS[category];
    }
    // Check for partial matches
    for (const [key, value] of Object.entries(CATEGORY_COLORS)) {
        if (category.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(category.toLowerCase())) {
            return value;
        }
    }
    // Generate consistent color from category string hash
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
        hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
        { bg: '#dbeafe', text: '#1e40af' },
        { bg: '#fce7f3', text: '#be185d' },
        { bg: '#d1fae5', text: '#047857' },
        { bg: '#fef3c7', text: '#b45309' },
        { bg: '#ede9fe', text: '#5b21b6' },
        { bg: '#cffafe', text: '#0e7490' },
        { bg: '#ffedd5', text: '#9a3412' },
        { bg: '#fee2e2', text: '#991b1b' },
    ];
    return colors[Math.abs(hash) % colors.length];
};



export default function DashboardPage() {
    const { t } = useLanguage();
    const router = useRouter();
    const isMobile = useMobile();
    const [user, setUser] = useState<any>(null);
    const [bots, setBots] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [metrics, setMetrics] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dataLoading, setDataLoading] = useState(false);
    const [isBotLoading, setIsBotLoading] = useState(false);
    const [newToken, setNewToken] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [hoveredReceipt, setHoveredReceipt] = useState<number | null>(null);
    const [editingExpense, setEditingExpense] = useState<any>(null);
    const [editForm, setEditForm] = useState<any>({});
    const [isUpdating, setIsUpdating] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showBotHelpDashboard, setShowBotHelpDashboard] = useState(false);

    // Filters State
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        botId: '',
        category: '',
        search: '',
        sortBy: 'expense_date',
        sortOrder: 'DESC',
        groupby: 'month'
    });

    // Table sorting state
    const [tableSort, setTableSort] = useState({
        field: 'expense_date',
        direction: 'DESC' as 'ASC' | 'DESC'
    });

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            fetchInitialData(parsedUser.id);
        } else {
            router.push('/login');
        }
    }, [router]);

    const fetchInitialData = async (userId: number) => {
        setIsLoading(true);
        try {
            const botsRes = await fetch(`/api/bots?userId=${userId}`);
            const botsData = await botsRes.json();
            if (botsData.success) setBots(botsData.bots);
            await fetchData(userId, filters);
        } catch (err) {
            console.error('Fetch initial error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchData = useCallback(async (userId: number, currentFilters: any) => {
        setDataLoading(true);
        try {
            const queryParams = new URLSearchParams({
                userId: String(userId),
                ...Object.fromEntries(Object.entries(currentFilters).filter(([_, v]) => v !== ''))
            } as any).toString();

            const [metricsRes, expensesRes] = await Promise.all([
                fetch(`/api/metrics?${queryParams}`),
                fetch(`/api/expenses?${queryParams}`)
            ]);

            const metricsData = await metricsRes.json();
            const expensesData = await expensesRes.json();

            if (metricsData.success) setMetrics(metricsData.metrics);
            if (expensesData.success) setExpenses(expensesData.expenses);
        } catch (err) {
            console.error('Fetch data error:', err);
        } finally {
            setDataLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) {
            const timer = setTimeout(() => {
                fetchData(user.id, filters);
            }, 300); // Debounce
            return () => clearTimeout(timer);
        }
    }, [filters, user, fetchData]);

    // Update table sort state when filters change
    useEffect(() => {
        setTableSort({
            field: filters.sortBy,
            direction: filters.sortOrder as 'ASC' | 'DESC'
        });
    }, [filters.sortBy, filters.sortOrder]);

    const handleAddBot = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newToken) return;

        setIsBotLoading(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch('/api/bots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, token: newToken })
            });
            const data = await res.json();

            if (data.success) {
                setBots([data.bot, ...bots]);
                // Store token for success message before clearing
                const addedToken = newToken;
                setNewToken('');
                setSuccess(t.dashboard.bots.added + ' Go to your bot in Telegram and send "/start ' + addedToken + '" to link your account.');
            } else {
                setError(data.error || t.dashboard.bots.error_adding);
            }
        } catch (err) {
            setError(t.auth.network_error);
        } finally {
            setIsBotLoading(false);
        }
    };

    const handleDeleteBot = async (botId: number) => {
        if (!confirm(t.dashboard.bots.delete_confirm)) return;

        try {
            const res = await fetch(`/api/bots/${botId}?userId=${user.id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                setBots(bots.filter(b => b.id !== botId));
            }
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        router.push('/login');
    };

    const handleExportCSV = () => {
        if (!expenses.length) return;
        const headers = ['Date', 'Vendor', 'Category', 'Amount (SGD)', 'Bot', 'Location', 'Comment'];
        const rows = expenses.map(e => [
            new Date(e.expense_date).toLocaleDateString(),
            `"${e.vendor || ''}"`,
            e.category || '',
            e.amount_sgd,
            e.bot_username || 'Direct',
            `"${e.location || ''}"`,
            `"${e.comment || ''}"`
        ]);

        const csvContent = "\uFEFF" + [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `ReceiptAI_Export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = () => {
        window.print();
    };

    const handleTableSort = (field: string) => {
        const newDirection = tableSort.field === field && tableSort.direction === 'ASC' ? 'DESC' : 'ASC';
        setTableSort({ field, direction: newDirection });
        setFilters(prev => ({
            ...prev,
            sortBy: field,
            sortOrder: newDirection
        }));
    };

    const handleEditExpense = (expense: any) => {
        setEditingExpense(expense);
        setEditForm({
            vendor: expense.vendor || '',
            category: expense.category || '',
            amount_sgd: expense.amount_sgd || '',
            expense_date: expense.expense_date ? new Date(expense.expense_date).toISOString().split('T')[0] : '',
            location: expense.location || '',
            comment: expense.comment || ''
        });
        setShowEditModal(true);
    };

    const handleCancelEdit = () => {
        setEditingExpense(null);
        setEditForm({});
        setShowEditModal(false);
    };

    const handleUpdateExpense = async () => {
        if (!editingExpense) return;

        setIsUpdating(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch(`/api/expenses/${editingExpense.id}?userId=${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });

            const data = await res.json();

            if (data.success) {
                // Update the expense in the local state
                const updatedExpenses = expenses.map(exp =>
                    exp.id === editingExpense.id
                        ? { ...exp, ...editForm, expense_date: editForm.expense_date + 'T00:00:00.000Z' }
                        : exp
                );
                setExpenses(updatedExpenses);
                setEditingExpense(null);
                setEditForm({});
                setShowEditModal(false);
                setSuccess('Expense updated successfully');
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(data.error || 'Failed to update expense');
            }
        } catch (err) {
            setError('Network error occurred');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteExpense = async (expenseId: number) => {
        if (!confirm('Are you sure you want to delete this expense? This action cannot be undone.')) return;

        try {
            const res = await fetch(`/api/expenses/${expenseId}?userId=${user.id}`, { method: 'DELETE' });
            const data = await res.json();

            if (data.success) {
                setExpenses(expenses.filter(exp => exp.id !== expenseId));
                setSuccess('Expense deleted successfully');
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(data.error || 'Failed to delete expense');
            }
        } catch (err) {
            setError('Network error occurred');
        }
    };

    if (isLoading || !user) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
                <div style={{ textAlign: 'center' }}>
                    <ScanLine size={48} className="text-accent animate-pulse" style={{ marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>{t.dashboard.welcome}...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            padding: '2rem',
            backgroundColor: 'var(--bg-primary)',
            backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(139, 92, 246, 0.03) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(167, 139, 250, 0.03) 0%, transparent 40%)'
        }}>
            {/* Navbar */}
            <nav className="card" style={{
                marginBottom: '4rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.25rem 2.5rem',
                borderRadius: '24px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontWeight: '800', fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
                    <div style={{ background: 'var(--accent-primary)', padding: '0.5rem', borderRadius: '12px' }}>
                        <ScanLine size={24} style={{ color: 'white' }} />
                    </div>
                    <span>Receipt<span className="text-accent">AI</span></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <LanguageSwitcher />
                    <div className="vertical-divider" style={{ width: '1px', height: '24px', background: 'var(--glass-border)' }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: '700' }}>{user.username}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.8 }}>{user.email}</div>
                        </div>
                        <button onClick={handleLogout} className="btn btn-ghost" style={{ padding: '0.6rem', color: '#ef4444', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px' }}>
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </nav>

            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header Section */}
                <div style={{ marginBottom: '4rem', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-primary)', padding: '0.5rem 1rem', borderRadius: '100px', fontSize: '0.8rem', fontWeight: '700', marginBottom: '1.5rem' }}>
                        <Sparkles size={14} />
                        <span>{user?.username?.toUpperCase() || 'USER'} {t.dashboard.title.toUpperCase()}</span>
                    </div>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: '900', marginBottom: '1rem', letterSpacing: '-0.04em' }}>
                        {t.dashboard.welcome}, {user.username}.
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                        {t.dashboard.experience_clarity}
                    </p>
                </div>

                {/* Status Messages */}
                {(error || success) && (
                    <div style={{
                        marginBottom: '2rem',
                        padding: '1rem',
                        borderRadius: '12px',
                        background: error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                        border: `1px solid ${error ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`,
                        color: error ? '#ef4444' : '#22c55e',
                        fontSize: '0.9rem',
                        fontWeight: '600'
                    }}>
                        {error || success}
                    </div>
                )}

                {/* ADVANCED FILTER BAR */}
                <div className="card no-print" style={{ marginBottom: '3rem', padding: '1.25rem', borderRadius: '24px', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
                        <Filter size={18} />
                        <span style={{ fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.dashboard.filters.label}</span>
                    </div>

                    <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                        <input
                            type="text"
                            className="input"
                            placeholder={t.dashboard.filters.search}
                            style={{ width: '100%', paddingLeft: '2.5rem', fontSize: '0.9rem' }}
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.25rem 0.75rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                            <Calendar size={14} style={{ opacity: 0.6 }} />
                            <input
                                type="date"
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.85rem', padding: '0.5rem 0' }}
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            />
                            <span style={{ opacity: 0.3 }}>—</span>
                            <input
                                type="date"
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '0.85rem', padding: '0.5rem 0' }}
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            />
                        </div>

                        <select
                            className="input"
                            style={{ width: 'auto', minWidth: '130px', fontSize: '0.85rem' }}
                            value={filters.category}
                            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                        >
                            <option value="">{t.dashboard.filters.all_categories}</option>
                            {(metrics?.allCategories || []).map((cat: string) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>

                        <select
                            className="input"
                            style={{ width: 'auto', minWidth: '130px', fontSize: '0.85rem' }}
                            value={filters.botId}
                            onChange={(e) => setFilters({ ...filters, botId: e.target.value })}
                        >
                            <option value="">{t.dashboard.filters.all_bots}</option>
                            {bots.map(b => <option key={b.id} value={b.id}>{b.bot_username}</option>)}
                        </select>
                    </div>



                    {(filters.startDate || filters.endDate || filters.botId || filters.category || filters.search) && (
                        <button
                            onClick={() => setFilters({ startDate: '', endDate: '', botId: '', category: '', search: '', sortBy: 'expense_date', sortOrder: 'DESC', groupby: 'month' })}
                            style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: '600', cursor: 'pointer', background: 'none', border: 'none' }}
                        >
                            {t.dashboard.filters.clear}
                        </button>
                    )}
                </div>

                {/* Metrics Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '2rem',
                    marginBottom: '4rem',
                    opacity: dataLoading ? 0.6 : 1,
                    transition: 'opacity 0.2s'
                }}>
                    <div className="card" style={{ padding: '2rem', borderRadius: '32px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1 }}>
                            <TrendingUp size={120} />
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem' }}>{t.dashboard.metrics.total_spending}</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>
                            SGD {metrics?.totalSpending?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                        </div>
                    </div>

                    <div className="card" style={{ padding: '2rem', borderRadius: '32px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.1 }}>
                            <PieChartIcon size={120} />
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem' }}>{t.dashboard.metrics.top_category}</div>
                        <div style={{ fontSize: '2rem', fontWeight: '800' }}>
                            {metrics?.categoryBreakdown?.[0]?.category || t.dashboard.visuals.no_data}
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                            {metrics?.categoryBreakdown?.[0] ? `SGD ${metrics.categoryBreakdown[0].total.toLocaleString()}` : ''}
                        </div>
                    </div>

                    <div className="card" style={{ padding: '2rem', borderRadius: '32px', border: '1px solid var(--accent-primary)', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), transparent)' }}>
                        <div style={{ color: 'var(--accent-primary)', fontSize: '0.9rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Sparkles size={16} />
                            {t.dashboard.metrics.ai_insights}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {metrics?.insights?.map((insight: string, i: number) => (
                                <div key={i} style={{ fontSize: '0.95rem', lineHeight: '1.6', display: 'flex', gap: '0.75rem' }}>
                                    <div style={{ width: '6px', height: '6px', background: 'var(--accent-primary)', borderRadius: '50%', marginTop: '0.5rem', flexShrink: 0 }}></div>
                                    <div dangerouslySetInnerHTML={{ __html: String(insight || '').replace(/\*\*(.*?)\*\*/g, '<b class="text-accent">$1</b>') }}></div>
                                </div>
                            ))}
                            {(!metrics?.insights || metrics.insights.length === 0) && (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t.dashboard.metrics.no_insights}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="dashboard-grid" style={{
                    display: 'grid',
                    gap: '2.5rem'
                }}>
                    {/* Top Row (Bots + Visual Insights) */}
                    <div className="grid-top" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
                        {/* Your Bots */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '1.4rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <Bot className="text-accent" />
                                    {t.dashboard.bots.title}
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setShowBotHelpDashboard(!showBotHelpDashboard)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--accent-primary)',
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem'
                                    }}
                                >
                                    {showBotHelpDashboard ? 'Hide help' : 'Need help?'}
                                </button>
                            </div>
                            <div className="card" style={{ padding: '1.5rem', borderRadius: '24px', height: '320px', display: 'flex', flexDirection: 'column' }}>
                                {showBotHelpDashboard && (
                                    <div style={{
                                        background: 'rgba(167, 139, 250, 0.1)',
                                        border: '1px solid rgba(167, 139, 250, 0.2)',
                                        borderRadius: '12px',
                                        padding: '1rem',
                                        marginBottom: '1.5rem',
                                        fontSize: '0.85rem'
                                    }}>
                                        <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>How to connect your Telegram bot:</div>
                                        <ol style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            <li>Open Telegram and search for @BotFather</li>
                                            <li>Send /newbot command and follow instructions</li>
                                            <li>Copy the token BotFather gives you</li>
                                            <li>Paste the token in the field below and click +</li>
                                            <li>After adding, go to your bot in Telegram and send <code>/start TOKEN</code> (replace TOKEN with your bot token) to link your account</li>
                                        </ol>
                                    </div>
                                )}
                                <form onSubmit={handleAddBot} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                    <input type="text" className="input" placeholder={t.dashboard.bots.token_placeholder} value={newToken} onChange={(e) => setNewToken(e.target.value)} style={{ flex: 1 }} />
                                    <button type="submit" className="btn btn-primary" disabled={isBotLoading} onClick={(e) => {
                                        if (!newToken.trim()) {
                                            e.preventDefault();
                                            setShowBotHelpDashboard(true);
                                        }
                                    }} style={{ height: '48px', width: '48px', padding: 0 }}><Plus size={20} /></button>
                                </form>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem', paddingLeft: '0.25rem' }}>
                                    Paste your Telegram bot token here. Need help creating a bot? Click "Need help?" above.
                                </div>
                                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {bots.length > 0 ? (
                                        bots.map((bot) => (
                                            <div key={bot.id} className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <Bot size={18} className="text-accent" />
                                                    <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{bot.bot_username}</div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                    <a href={`https://t.me/${bot.bot_username?.replace('@', '')}`} target="_blank" className="btn btn-ghost" style={{ padding: '0.4rem' }}><MessageSquare size={16} /></a>
                                                    <button onClick={() => handleDeleteBot(bot.id)} className="btn btn-ghost" style={{ padding: '0.4rem', color: '#ef4444' }}><Trash2 size={16} /></button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', textAlign: 'center', gap: '0.75rem' }}>
                                            <Bot size={48} style={{ opacity: 0.5 }} />
                                            <div style={{ fontSize: '0.95rem' }}>No bots connected yet</div>
                                            <div style={{ fontSize: '0.85rem', maxWidth: '280px' }}>Add your Telegram bot token above to start parsing receipts via Telegram.</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Visual Insights */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '1.4rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <Activity className="text-accent" />
                                    {t.dashboard.visuals.title}
                                </h2>
                                <select
                                    className="btn btn-ghost"
                                    style={{ fontSize: '0.7rem', padding: '0.2rem 2.5rem 0.2rem 0.6rem', height: 'auto', width: 'auto' }}
                                    value={filters.groupby}
                                    onChange={(e) => setFilters({ ...filters, groupby: e.target.value })}
                                >
                                    <option value="month">{t.dashboard.visuals.by_month}</option>
                                    <option value="year">{t.dashboard.visuals.by_year}</option>
                                    <option value="category">{t.dashboard.visuals.by_category}</option>
                                    <option value="bot">{t.dashboard.visuals.by_bot}</option>
                                </select>
                            </div>
                            <div className="card" style={{ padding: '2rem', borderRadius: '32px', height: '320px', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
                                    {filters.search ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={metrics?.categoryBreakdown || []}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="total"
                                                    nameKey="category"
                                                >
                                                    {(metrics?.categoryBreakdown || []).map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                    <Label
                                                        value="Categories"
                                                        position="center"
                                                        style={{ fill: 'var(--text-secondary)', fontSize: '12px', fontWeight: 'bold' }}
                                                    />
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ background: 'rgba(23, 23, 23, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                                                    itemStyle={{ color: '#fff' }}
                                                    formatter={(value: number | undefined) => value !== undefined ? `SGD ${value.toFixed(2)}` : 'N/A'}
                                                />
                                                <Legend
                                                    verticalAlign="bottom"
                                                    height={36}
                                                    iconType="circle"
                                                    formatter={(value) => <span style={{ color: 'var(--text-primary)', fontSize: '12px' }}>{value}</span>}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart data={(() => {
                                                // Calculate percentage change for each data point
                                                const trend = metrics?.trend || [];
                                                return trend.map((item: any, index: number) => {
                                                    if (index === 0) {
                                                        return { ...item, percentChange: 0 };
                                                    }
                                                    const prevTotal = trend[index - 1].total;
                                                    const currTotal = item.total;
                                                    const percentChange = prevTotal > 0 ? ((currTotal - prevTotal) / prevTotal) * 100 : 0;
                                                    return { ...item, percentChange: Number(percentChange.toFixed(1)) };
                                                });
                                            })()}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                                <XAxis
                                                    dataKey="label"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                                                    dy={10}
                                                />
                                                <YAxis
                                                    yAxisId="left"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                                                    tickFormatter={(value) => `$${value}`}
                                                />
                                                <YAxis
                                                    yAxisId="right"
                                                    orientation="right"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#FBBF24', fontSize: 10 }}
                                                    tickFormatter={(value) => `${value}%`}
                                                />
                                                <Tooltip
                                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                    contentStyle={{ background: 'rgba(23, 23, 23, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                                                    formatter={(value: number | undefined, name: string | undefined) => {
                                                        const safeName = name || '';
                                                        if (safeName === 'Total Spending') {
                                                            return value !== undefined ? [`SGD ${Number(value).toFixed(2)}`, safeName] : ['N/A', safeName];
                                                        }
                                                        if (safeName === 'Change %') {
                                                            return value !== undefined ? [`${Number(value).toFixed(1)}%`, safeName] : ['N/A', safeName];
                                                        }
                                                        return [value, safeName];
                                                    }}
                                                />
                                                <Bar yAxisId="left" dataKey="total" fill="var(--accent-primary)" radius={[6, 6, 0, 0]} maxBarSize={60} name="Total Spending" />
                                                <Line
                                                    yAxisId="right"
                                                    type="monotone"
                                                    dataKey="percentChange"
                                                    stroke="#FBBF24"
                                                    strokeWidth={2}
                                                    dot={{ fill: '#FBBF24', strokeWidth: 2, r: 4 }}
                                                    name="Change %"
                                                />
                                                <Legend
                                                    verticalAlign="bottom"
                                                    height={36}
                                                    iconType="circle"
                                                    formatter={(value) => <span style={{ color: 'var(--text-primary)', fontSize: '12px' }}>{value}</span>}
                                                />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    )}
                                    {(!metrics?.trend || metrics.trend.length === 0) && (
                                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t.dashboard.visuals.no_data}</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent History (Full Width) */}
                    <div className="grid-history" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <TrendingUp className="text-accent" />
                                {t.dashboard.history.title}
                            </h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                                    {t.dashboard.history.showing.replace('{count}', String(expenses.length))}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.25rem', borderRadius: '12px' }}>
                                    <button
                                        onClick={handleExportCSV}
                                        className="btn btn-ghost"
                                        title="Download CSV/Excel"
                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', height: 'auto', minHeight: 'unset' }}
                                    >
                                        CSV
                                    </button>
                                    <button
                                        onClick={handleExportPDF}
                                        className="btn btn-ghost"
                                        title="Download PDF"
                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', height: 'auto', minHeight: 'unset' }}
                                    >
                                        PDF
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="card" style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)' }}>
                                            <th
                                                style={{
                                                    textAlign: 'left',
                                                    padding: '0.75rem 1rem',
                                                    fontSize: '0.7rem',
                                                    textTransform: 'uppercase',
                                                    color: 'var(--text-secondary)',
                                                    width: '80px',
                                                    cursor: 'pointer',
                                                    userSelect: 'none'
                                                }}
                                                onClick={() => handleTableSort('expense_date')}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    {t.dashboard.history.date}
                                                    {tableSort.field === 'expense_date' && (
                                                        tableSort.direction === 'ASC' ?
                                                            <ArrowUp size={12} style={{ color: 'var(--accent-primary)' }} /> :
                                                            <ArrowDown size={12} style={{ color: 'var(--accent-primary)' }} />
                                                    )}
                                                </div>
                                            </th>
                                            <th
                                                style={{
                                                    textAlign: 'left',
                                                    padding: '0.75rem 1rem',
                                                    fontSize: '0.7rem',
                                                    textTransform: 'uppercase',
                                                    color: 'var(--text-secondary)',
                                                    width: '150px',
                                                    cursor: 'pointer',
                                                    userSelect: 'none'
                                                }}
                                                onClick={() => handleTableSort('vendor')}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    {t.dashboard.history.vendor}
                                                    {tableSort.field === 'vendor' && (
                                                        tableSort.direction === 'ASC' ?
                                                            <ArrowUp size={12} style={{ color: 'var(--accent-primary)' }} /> :
                                                            <ArrowDown size={12} style={{ color: 'var(--accent-primary)' }} />
                                                    )}
                                                </div>
                                            </th>
                                            <th
                                                style={{
                                                    textAlign: 'left',
                                                    padding: '0.75rem 1rem',
                                                    fontSize: '0.7rem',
                                                    textTransform: 'uppercase',
                                                    color: 'var(--text-secondary)',
                                                    width: '100px',
                                                    cursor: 'pointer',
                                                    userSelect: 'none'
                                                }}
                                                onClick={() => handleTableSort('category')}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                    {t.dashboard.history.category}
                                                    {tableSort.field === 'category' && (
                                                        tableSort.direction === 'ASC' ?
                                                            <ArrowUp size={12} style={{ color: 'var(--accent-primary)' }} /> :
                                                            <ArrowDown size={12} style={{ color: 'var(--accent-primary)' }} />
                                                    )}
                                                </div>
                                            </th>
                                            <th style={{ textAlign: 'center', padding: '0.75rem 1rem', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-secondary)', width: '80px' }}>Receipt</th>
                                            <th
                                                style={{
                                                    textAlign: 'right',
                                                    padding: '0.75rem 1rem',
                                                    fontSize: '0.7rem',
                                                    textTransform: 'uppercase',
                                                    color: 'var(--text-secondary)',
                                                    width: '100px',
                                                    cursor: 'pointer',
                                                    userSelect: 'none'
                                                }}
                                                onClick={() => handleTableSort('amount_sgd')}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                                    {t.dashboard.history.amount}
                                                    {tableSort.field === 'amount_sgd' && (
                                                        tableSort.direction === 'ASC' ?
                                                            <ArrowUp size={12} style={{ color: 'var(--accent-primary)' }} /> :
                                                            <ArrowDown size={12} style={{ color: 'var(--accent-primary)' }} />
                                                    )}
                                                </div>
                                            </th>
                                            <th style={{ textAlign: 'center', padding: '0.75rem 1rem', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-secondary)', width: '100px' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expenses.map((exp) => (
                                            <tr key={exp.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }} className="table-row-hover">
                                                <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
                                                    {(() => {
                                                        const date = new Date(exp.expense_date);
                                                        const today = new Date();
                                                        const isCurrentYear = date.getFullYear() === today.getFullYear();
                                                        return date.toLocaleDateString('en-GB', { 
                                                            day: '2-digit', 
                                                            month: 'short',
                                                            ...(isCurrentYear ? {} : { year: '2-digit' })
                                                        });
                                                    })()}
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
                                                    <div style={{ fontWeight: '700', fontSize: '0.8rem' }}>{exp.vendor}</div>
                                                    <div style={{ fontSize: '0.65rem', opacity: 0.6 }}>{exp.bot_username}</div>
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem' }}>
                                                    {(() => {
                                                        const catColor = getCategoryColor(exp.category || 'Others');
                                                        return (
                                                            <span style={{ 
                                                                padding: '0.25rem 0.6rem', 
                                                                background: catColor.bg, 
                                                                color: catColor.text, 
                                                                borderRadius: '6px', 
                                                                fontSize: '0.65rem', 
                                                                fontWeight: '700',
                                                                display: 'inline-block'
                                                            }}>
                                                                {exp.category}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                                    {exp.receipt_image_url ? (
                                                        <div
                                                            style={{ position: 'relative', display: 'inline-block' }}
                                                            onMouseEnter={() => setHoveredReceipt(exp.id)}
                                                            onMouseLeave={() => setHoveredReceipt(null)}
                                                        >
                                                            <button
                                                                className="btn btn-ghost"
                                                                style={{ padding: '0.25rem', display: 'inline-flex', color: 'var(--text-secondary)' }}
                                                                title="View Receipt"
                                                                onClick={() => window.open(exp.receipt_image_url, '_blank')}
                                                            >
                                                                <ExternalLink size={14} />
                                                            </button>
                                                            {hoveredReceipt === exp.id && (
                                                                <div
                                                                    style={{
                                                                        position: 'absolute',
                                                                        top: '30px',
                                                                        left: '50%',
                                                                        transform: 'translateX(-50%)',
                                                                        zIndex: 10000,
                                                                        background: 'rgba(0, 0, 0, 0.9)',
                                                                        border: '1px solid rgba(255,255,255,0.2)',
                                                                        borderRadius: '8px',
                                                                        padding: '12px 16px',
                                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                                                        pointerEvents: 'none',
                                                                        whiteSpace: 'nowrap',
                                                                        fontSize: '0.85rem',
                                                                        color: 'white',
                                                                        maxWidth: '200px'
                                                                    }}
                                                                >
                                                                    Click to view receipt image
                                                                    <div style={{
                                                                        position: 'absolute',
                                                                        top: '-5px',
                                                                        left: '50%',
                                                                        transform: 'translateX(-50%)',
                                                                        width: '0',
                                                                        height: '0',
                                                                        borderLeft: '5px solid transparent',
                                                                        borderRight: '5px solid transparent',
                                                                        borderBottom: '5px solid rgba(0, 0, 0, 0.9)'
                                                                    }}></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span style={{ opacity: 0.2 }}>—</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: '800', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                                                    {Number(exp.amount_sgd).toFixed(2)}
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                                                        <button
                                                            onClick={() => handleEditExpense(exp)}
                                                            className="btn btn-ghost"
                                                            style={{ padding: '0.2rem', color: 'var(--accent-primary)', fontSize: '1rem' }}
                                                            title="Edit"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteExpense(exp.id)}
                                                            className="btn btn-ghost"
                                                            style={{ padding: '0.2rem', color: '#ef4444', fontSize: '1rem' }}
                                                            title="Delete"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {expenses.length === 0 && (
                                            <tr>
                                                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                    {t.dashboard.history.empty}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit Expense Modal */}
                {showEditModal && editingExpense && (
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0,0,0,0.8)',
                            backdropFilter: 'blur(8px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 2000,
                            padding: '1rem'
                        }}
                        onClick={(e) => e.target === e.currentTarget && handleCancelEdit()}
                    >
                        <div
                            className="card"
                            style={{
                                maxWidth: '600px',
                                width: '95vw',
                                maxHeight: '90vh',
                                overflow: 'auto',
                                borderRadius: '24px',
                                padding: '2rem',
                                background: 'var(--bg-primary)',
                                border: '2px solid var(--glass-border)',
                                boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>Edit Expense</h3>
                                <button
                                    onClick={handleCancelEdit}
                                    className="btn btn-ghost"
                                    style={{ padding: '0.5rem', fontSize: '1.5rem' }}
                                >
                                    ×
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div className="modal-grid-first">
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                            Vendor
                                        </label>
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder="Vendor name"
                                            value={editForm.vendor}
                                            onChange={(e) => setEditForm({ ...editForm, vendor: e.target.value })}
                                            style={{ width: '100%', fontSize: '1rem', padding: '0.75rem' }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                            Category
                                        </label>
                                        <select
                                            className="input"
                                            value={editForm.category}
                                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                            style={{ width: '100%', fontSize: '1rem', padding: '0.75rem' }}
                                        >
                                            <option value="">Select Category</option>
                                            {(metrics?.allCategories || []).map((cat: string) => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="modal-grid-second">
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                            Amount (SGD)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="input"
                                            placeholder="0.00"
                                            value={editForm.amount_sgd}
                                            onChange={(e) => setEditForm({ ...editForm, amount_sgd: e.target.value })}
                                            style={{ width: '100%', fontSize: '1rem', padding: '0.75rem', fontFamily: 'var(--font-mono)' }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                            Date
                                        </label>
                                        <input
                                            type="date"
                                            className="input"
                                            value={editForm.expense_date}
                                            onChange={(e) => setEditForm({ ...editForm, expense_date: e.target.value })}
                                            style={{ width: '100%', fontSize: '1rem', padding: '0.75rem' }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                        Location (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Location"
                                        value={editForm.location}
                                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                        style={{ width: '100%', fontSize: '1rem', padding: '0.75rem' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                                        Comment (Optional)
                                    </label>
                                    <textarea
                                        className="input"
                                        placeholder="Additional notes"
                                        value={editForm.comment}
                                        onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                                        style={{ width: '100%', fontSize: '1rem', padding: '0.75rem', minHeight: '80px', resize: 'vertical' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem', flexWrap: 'wrap' }}>
                                <button
                                    onClick={handleCancelEdit}
                                    className="btn btn-ghost"
                                    style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateExpense}
                                    disabled={isUpdating}
                                    className="btn btn-primary"
                                    style={{ padding: '0.75rem 1.5rem', fontSize: '1rem', minWidth: '100px' }}
                                >
                                    {isUpdating ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div >

            <style>{`
                .text-accent { color: var(--accent-primary); }
                .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
                .animate-fade-in { animation: fadeIn 0.5s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .table-row-hover:hover { background: rgba(255,255,255,0.03); }
                input[type="date"]::-webkit-calendar-picker-indicator {
                  filter: invert(1);
                  cursor: pointer;
                }
                
                 .dashboard-grid {
                     grid-template-columns: 1fr;
                 }
                 .grid-top {
                     grid-column: span 1;
                 }
                 .grid-history {
                     grid-column: span 1;
                 }

                 @media (max-width: 1024px) {
                     .grid-top {
                         grid-template-columns: 1fr;
                         gap: 2rem;
                     }
                 }

                 @media (max-width: 768px) {
                     .modal-grid-first, .modal-grid-second {
                         grid-template-columns: 1fr;
                     }
                 }

                .modal-grid-first, .modal-grid-second {
                   display: grid;
                   grid-template-columns: 1fr 1fr;
                   gap: 1rem;
                 }

                 select {
                   appearance: none;
                   background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
                   background-repeat: no-repeat;
                   background-position: right 1rem center;
                   background-size: 1em;
                 }

                @media print {
                  body { background: white !important; color: black !important; }
                  .no-print { display: none !important; }
                  .container { max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
                  .card { border: 1px solid #eee !important; background: white !important; box-shadow: none !important; margin-bottom: 2rem !important; }
                  .text-accent { color: black !important; font-weight: bold !important; }
                  nav { display: none !important; }
                  h1 { font-size: 2rem !important; margin-bottom: 1rem !important; }
                  .container > div:first-child { text-align: left !important; }
                }
            `}</style>
        </div>
    );
}
