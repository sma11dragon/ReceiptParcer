'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Image as ImageIcon, Bot, Check, ScanLine } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

type Message = {
    id: number;
    type: 'user' | 'bot';
    content: 'image' | 'text' | 'receipt';
    text?: string;
    data?: {
        store: string;
        date: string;
        total: string;
        category: string;
        icon?: string;
    };
};

export const TelegramDemo = () => {
    const { t } = useLanguage();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom directly
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    useEffect(() => {
        let isCancelled = false;

        const runScenario = async () => {
            if (isCancelled) return;
            setMessages([]); // Reset
            setIsTyping(false);

            const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

            // 1. Upload Starbucks
            await wait(1000);
            if (isCancelled) return;
            setMessages(prev => [...prev, { id: 1, type: 'user', content: 'image' }]);

            setIsTyping(true);
            await wait(1500);
            setIsTyping(false);
            if (isCancelled) return;
            setMessages(prev => [...prev, {
                id: 2,
                type: 'bot',
                content: 'receipt',
                data: { store: t.demo.receipt_starbucks, date: 'Today, 9:41 AM', total: '$5.40', category: 'Coffee', icon: 'coffee' }
            }]);

            // 2. Upload Shell
            await wait(2000);
            if (isCancelled) return;
            setMessages(prev => [...prev, { id: 3, type: 'user', content: 'image' }]);

            setIsTyping(true);
            await wait(1500);
            setIsTyping(false);
            if (isCancelled) return;
            setMessages(prev => [...prev, {
                id: 4,
                type: 'bot',
                content: 'receipt',
                data: { store: t.demo.receipt_shell, date: 'Yesterday, 6:30 PM', total: '$45.00', category: 'Fuel', icon: 'fuel' }
            }]);

            // 3. User Question 1
            await wait(2000);
            if (isCancelled) return;
            setMessages(prev => [...prev, { id: 5, type: 'user', content: 'text', text: t.demo.q1 }]);

            setIsTyping(true);
            await wait(1000);
            setIsTyping(false);
            if (isCancelled) return;
            setMessages(prev => [...prev, { id: 6, type: 'bot', content: 'text', text: t.demo.a1 }]);

            // 4. User Question 2
            await wait(2000);
            if (isCancelled) return;
            setMessages(prev => [...prev, { id: 7, type: 'user', content: 'text', text: t.demo.q2 }]);

            setIsTyping(true);
            await wait(1000);
            setIsTyping(false);
            if (isCancelled) return;
            setMessages(prev => [...prev, { id: 8, type: 'bot', content: 'text', text: t.demo.a2 }]);

            // Reset loop after pause
            await wait(6000);
            if (!isCancelled) runScenario();
        };

        runScenario();

        return () => {
            isCancelled = true;
        };
    }, [t]); // Re-run if language (t) changes

    return (
        <div style={{
            background: 'var(--bg-primary)',
            borderRadius: '20px',
            border: '1px solid var(--glass-border)',
            overflow: 'hidden',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            maxWidth: '500px',
            margin: '0 auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
        }}>
            {/* Header */}
            <div style={{
                background: 'var(--bg-secondary)',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                borderBottom: '1px solid var(--glass-border)'
            }}>
                <div style={{ width: '40px', height: '40px', background: 'var(--accent-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bot size={24} color="white" />
                </div>
                <div>
                    <div style={{ fontWeight: '600' }}>ReceiptAI Bot</div>
                    <div style={{ fontSize: '0.8rem', color: '#3b82f6' }}>bot</div>
                </div>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} style={{
                height: '450px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                backgroundImage: 'radial-gradient(var(--glass-border) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                overflowY: 'auto',
                scrollBehavior: 'smooth'
            }}>
                {messages.map((msg) => (
                    <div key={msg.id} className="animate-fade-in-up" style={{
                        alignSelf: msg.type === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                    }}>
                        {/* Image Message */}
                        {msg.content === 'image' && (
                            <div style={{
                                background: 'var(--accent-primary)',
                                padding: '0.5rem',
                                borderRadius: '12px 12px 0 12px',
                            }}>
                                <div style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    height: '80px',
                                    width: '120px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <ImageIcon size={24} color="white" />
                                </div>
                            </div>
                        )}

                        {/* Text Message */}
                        {msg.content === 'text' && (
                            <div style={{
                                background: msg.type === 'user' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                                color: msg.type === 'user' ? 'white' : 'var(--text-primary)',
                                padding: '0.75rem 1rem',
                                borderRadius: msg.type === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                                border: msg.type === 'bot' ? '1px solid var(--glass-border)' : 'none',
                                fontSize: '0.95rem'
                            }}>
                                {msg.text}
                            </div>
                        )}

                        {/* Receipt Card Message */}
                        {msg.content === 'receipt' && msg.data && (
                            <div style={{
                                background: 'var(--bg-secondary)',
                                borderRadius: '12px 12px 12px 0',
                                border: '1px solid var(--glass-border)',
                                overflow: 'hidden'
                            }}>
                                <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16, 185, 129, 0.05)' }}>
                                    <Check size={16} color="#10b981" />
                                    <span style={{ fontWeight: '600', color: '#10b981', fontSize: '0.85rem' }}>{t.demo.message_saved}</span>
                                </div>
                                <div style={{ padding: '1rem' }}>
                                    <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <ScanLine size={18} color="#f59e0b" />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{msg.data.store}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{msg.data.date}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.4rem', paddingBottom: '0.4rem', borderBottom: '1px dashed var(--glass-border)' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>{t.demo.label_total}</span>
                                        <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{msg.data.total}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>{t.demo.label_category}</span>
                                        <span style={{ background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>{msg.data.category}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                    <div className="animate-fade-in" style={{
                        alignSelf: 'flex-start',
                        background: 'var(--bg-secondary)',
                        padding: '0.75rem 1rem',
                        borderRadius: '12px 12px 12px 0',
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--glass-border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <div style={{ width: '6px', height: '6px', background: 'currentColor', borderRadius: '50%', animation: 'bounce 1s infinite 0s' }}></div>
                        <div style={{ width: '6px', height: '6px', background: 'currentColor', borderRadius: '50%', animation: 'bounce 1s infinite 0.2s' }}></div>
                        <div style={{ width: '6px', height: '6px', background: 'currentColor', borderRadius: '50%', animation: 'bounce 1s infinite 0.4s' }}></div>
                    </div>
                )}
            </div>

            {/* Input Area (Static) */}
            <div style={{
                padding: '1rem',
                background: 'var(--bg-secondary)',
                borderTop: '1px solid var(--glass-border)',
                display: 'flex',
                gap: '1rem',
                alignItems: 'center'
            }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', border: '2px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bot size={16} color="var(--text-secondary)" />
                </div>
                <div style={{ flex: 1, height: '40px', background: 'rgba(0,0,0,0.2)', borderRadius: '20px', padding: '0 1rem', display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Message...
                </div>
                <Send size={20} color="var(--accent-primary)" />
            </div>
        </div>
    );
};
