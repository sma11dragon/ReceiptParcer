'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ScanLine, ArrowLeft, Mail, Lock, User, MapPin, Bot, Key, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function Register() {
    const { t } = useLanguage();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [location, setLocation] = useState('');
    const [botUsername, setBotUsername] = useState('');
    const [botToken, setBotToken] = useState('');
    const [showBotHelp, setShowBotHelp] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password, location, botUsername, botToken }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Registration failed. Please try again.');
                setIsLoading(false);
                return;
            }

            setSuccess('Account created successfully! Redirecting to login...');

            // Redirect to login after 2 seconds
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        } catch (err) {
            setError('Network error. Please check your connection.');
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            background: 'var(--bg-primary)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Elements */}
            <div style={{ position: 'absolute', top: '10%', right: '10%', width: '400px', height: '400px', background: 'var(--accent-primary)', filter: 'blur(120px)', opacity: '0.15', borderRadius: '50%' }}></div>
            <div style={{ position: 'absolute', bottom: '10%', left: '10%', width: '300px', height: '300px', background: 'var(--accent-secondary)', filter: 'blur(100px)', opacity: '0.1', borderRadius: '50%' }}></div>

            <div style={{ position: 'absolute', top: '2rem', left: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <Link href="/" className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ArrowLeft size={16} />
                    Back
                </Link>
                <LanguageSwitcher />
            </div>

            <div className="card" style={{ maxWidth: '500px', width: '100%' }}>
                <div className="text-center" style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                        <ScanLine size={48} className="text-accent" />
                    </div>
                    <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>{t.auth.create_account}</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>{t.auth.signup_desc}</p>
                </div>

                {error && (
                    <div style={{
                        padding: '1rem',
                        marginBottom: '1.5rem',
                        color: '#ef4444',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '0.5rem',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                {success && (
                    <div style={{
                        padding: '1rem',
                        marginBottom: '1.5rem',
                        color: '#10b981',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        borderRadius: '0.5rem',
                        textAlign: 'center'
                    }}>
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>{t.auth.username}</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                            <input type="text" className="input" placeholder="johndoe" required value={username} onChange={(e) => setUsername(e.target.value)} style={{ width: '100%', paddingLeft: '3rem' }} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>{t.auth.email}</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                            <input type="email" className="input" placeholder="john@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', paddingLeft: '3rem' }} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>{t.auth.location}</label>
                        <div style={{ position: 'relative' }}>
                            <MapPin size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                            <input type="text" className="input" placeholder="New York, USA" value={location} onChange={(e) => setLocation(e.target.value)} style={{ width: '100%', paddingLeft: '3rem' }} />
                        </div>
                    </div>

                    {/* Telegram Bot Section */}
                    <div style={{
                        background: 'rgba(139, 92, 246, 0.05)',
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        marginTop: '0.5rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <Bot size={20} className="text-accent" />
                            <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{t.auth.bot_setup_title || 'Telegram Bot Setup'}</span>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>{t.auth.bot_username || 'Bot Username'}</label>
                            <div style={{ position: 'relative' }}>
                                <Bot size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="@YourBotName"
                                    value={botUsername}
                                    onChange={(e) => setBotUsername(e.target.value)}
                                    style={{ width: '100%', paddingLeft: '3rem' }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>{t.auth.bot_token || 'Bot Token'}</label>
                            <div style={{ position: 'relative' }}>
                                <Key size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="password"
                                    className="input"
                                    placeholder="123456789:ABCdefGHI..."
                                    value={botToken}
                                    onChange={(e) => setBotToken(e.target.value)}
                                    style={{ width: '100%', paddingLeft: '3rem' }}
                                />
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowBotHelp(!showBotHelp)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                color: 'var(--accent-primary)',
                                fontSize: '0.875rem',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0
                            }}
                        >
                            {showBotHelp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            {t.auth.how_to_create_bot || 'How do I create a Telegram bot?'}
                        </button>

                        {showBotHelp && (
                            <div style={{
                                marginTop: '1rem',
                                padding: '1rem',
                                background: 'rgba(0,0,0,0.2)',
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                color: 'var(--text-secondary)'
                            }}>
                                <ol style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <li>{t.auth.bot_step1 || 'Open Telegram and search for @BotFather'}</li>
                                    <li>{t.auth.bot_step2 || 'Send /newbot command'}</li>
                                    <li>{t.auth.bot_step3 || 'Choose a name for your bot (e.g., "My Receipt Bot")'}</li>
                                    <li>{t.auth.bot_step4 || 'Choose a username ending in "bot" (e.g., @MyReceiptBot)'}</li>
                                    <li>{t.auth.bot_step5 || 'Copy the token BotFather gives you and paste it above'}</li>
                                </ol>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>{t.auth.password}</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                            <input type="password" className="input" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', paddingLeft: '3rem' }} />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }} disabled={isLoading}>
                        {isLoading ? t.auth.signing_up : t.auth.signup_btn}
                    </button>
                </form>

                <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {t.auth.have_account} <Link href="/login" className="text-accent hover:underline">{t.auth.signin_btn}</Link>
                </p>
            </div>
        </div>
    );
}
