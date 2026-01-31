'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { LanguageProvider } from '@/context/LanguageContext';

export function Providers({ children }: { children: React.ReactNode }) {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "Add-Your-Client-ID-Here";

    return (
        <GoogleOAuthProvider clientId={clientId}>
            <LanguageProvider>
                {children}
            </LanguageProvider>
        </GoogleOAuthProvider>
    );
}
