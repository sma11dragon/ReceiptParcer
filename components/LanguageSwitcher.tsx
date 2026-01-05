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
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem'
            }}
            aria-label="Toggle Language"
        >
            <Globe size={16} />
            <span>{language === 'en' ? 'EN' : '中文'}</span>
        </button>
    );
}
