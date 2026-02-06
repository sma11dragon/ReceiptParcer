'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ScanLine, ArrowLeft, Mail, Lock, User, MapPin, Bot, Key, ChevronDown, ChevronUp, Eye, EyeOff, Check, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useMobile } from '@/hooks/useMobile';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { GoogleLogin } from '@react-oauth/google';

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
    const [showBotToken, setShowBotToken] = useState(false);
    const [isFetchingBotInfo, setIsFetchingBotInfo] = useState(false);
    const [botValidationStatus, setBotValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

    // Mobile optimization detection
    const isMobile = useMobile();

    // Auto-fetch bot info when token changes (debounced)
    const fetchBotInfo = useCallback(async (token: string) => {
        if (!token || token.length < 20) {
            setBotValidationStatus('idle');
            return;
        }

        setIsFetchingBotInfo(true);
        setBotValidationStatus('idle');

        try {
            const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
            const data = await response.json();

            if (data.ok && data.result) {
                setBotUsername(data.result.username);
                setBotValidationStatus('valid');
            } else {
                setBotValidationStatus('invalid');
            }
        } catch (err) {
            setBotValidationStatus('invalid');
        } finally {
            setIsFetchingBotInfo(false);
        }
    }, []);

    // Debounce token input to avoid excessive API calls
    useEffect(() => {
        const timer = setTimeout(() => {
            if (botToken) {
                fetchBotInfo(botToken);
            }
        }, 800); // Wait 800ms after user stops typing

        return () => clearTimeout(timer);
    }, [botToken, fetchBotInfo]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate required fields
        if (!botToken) {
            setError('Telegram bot token is required to use receipt parsing via Telegram');
            return;
        }
        
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password, location, botUsername, botToken }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || t.auth.register_failed);
                setIsLoading(false);
                return;
            }

            setSuccess(t.auth.register_success);

            // Redirect logic
            setTimeout(() => {
                router.push('/login');
            }, 2000);

        } catch (err) {
            setError(t.auth.network_error);
            setIsLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        setIsLoading(true);
        setError('');
        try {
            // For registration, we might want to capture more info, but standard Google Auth flow usually just logs them in or creates account if checks pass
            const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: credentialResponse.credential, isRegister: true })
            });
            const data = await res.json();

            if (data.success) {
                localStorage.setItem('user', JSON.stringify(data.user));
                router.push('/dashboard');
            } else {
                setError(data.error || 'Google signup failed');
                setIsLoading(false);
            }
        } catch (err) {
            setError('Google signup failed. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '1rem' : '2rem',
            position: 'relative',
        }}>
            {/* Nav */}
            <div style={{ position: 'absolute', top: '2rem', left: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', zIndex: 10 }}>
                <Link href="/" className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ArrowLeft size={16} />
                    {!isMobile && t.common.back}
                </Link>
                <LanguageSwitcher />
            </div>

            <div className="card animate-fade-in" style={{ maxWidth: '500px', width: '100%', padding: isMobile ? '1.5rem' : '2.5rem', marginTop: isMobile ? '4rem' : '0' }}>
                <div className="text-center" style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'inline-flex', padding: '0.75rem', background: 'rgba(94, 234, 212, 0.1)', borderRadius: '16px', marginBottom: '1rem', color: 'var(--accent-primary)' }}>
                        <ScanLine size={32} />
                    </div>
                    <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: '800' }}>{t.auth.create_account}</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>{t.auth.signup_desc}</p>
                </div>

                {error && (
                    <div className="animate-fade-in" style={{
                        padding: '1rem',
                        marginBottom: '1.5rem',
                        color: 'var(--error)',
                        background: 'rgba(248, 113, 113, 0.1)',
                        border: '1px solid rgba(248, 113, 113, 0.2)',
                        borderRadius: '12px',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                {success && (
                    <div className="animate-fade-in" style={{
                        padding: '1rem',
                        marginBottom: '1.5rem',
                        color: 'var(--success)',
                        background: 'rgba(52, 211, 153, 0.1)',
                        border: '1px solid rgba(52, 211, 153, 0.2)',
                        borderRadius: '12px',
                        textAlign: 'center'
                    }}>
                        {success}
                    </div>
                )}

                {/* Google Signup */}
                <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google Sign-Up failed')}
                        theme="filled_black"
                        shape="circle"
                        text="signup_with"
                        width="100%"
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Or register with email</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="label">{t.auth.username}</label>
                            <div style={{ position: 'relative' }}>
                                <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                                <input type="text" className="input" placeholder="johndoe" required value={username} onChange={(e) => setUsername(e.target.value)} style={{ paddingLeft: '2.75rem' }} />
                            </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="label">{t.auth.location}</label>
                            <div style={{ position: 'relative' }}>
                                <MapPin size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                                <input type="text" className="input" placeholder="USA" value={location} onChange={(e) => setLocation(e.target.value)} style={{ paddingLeft: '2.75rem' }} />
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="label">{t.auth.email}</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                            <input type="email" className="input" placeholder="john@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ paddingLeft: '3rem' }} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="label">{t.auth.password}</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                            <input type="password" className="input" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ paddingLeft: '3rem' }} />
                        </div>
                    </div>

                    {/* Telegram Bot Section */}
                    <div style={{
                        background: 'rgba(167, 139, 250, 0.05)',
                        border: '1px solid rgba(167, 139, 250, 0.1)',
                        borderRadius: '16px',
                        padding: '1.25rem',
                        marginBottom: '1.5rem',
                        marginTop: '0.5rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Bot size={20} className="text-accent" />
                                <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{t.auth.bot_setup_title} <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>(Required for Telegram)</span></span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowBotHelp(!showBotHelp)}
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
                                {showBotHelp ? 'Hide instructions' : 'How to create a bot?'}
                            </button>
                        </div>

                        {showBotHelp && (
                            <div style={{
                                background: 'rgba(167, 139, 250, 0.1)',
                                border: '1px solid rgba(167, 139, 250, 0.2)',
                                borderRadius: '12px',
                                padding: '1rem',
                                marginBottom: '1rem',
                                fontSize: '0.85rem'
                            }}>
                                <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>{t.auth.how_to_create_bot}</div>
                                <ol style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <li>{t.auth.bot_step1}</li>
                                    <li>{t.auth.bot_step2}</li>
                                    <li>{t.auth.bot_step3}</li>
                                    <li>{t.auth.bot_step4}</li>
                                    <li>{t.auth.bot_step5}</li>
                                </ol>
                                <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    After creating your bot, paste the token above. Telegram bot is required to use receipt parsing via Telegram.
                                </div>
                            </div>
                        )}

                        <div className="form-group" style={{ position: 'relative' }}>
                            <input
                                type={showBotToken ? "text" : "password"}
                                className="input"
                                placeholder={t.auth.bot_token}
                                value={botToken}
                                onChange={(e) => setBotToken(e.target.value)}
                                style={{ 
                                    paddingRight: '3rem', 
                                    fontSize: '0.9rem',
                                    borderColor: botValidationStatus === 'valid' ? 'var(--success)' : botValidationStatus === 'invalid' ? 'var(--error)' : undefined
                                }}
                            />
                            <div style={{
                                position: 'absolute',
                                right: '1rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                {isFetchingBotInfo && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                                {botValidationStatus === 'valid' && <Check size={16} color="var(--success)" />}
                                <button
                                    type="button"
                                    onClick={() => setShowBotToken(!showBotToken)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--text-muted)'
                                    }}
                                >
                                    {showBotToken ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {botValidationStatus === 'valid' && botUsername && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem 0.75rem',
                                background: 'rgba(52, 211, 153, 0.1)',
                                border: '1px solid rgba(52, 211, 153, 0.2)',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                color: 'var(--success)'
                            }}>
                                <Check size={14} />
                                <span>Bot detected: @{botUsername}</span>
                            </div>
                        )}

                        {botValidationStatus === 'invalid' && botToken && (
                            <div style={{
                                padding: '0.5rem 0.75rem',
                                background: 'rgba(248, 113, 113, 0.1)',
                                border: '1px solid rgba(248, 113, 113, 0.2)',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                color: 'var(--error)'
                            }}>
                                Invalid bot token. Please copy the full token from BotFather.
                            </div>
                        )}
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={isLoading}>
                        {isLoading ? (
                            <div style={{ width: '20px', height: '20px', border: '2px solid rgba(0,0,0,0.3)', borderTopColor: 'var(--bg-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        ) : t.auth.signup_btn}
                    </button>
                </form>

                <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {t.auth.have_account} <Link href="/login" style={{ color: 'var(--accent-primary)', fontWeight: '600' }}>{t.auth.signin_btn}</Link>
                </p>
            </div>
            <style jsx>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
