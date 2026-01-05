'use client';

import { useState, useEffect } from 'react';
import { ScanLine, RefreshCw, Copy, Check, LogOut, Bot } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function DashboardPage() {
    const { t } = useLanguage();
    // Use consistent state names
    const [telegramToken, setTelegramToken] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Mock user for now or read from local storage if available
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        } else {
            // For demo purposes, just set a dummy user if not found, or redirect
            setUser({ username: 'John Doe', email: 'john@example.com', created_at: new Date().toISOString() });
        }
    }, []);

    const generateToken = async () => {
        setIsGenerating(true);
        // Simulate API call
        setTimeout(() => {
            const randomToken = Math.random().toString(36).substring(2, 10).toUpperCase();
            setTelegramToken(randomToken);
            setIsGenerating(false);
        }, 1500);
    };

    const copyToClipboard = () => {
        if (telegramToken) {
            navigator.clipboard.writeText(telegramToken);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!user) return null; // or a loading spinner

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
                        <Link href="/login" className="btn btn-ghost" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}>
                            <LogOut size={18} />
                            <span style={{ fontSize: '0.875rem' }}>{t.dashboard.logout}</span>
                        </Link>
                    </div>
                </div>
            </nav>

            <div className="container" style={{ maxWidth: '800px' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{t.dashboard.welcome}, {user.username}!</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>{t.dashboard.connect_desc}</p>
                </div>

                <div className="card" style={{ padding: '3rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)', width: '300px', height: '300px', background: 'var(--accent-primary)', filter: 'blur(100px)', opacity: '0.1', borderRadius: '50%', pointerEvents: 'none' }}></div>

                    <div style={{ width: '80px', height: '80px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                        <Bot size={40} className="text-accent" />
                    </div>

                    <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '1rem' }}>{t.dashboard.connect_title}</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', maxWidth: '400px', margin: '0 auto 2.5rem' }}>
                        {t.dashboard.connect_desc}
                    </p>

                    {!telegramToken ? (
                        <button
                            onClick={generateToken}
                            disabled={isGenerating}
                            className="btn btn-primary"
                            style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}
                        >
                            {isGenerating ? (
                                <>
                                    <RefreshCw size={20} className="animate-spin" style={{ marginRight: '0.5rem' }} />
                                    {t.dashboard.generating}
                                </>
                            ) : (
                                t.dashboard.generate_btn
                            )}
                        </button>
                    ) : (
                        <div className="animate-fade-in" style={{ maxWidth: '500px', margin: '0 auto' }}>
                            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#10b981' }}>
                                <Check size={20} />
                                <span style={{ fontWeight: '600' }}>{t.dashboard.token_generated}</span>
                            </div>

                            <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
                                <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>{t.dashboard.your_token}</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <code style={{ flex: 1, padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid var(--glass-border)', fontFamily: 'monospace', fontSize: '1.25rem', letterSpacing: '0.1em', textAlign: 'center' }}>
                                        {telegramToken}
                                    </code>
                                    <button
                                        onClick={copyToClipboard}
                                        className="btn btn-outline"
                                        style={{ width: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                                        title="Copy Token"
                                    >
                                        {copied ? <Check size={20} color="#10b981" /> : <Copy size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>{t.dashboard.next_steps}</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>1</div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t.dashboard.step1} <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>Telegram</span></div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>2</div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                            {t.dashboard.step2} <a href="#" style={{ color: 'var(--accent-primary)' }}>@ReceiptGeniusBot</a>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>3</div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                            {t.dashboard.step3} <code style={{ background: 'rgba(0,0,0,0.3)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.85em' }}>/start {telegramToken}</code>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>4</div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{t.dashboard.step4}</div>
                                    </div>
                                </div>
                            </div>

                            <button onClick={() => setTelegramToken(null)} style={{ marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>
                                {t.dashboard.new_token}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}