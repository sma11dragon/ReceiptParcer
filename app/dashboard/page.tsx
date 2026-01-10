'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ScanLine, LogOut, Bot, Check, AlertCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function DashboardPage() {
    const { t } = useLanguage();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for authenticated user
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
            setIsLoading(false);
        } else {
            // Redirect to login if no user found
            router.push('/login');
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        router.push('/login');
    };

    const hasBotConnected = user?.telegram_bot_username;

    if (isLoading || !user) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
                <div style={{ textAlign: 'center' }}>
                    <ScanLine size={48} className="text-accent" style={{ marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            padding: '2rem',
            backgroundColor: 'var(--bg-primary)',
            backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(139, 92, 246, 0.05) 0%, transparent 20%), radial-gradient(circle at 90% 80%, rgba(167, 139, 250, 0.05) 0%, transparent 20%)'
        }}>
            {/* Navbar */}
            <nav className="card" style={{
                marginBottom: '2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 2rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 'bold', fontSize: '1.25rem' }}>
                    <ScanLine className="text-accent" />
                    <span>ReceiptAI <span style={{ color: 'var(--text-secondary)', fontWeight: 'normal' }}>| {t.dashboard.title}</span></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <LanguageSwitcher />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="desktop-only" style={{ textAlign: 'right', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{user.username}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.dashboard.member_since} {new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {user.username ? user.username.substring(0, 2).toUpperCase() : 'JD'}
                        </div>
                        <button onClick={handleLogout} className="btn btn-ghost" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
                            <LogOut size={18} />
                            <span style={{ fontSize: '0.875rem' }}>{t.dashboard.logout}</span>
                        </button>
                    </div>
                </div>
            </nav>

            <div className="container" style={{ maxWidth: '800px' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{t.dashboard.welcome}, {user.username}!</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {hasBotConnected
                            ? (t.dashboard.bot_ready_desc || 'Your Telegram bot is connected and ready to receive receipts.')
                            : (t.dashboard.no_bot_desc || 'Connect a Telegram bot to start parsing receipts.')}
                    </p>
                </div>

                <div className="card" style={{ padding: '3rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: '300px', height: '300px', background: 'var(--accent-primary)', filter: 'blur(100px)', opacity: '0.1', borderRadius: '50%', pointerEvents: 'none' }}></div>

                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: hasBotConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 2rem'
                    }}>
                        <Bot size={40} style={{ color: hasBotConnected ? '#10b981' : 'var(--accent-primary)' }} />
                    </div>

                    {hasBotConnected ? (
                        /* Bot Connected State */
                        <div className="animate-fade-in">
                            <div style={{
                                background: 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                padding: '1rem 1.5rem',
                                borderRadius: '12px',
                                marginBottom: '2rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                color: '#10b981'
                            }}>
                                <Check size={20} />
                                <span style={{ fontWeight: '600' }}>{t.dashboard.bot_connected || 'Bot Connected'}</span>
                            </div>

                            <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                {user.telegram_bot_username}
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                                {t.dashboard.bot_connected_desc || 'Your bot is ready to receive receipt images.'}
                            </p>

                            <div style={{
                                background: 'rgba(255,255,255,0.03)',
                                padding: '1.5rem',
                                borderRadius: '12px',
                                border: '1px solid var(--glass-border)',
                                textAlign: 'left',
                                maxWidth: '400px',
                                margin: '0 auto'
                            }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                                    {t.dashboard.how_to_use || 'How to Use'}
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                        <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>1.</span>
                                        <span>{t.dashboard.use_step1 || 'Open Telegram and find your bot'}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                        <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>2.</span>
                                        <span>{t.dashboard.use_step2 || 'Send a photo of any receipt'}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                        <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>3.</span>
                                        <span>{t.dashboard.use_step3 || 'The bot will extract and save the data'}</span>
                                    </div>
                                </div>
                            </div>

                            <a
                                href={`https://t.me/${user.telegram_bot_username?.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-primary"
                                style={{ marginTop: '2rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                {t.dashboard.open_bot || 'Open Bot in Telegram'}
                                <ExternalLink size={16} />
                            </a>
                        </div>
                    ) : (
                        /* No Bot Connected State */
                        <div className="animate-fade-in">
                            <div style={{
                                background: 'rgba(251, 191, 36, 0.1)',
                                border: '1px solid rgba(251, 191, 36, 0.2)',
                                padding: '1rem 1.5rem',
                                borderRadius: '12px',
                                marginBottom: '2rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                color: '#fbbf24'
                            }}>
                                <AlertCircle size={20} />
                                <span style={{ fontWeight: '600' }}>{t.dashboard.no_bot || 'No Bot Connected'}</span>
                            </div>

                            <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                {t.dashboard.setup_bot_title || 'Set Up Your Telegram Bot'}
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem' }}>
                                {t.dashboard.setup_bot_desc || 'You need to create and connect a Telegram bot to start parsing receipts.'}
                            </p>

                            <div style={{
                                background: 'rgba(255,255,255,0.03)',
                                padding: '1.5rem',
                                borderRadius: '12px',
                                border: '1px solid var(--glass-border)',
                                textAlign: 'left',
                                maxWidth: '450px',
                                margin: '0 auto 2rem'
                            }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>
                                    {t.dashboard.create_bot_steps || 'Create a Bot in 2 Minutes'}
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                        <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>1.</span>
                                        <span>{t.auth.bot_step1 || 'Open Telegram and search for @BotFather'}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                        <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>2.</span>
                                        <span>{t.auth.bot_step2 || 'Send /newbot command'}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                        <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>3.</span>
                                        <span>{t.auth.bot_step3 || 'Choose a name for your bot'}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                        <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>4.</span>
                                        <span>{t.dashboard.update_profile || 'Update your profile with the bot credentials'}</span>
                                    </div>
                                </div>
                            </div>

                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                {t.dashboard.contact_support || 'Need help? Contact support.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
