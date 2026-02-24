'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Mail, Lock, ScanLine, CheckCircle2 } from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { GoogleLogin } from '@react-oauth/google';

function RegistrationSuccessMessage() {
    const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(false);
    const searchParams = useSearchParams();
    
    useEffect(() => {
        const registered = searchParams.get('registered');
        const savedEmail = localStorage.getItem('temp_reg_email');

        if (registered === 'true' && savedEmail) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setShowRegistrationSuccess(true);
            // Clear temp credentials after a delay
            setTimeout(() => {
                localStorage.removeItem('temp_reg_email');
                localStorage.removeItem('temp_reg_password');
            }, 5000);
        }
    }, [searchParams]);

    if (!showRegistrationSuccess) return null;

    return (
        <div className="animate-fade-in" style={{
            padding: '1rem',
            marginBottom: '1.5rem',
            color: 'var(--success)',
            background: 'rgba(52, 211, 153, 0.1)',
            border: '1px solid rgba(52, 211, 153, 0.2)',
            borderRadius: '12px',
            textAlign: 'center',
            fontSize: '0.9rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
        }}>
            <CheckCircle2 size={18} />
            Registration complete! Your credentials have been saved.
        </div>
    );
}

export default function Login() {
    const { t } = useLanguage();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Check for saved credentials from registration
    useEffect(() => {
        const savedEmail = localStorage.getItem('temp_reg_email');
        const savedPassword = localStorage.getItem('temp_reg_password');
        
        if (savedEmail) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setEmail(savedEmail);
            if (savedPassword) {
                 
                setPassword(savedPassword);
            }
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || t.auth.login_failed);
                setIsLoading(false);
                return;
            }

            localStorage.setItem('user', JSON.stringify(data.user));
            router.push('/dashboard');
        } catch (err) {
            setError(t.auth.network_error);
            setIsLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: credentialResponse.credential })
            });
            const data = await res.json();

            if (data.success) {
                localStorage.setItem('user', JSON.stringify(data.user));
                router.push('/dashboard');
            } else {
                setError(data.error || 'Google login failed');
                setIsLoading(false);
            }
        } catch (err) {
            setError('Google login failed. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            position: 'relative',
        }}>
            {/* Nav */}
            <div style={{ position: 'absolute', top: '2rem', left: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', zIndex: 10 }}>
                <Link href="/" className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ArrowLeft size={16} />
                    {t.common.back}
                </Link>
                <LanguageSwitcher />
            </div>

            <div className="card animate-fade-in" style={{ maxWidth: '440px', width: '100%', padding: '2.5rem' }}>
                <div className="text-center" style={{ marginBottom: '2.5rem' }}>
                    <div style={{ display: 'inline-flex', padding: '0.75rem', background: 'rgba(94, 234, 212, 0.1)', borderRadius: '16px', marginBottom: '1.5rem', color: 'var(--accent-primary)' }}>
                        <ScanLine size={32} />
                    </div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.75rem', fontWeight: '800' }}>
                        {t.auth.welcome}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {t.auth.signin_desc}
                    </p>
                </div>

                <Suspense fallback={null}>
                    <RegistrationSuccessMessage />
                </Suspense>

                {error && (
                    <div className="animate-fade-in" style={{
                        padding: '1rem',
                        marginBottom: '1.5rem',
                        color: 'var(--error)',
                        background: 'rgba(248, 113, 113, 0.1)',
                        border: '1px solid rgba(248, 113, 113, 0.2)',
                        borderRadius: '12px',
                        textAlign: 'center',
                        fontSize: '0.9rem',
                        fontWeight: '500'
                    }}>
                        {error}
                    </div>
                )}

                {/* Google Login */}
                <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google Sign-In failed')}
                        theme="filled_black"
                        shape="circle"
                        width="100%"
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Or continue with email</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="label">
                            {t.auth.email}
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="email"
                                required
                                className="input"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ paddingLeft: '3rem' }}
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                        <label className="label">
                            {t.auth.password}
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="password"
                                required
                                className="input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ paddingLeft: '3rem' }}
                            />
                        </div>
                        <div className="text-right" style={{ marginTop: '0.75rem' }}>
                            <Link href="/forgot-password" style={{ color: 'var(--accent-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>
                                {t.auth?.forgot_password || 'Forgot password?'}
                            </Link>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div style={{ width: '20px', height: '20px', border: '2px solid rgba(0,0,0,0.3)', borderTopColor: 'var(--bg-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        ) : t.auth.signin_btn}
                    </button>
                    <style jsx>{`
                        @keyframes spin { to { transform: rotate(360deg); } }
                    `}</style>
                </form>

                <div className="text-center" style={{ marginTop: '2rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {t.auth.no_account} <Link href="/register" style={{ color: 'var(--accent-primary)', fontWeight: '600' }}>{t.auth.signup_btn}</Link>
                </div>
            </div>
        </div>
    );
}