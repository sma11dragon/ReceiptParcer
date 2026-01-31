'use client';

import { useLanguage } from '@/context/LanguageContext';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();

    return (
        <button
            onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
            className="btn btn-ghost"
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.5rem 1rem',
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                fontWeight: '600',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                border: '1px solid var(--glass-border)'
            }}
            aria-label="Toggle Language"
        >
            <Globe size={16} />
            <span>{language === 'en' ? '中文' : 'English'}</span>
        </button>
    );
}
