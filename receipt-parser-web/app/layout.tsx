import type { Metadata } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ReceiptAI - AI-Driven Receipt Capture & Telegram Expense Tracking',
  description: 'AI-driven receipt capture with real-time synchronization directly from Telegram. Query expenses on Telegram chat and manage everything from your web-based dashboard. Save hours, not minutes.',
  keywords: 'AI receipt capture, Telegram expense tracking, OCR receipt scanner, automated expense reporting, real-time expense sync, web dashboard',
  openGraph: {
    title: 'ReceiptAI - AI-Driven Receipt Capture & Telegram Expense Tracking',
    description: 'AI-driven receipt capture with real-time synchronization directly from Telegram. Query expenses on Telegram chat and access your web-based dashboard.',
    url: 'https://receipts.daeit.com.sg',
    siteName: 'ReceiptAI',
    images: [
      {
        url: 'https://receipts.daeit.com.sg/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ReceiptAI - AI-Driven Receipt Capture',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ReceiptAI - AI-Driven Receipt Capture',
    description: 'AI-driven receipt capture with real-time synchronization from Telegram. Query expenses via chat and manage from your web dashboard.',
    images: ['https://receipts.daeit.com.sg/twitter-card.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
