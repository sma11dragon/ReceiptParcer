'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ScanLine, ArrowLeft, Mail } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function ForgotPassword() {
    const { t } = useLanguage();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [email, setEmail] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to send OTP. Please try again.');
                setIsLoading(false);
                return;
            }

            setSuccess('OTP sent to your email! Redirecting...');

            // Store email in sessionStorage for the reset page
            sessionStorage.setItem('resetEmail', email);

            // Redirect to reset password page after 2 seconds
            setTimeout(() => {
                router.push('/reset-password');
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
            padding: '2rem',
            background: 'var(--bg-primary)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Elements */}
            <div style={{ position: 'absolute', top: '20%', left: '20%', width: '400px', height: '400px', background: 'var(--accent-primary)', filter: 'blur(120px)', opacity: '0.15', borderRadius: '50%' }}></div>
            <div style={{ position: 'absolute', bottom: '20%', right: '20%', width: '300px', height: '300px', background: 'var(--accent-secondary)', filter: 'blur(100px)', opacity: '0.1', borderRadius: '50%' }}></div>

            <div style={{ position: 'absolute', top: '2rem', left: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <Link href="/login" className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ArrowLeft size={16} />
                    {t.auth?.back_to_login || 'Back to Login'}
                </Link>
                <LanguageSwitcher />
            </div>

            <div className="card" style={{ maxWidth: '500px', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                        <ScanLine size={48} className="text-accent" />
                    </div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        {t.auth?.forgot_password_title || 'Forgot Password?'}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        {t.auth?.forgot_password_desc || 'Enter your email and we\'ll send you an OTP to reset your password.'}
                    </p>
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

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            {t.auth?.email || 'Email Address'}
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="email"
                                required
                                className="input"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ paddingLeft: '3rem', width: '100%' }}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', justifyContent: 'center' }}
                        disabled={isLoading}
                    >
                        {isLoading ? (t.auth?.sending_otp || 'Sending OTP...') : (t.auth?.send_otp || 'Send OTP')}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {t.auth?.remember_password || 'Remember your password?'}{' '}
                    <Link href="/login" style={{ color: 'var(--accent-primary)' }}>
                        {t.auth?.signin_btn || 'Sign In'}
                    </Link>
                </div>
            </div>
        </div>
    );
}
