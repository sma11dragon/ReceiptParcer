'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ScanLine, Bot, LineChart, ShieldCheck, Check, Star, Mail, ArrowRight, Zap, Upload, MessageSquare, FileText } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { TelegramDemo } from '@/components/TelegramDemo';

export default function Home() {
  const { t } = useLanguage();

  useEffect(() => {
    // Detect browser environment for optimization
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      console.log("Optimizing layout for Mobile Browser...");
      // Additional mobile-specific logic can go here (CSS already handles layout)
    } else {
      console.log("Optimizing layout for Desktop Browser...");
    }
  }, []);

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="fixed w-full z-50 transition-all duration-300" style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--glass-border)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '80px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.25rem' }}>
            <ScanLine className="text-accent" color="var(--accent-primary)" />
            <span>ReceiptAI</span>
          </div>
          <div className="desktop-only" style={{ display: 'none', alignItems: 'center', gap: '2rem' }}>
            <Link href="#features" style={{ color: 'var(--text-secondary)', transition: 'color 0.2s' }} className="hover:text-white">{t.navbar?.features || 'Features'}</Link>
            <Link href="#how-it-works" style={{ color: 'var(--text-secondary)', transition: 'color 0.2s' }} className="hover:text-white">{t.navbar?.howItWorks || 'How it Works'}</Link>
            <Link href="#pricing" style={{ color: 'var(--text-secondary)', transition: 'color 0.2s' }} className="hover:text-white">{t.navbar?.pricing || 'Pricing'}</Link>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <LanguageSwitcher />
            <Link href="/login" className="btn btn-ghost" style={{ border: 'none' }}>{t.navbar.login}</Link>
            <Link href="/register" className="btn btn-primary hidden md:inline-flex">{t.navbar.started}</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="section" style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', paddingTop: '120px', paddingBottom: '4rem' }}>
        <div className="container grid grid-cols-1 md:grid-cols-2 gap-12" style={{ alignItems: 'center' }}>
          <div className="animate-fade-in order-2 md:order-1">
            <div style={{ display: 'inline-block', padding: '0.5rem 1rem', borderRadius: '100px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', color: 'var(--accent-primary)', fontSize: '0.875rem', fontWeight: '600', marginBottom: '1.5rem' }}>
              #1 Receipt Parsing Solution for Teams
            </div>
            <h1 className="hero-title" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', lineHeight: '1.05', marginBottom: '1.5rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
              {t.hero.title_start} <br />
              <span className="text-gradient">{t.hero.title_end}</span>
            </h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '90%', lineHeight: '1.6' }}>
              {t.hero.subtitle}
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link href="/register" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}>{t.hero.cta_primary}</Link>
              <Link href="#features" className="btn btn-outline" style={{ padding: '1rem 2rem', fontSize: '1.125rem' }}>{t.hero.cta_secondary}</Link>
            </div>
          </div>
          <div className="animate-fade-in delay-200 order-1 md:order-2" style={{ position: 'relative' }}>
            {/* Abstract Glow Background */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '300px', height: '300px', background: 'var(--accent-primary)', filter: 'blur(100px)', opacity: '0.2', borderRadius: '50%', zIndex: '-1' }}></div>

            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
              {/* Concept UI Mockup */}
              <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#EF4444' }}></div>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#F59E0B' }}></div>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10B981' }}></div>
              </div>
              <div style={{ padding: '2rem 2rem 6rem 2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{t.hero.mockup_total}</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>$2,459.50</div>
                  </div>
                  <div className="card" style={{ padding: '0.5rem 1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <span style={{ color: '#10B981', fontSize: '0.875rem' }}>+12.5%</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{t.hero.mockup_activity}</div>
                  <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                    {/* Item 1 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ width: '40px', height: '40px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ScanLine size={18} className="text-accent" />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.875rem' }}>{t.hero.item_coffee}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Today, 9:41 AM</div>
                        </div>
                      </div>
                      <div style={{ fontWeight: '600' }}>-$5.40</div>
                    </div>
                    {/* Item 2 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ width: '40px', height: '40px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ScanLine size={18} color="#f59e0b" />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.875rem' }}>{t.hero.item_fuel}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Yesterday, 6:30 PM</div>
                        </div>
                      </div>
                      <div style={{ fontWeight: '600' }}>-$45.00</div>
                    </div>
                    {/* Item 3 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ width: '40px', height: '40px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ScanLine size={18} color="#3b82f6" />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.875rem' }}>{t.hero.item_store}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Yesterday, 2:15 PM</div>
                        </div>
                      </div>
                      <div style={{ fontWeight: '600' }}>-$12.80</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Element */}
            <div className="card animate-fade-in delay-300" style={{ position: 'absolute', top: '-10px', right: '-10px', padding: '1rem', minWidth: '200px', display: 'flex', alignItems: 'center', gap: '1rem', zIndex: 10 }}>
              <div style={{ width: '40px', height: '40px', background: 'var(--accent-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot color="white" size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>{t.hero.mockup_active}</div>
                <div style={{ fontSize: '0.75rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }}></div>
                  {t.hero.status}: {t.hero.connected}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section className="section" style={{ borderTop: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>{t.demo.title}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>{t.demo.subtitle}</p>
          </div>
          <div style={{ padding: '3rem 0' }}>
            <TelegramDemo />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>{t.features.title}</h2>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>{t.features.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card hover-glow" style={{ textAlign: 'center' }}>
              <div style={{ width: '50px', height: '50px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <ScanLine className="text-accent" />
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '600' }}>{t.features.f1_title}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {t.features.f1_desc}
              </p>
            </div>
            <div className="card hover-glow">
              <div style={{ width: '50px', height: '50px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <Bot className="text-accent" />
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '600' }}>{t.features.f2_title}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {t.features.f2_desc}
              </p>
            </div>
            <div className="card hover-glow">
              <div style={{ width: '50px', height: '50px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <LineChart className="text-accent" />
              </div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '600' }}>{t.features.f3_title}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {t.features.f3_desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="section">
        <div className="container">
          <div className="text-center" style={{ marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>{t.howItWorks?.title || 'How It Works'}</h2>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>{t.howItWorks?.subtitle || 'Three simple steps to automate your expense tracking'}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="card" style={{ textAlign: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', width: '30px', height: '30px', background: 'var(--accent-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.875rem' }}>1</div>
              <div style={{ width: '60px', height: '60px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '1rem auto 1.5rem' }}>
                <Upload size={28} color="var(--accent-primary)" />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '600' }}>{t.howItWorks?.step1_title || 'Snap & Send'}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {t.howItWorks?.step1_desc || 'Take a photo of any receipt and send it to our Telegram bot. That\'s it - no apps to download, no forms to fill.'}
              </p>
            </div>
            {/* Step 2 */}
            <div className="card" style={{ textAlign: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', width: '30px', height: '30px', background: 'var(--accent-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.875rem' }}>2</div>
              <div style={{ width: '60px', height: '60px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '1rem auto 1.5rem' }}>
                <Bot size={28} color="var(--accent-primary)" />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '600' }}>{t.howItWorks?.step2_title || 'AI Extracts Data'}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {t.howItWorks?.step2_desc || 'Our AI instantly reads the receipt, extracting vendor, date, amount, and line items with 99% accuracy.'}
              </p>
            </div>
            {/* Step 3 */}
            <div className="card" style={{ textAlign: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)', width: '30px', height: '30px', background: 'var(--accent-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.875rem' }}>3</div>
              <div style={{ width: '60px', height: '60px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '1rem auto 1.5rem' }}>
                <FileText size={28} color="var(--accent-primary)" />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '600' }}>{t.howItWorks?.step3_title || 'Export & Report'}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {t.howItWorks?.step3_desc || 'Access your organized expenses anytime. Export to CSV, PDF, or sync directly with your accounting software.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="text-center" style={{ marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>{t.pricing?.title || 'Simple, Transparent Pricing'}</h2>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>{t.pricing?.subtitle || 'Start free, upgrade when you need more'}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            {/* Free Plan */}
            <div className="card" style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: '600' }}>{t.pricing?.free_title || 'Starter'}</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{t.pricing?.free_desc || 'Perfect for personal use'}</p>
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '3rem', fontWeight: 'bold' }}>$0</span>
                <span style={{ color: 'var(--text-secondary)' }}>/month</span>
              </div>
              <ul style={{ textAlign: 'left', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}><Check size={16} color="#10B981" /> {t.pricing?.free_f1 || '50 receipts/month'}</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}><Check size={16} color="#10B981" /> {t.pricing?.free_f2 || 'Basic OCR extraction'}</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}><Check size={16} color="#10B981" /> {t.pricing?.free_f3 || 'CSV export'}</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}><Check size={16} color="#10B981" /> {t.pricing?.free_f4 || 'Email support'}</li>
              </ul>
              <Link href="/register" className="btn btn-outline" style={{ width: '100%' }}>{t.pricing?.free_cta || 'Get Started Free'}</Link>
            </div>

            {/* Pro Plan */}
            <div className="card" style={{ textAlign: 'center', border: '2px solid var(--accent-primary)', transform: 'scale(1.05)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--accent-primary)', padding: '0.25rem 1rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' }}>{t.pricing?.popular || 'MOST POPULAR'}</div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: '600' }}>{t.pricing?.pro_title || 'Professional'}</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{t.pricing?.pro_desc || 'For freelancers & small teams'}</p>
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '3rem', fontWeight: 'bold' }}>$19</span>
                <span style={{ color: 'var(--text-secondary)' }}>/month</span>
              </div>
              <ul style={{ textAlign: 'left', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}><Check size={16} color="#10B981" /> {t.pricing?.pro_f1 || 'Unlimited receipts'}</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}><Check size={16} color="#10B981" /> {t.pricing?.pro_f2 || 'Advanced AI categorization'}</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}><Check size={16} color="#10B981" /> {t.pricing?.pro_f3 || 'Multi-currency support'}</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}><Check size={16} color="#10B981" /> {t.pricing?.pro_f4 || 'PDF & Excel exports'}</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}><Check size={16} color="#10B981" /> {t.pricing?.pro_f5 || 'Priority support'}</li>
              </ul>
              <Link href="/register" className="btn btn-primary" style={{ width: '100%' }}>{t.pricing?.pro_cta || 'Start 14-Day Free Trial'}</Link>
            </div>

            {/* Enterprise Plan */}
            <div className="card" style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: '600' }}>{t.pricing?.enterprise_title || 'Enterprise'}</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{t.pricing?.enterprise_desc || 'For large organizations'}</p>
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '3rem', fontWeight: 'bold' }}>{t.pricing?.enterprise_price || 'Custom'}</span>
              </div>
              <ul style={{ textAlign: 'left', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}><Check size={16} color="#10B981" /> {t.pricing?.enterprise_f1 || 'Everything in Pro'}</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}><Check size={16} color="#10B981" /> {t.pricing?.enterprise_f2 || 'Unlimited team members'}</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}><Check size={16} color="#10B981" /> {t.pricing?.enterprise_f3 || 'SSO & advanced security'}</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}><Check size={16} color="#10B981" /> {t.pricing?.enterprise_f4 || 'Custom integrations'}</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}><Check size={16} color="#10B981" /> {t.pricing?.enterprise_f5 || 'Dedicated account manager'}</li>
              </ul>
              <Link href="/register" className="btn btn-outline" style={{ width: '100%' }}>{t.pricing?.enterprise_cta || 'Contact Sales'}</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section">
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>{t.testimonials.title}</h2>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>{t.testimonials.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="card" style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem' }}>
                {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={16} fill="#F59E0B" color="#F59E0B" />)}
              </div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontStyle: 'italic' }}>
                {t.testimonials.t1_text}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#cbd5e1' }}></div>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{(t.testimonials as any).t1_name}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{t.testimonials.t1_role}</div>
                </div>
              </div>
            </div>
            {/* Testimonial 2 */}
            <div className="card" style={{ textAlign: 'left', transform: 'scale(1.05)', border: '1px solid var(--accent-primary)', boxShadow: '0 0 30px rgba(139, 92, 246, 0.15)' }}>
              <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem' }}>
                {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={16} fill="#F59E0B" color="#F59E0B" />)}
              </div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontStyle: 'italic' }}>
                {t.testimonials.t2_text}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#cbd5e1' }}></div>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{(t.testimonials as any).t2_name}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{t.testimonials.t2_role}</div>
                </div>
              </div>
            </div>
            {/* Testimonial 3 */}
            <div className="card" style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem' }}>
                {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={16} fill="#F59E0B" color="#F59E0B" />)}
              </div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontStyle: 'italic' }}>
                {t.testimonials.t3_text}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#cbd5e1' }}></div>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{(t.testimonials as any).t3_name}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{t.testimonials.t3_role}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(30, 41, 59, 0.7))', padding: '4rem 2rem', textAlign: 'center', border: '1px solid var(--accent-primary)' }}>
            <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(139, 92, 246, 0.2)', borderRadius: '50%', marginBottom: '1.5rem' }}>
              <Mail size={32} color="var(--accent-primary)" />
            </div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>{t.newsletter.title}</h2>
            <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
              {t.newsletter.desc}
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', maxWidth: '500px', margin: '0 auto', flexWrap: 'wrap' }}>
              <input
                type="email"
                placeholder={t.newsletter.placeholder}
                className="card"
                style={{ flex: 1, margin: 0, background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--glass-border)', minWidth: '250px' }}
              />
              <button className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                {t.newsletter.button}
              </button>
            </div>
            <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {t.newsletter.privacy}
            </p>
          </div>

          {/* Blog / News Section */}
          <div style={{ marginTop: '6rem' }}>
            <div className="text-center" style={{ marginBottom: '3rem' }}>
              <h3 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>{t.blog.title}</h3>
              <p style={{ color: 'var(--text-secondary)' }}>{t.blog.subtitle}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Post 1 */}
              <div className="card hover-glow" style={{ textAlign: 'left', padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: '200px', background: 'linear-gradient(135deg, #1e293b, #0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--glass-border)' }}>
                  <span style={{ padding: '0.5rem 1rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '20px', color: 'var(--accent-primary)', fontSize: '0.875rem', fontWeight: '500' }}>{t.blog.post1_tag}</span>
                </div>
                <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', lineHeight: '1.4' }}>{t.blog.post1_title}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', flex: 1 }}>{t.blog.post1_desc}</p>
                  <Link href="/blog/1" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', fontWeight: '500' }}>
                    {t.blog.read_more} <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
              {/* Post 2 */}
              <div className="card hover-glow" style={{ textAlign: 'left', padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: '200px', background: 'linear-gradient(135deg, #1e293b, #0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--glass-border)' }}>
                  <span style={{ padding: '0.5rem 1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '20px', color: '#10b981', fontSize: '0.875rem', fontWeight: '500' }}>{t.blog.post2_tag}</span>
                </div>
                <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', lineHeight: '1.4' }}>{t.blog.post2_title}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', flex: 1 }}>{t.blog.post2_desc}</p>
                  <Link href="/blog/2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', fontWeight: '500' }}>
                    {t.blog.read_more} <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
              {/* Post 3 */}
              <div className="card hover-glow" style={{ textAlign: 'left', padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: '200px', background: 'linear-gradient(135deg, #1e293b, #0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--glass-border)' }}>
                  <span style={{ padding: '0.5rem 1rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '20px', color: '#f59e0b', fontSize: '0.875rem', fontWeight: '500' }}>{t.blog.post3_tag}</span>
                </div>
                <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', lineHeight: '1.4' }}>{t.blog.post3_title}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', flex: 1 }}>{t.blog.post3_desc}</p>
                  <Link href="/blog/3" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-primary)', fontWeight: '500' }}>
                    {t.blog.read_more} <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--bg-primary)', padding: '4rem 0', borderTop: '1px solid var(--glass-border)' }}>
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.5rem', marginBottom: '1rem' }}>
                <ScanLine className="text-accent" color="var(--accent-primary)" />
                <span>ReceiptAI</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', maxWidth: '300px' }}>
                {t.footer.desc}
              </p>
            </div>
            <div>
              <h4 style={{ fontWeight: 'bold', marginBottom: '1.5rem' }}>{t.footer.product}</h4>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-secondary)' }}>
                <li><Link href="#features" className="hover:text-white transition-colors">{t.navbar?.features || 'Features'}</Link></li>
                <li><Link href="#how-it-works" className="hover:text-white transition-colors">{t.navbar?.howItWorks || 'How it Works'}</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">{t.navbar?.pricing || 'Pricing'}</Link></li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontWeight: 'bold', marginBottom: '1.5rem' }}>{t.footer.resources}</h4>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-secondary)' }}>
                <li><Link href="/blog/1" className="hover:text-white transition-colors">{t.blog?.title || 'Success Stories'}</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">{t.navbar?.started || 'Get Started'}</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">{t.navbar?.login || 'Login'}</Link></li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontWeight: 'bold', marginBottom: '1.5rem' }}>{t.footer.company}</h4>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-secondary)' }}>
                <li><Link href="#features" className="hover:text-white transition-colors">{t.navbar?.features || 'About'}</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">{t.navbar?.pricing || 'Pricing'}</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">{t.navbar?.started || 'Contact'}</Link></li>
              </ul>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <div>{t.footer.rights}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={16} />
                <span>{t.footer.secure}</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
