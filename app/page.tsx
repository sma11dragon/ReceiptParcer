'use client';

import Link from 'next/link';
import { ScanLine, Bot, LineChart, ShieldCheck, Check, Star, Mail } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { TelegramDemo } from '@/components/TelegramDemo';

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="fixed w-full z-50 transition-all duration-300" style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--glass-border)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '80px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.25rem' }}>
            <ScanLine className="text-accent" color="var(--accent-primary)" />
            <span>ReceiptAI</span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <LanguageSwitcher />
            <Link href="/login" className="btn btn-ghost" style={{ border: 'none' }}>{t.navbar.login}</Link>
            <Link href="/register" className="btn btn-primary">{t.navbar.started}</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="section" style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', paddingTop: '120px' }}>
        <div className="container grid grid-cols-2" style={{ alignItems: 'center' }}>
          <div className="animate-fade-in">
            <h1 style={{ fontSize: '3.5rem', lineHeight: '1.1', marginBottom: '1.5rem', fontWeight: '800' }}>
              {t.hero.title_start} <br />
              <span className="text-gradient">{t.hero.title_end}</span>
            </h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
              {t.hero.subtitle}
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link href="/register" className="btn btn-primary">{t.hero.cta_primary}</Link>
              <Link href="#features" className="btn btn-outline">{t.hero.cta_secondary}</Link>
            </div>
          </div>
          <div className="animate-fade-in delay-200" style={{ position: 'relative' }}>
            {/* Abstract Glow Background */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '300px', height: '300px', background: 'var(--accent-primary)', filter: 'blur(100px)', opacity: '0.2', borderRadius: '50%', zIndex: '-1' }}></div>

            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
              {/* Concept UI Mockup */}
              <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#EF4444' }}></div>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#F59E0B' }}></div>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10B981' }}></div>
              </div>
              <div style={{ padding: '2rem' }}>
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
            <div className="card animate-fade-in delay-300" style={{ position: 'absolute', bottom: '-20px', right: '-20px', padding: '1rem', minWidth: '200px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
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

          <div className="grid grid-cols-3">
            <div className="card hover-glow">
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

      {/* Testimonials Section */}
      <section className="section">
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>{t.testimonials.title}</h2>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>{t.testimonials.subtitle}</p>
          </div>

          <div className="grid grid-cols-3">
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
                  <div style={{ fontWeight: 'bold' }}>Sarah J.</div>
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
                  <div style={{ fontWeight: 'bold' }}>Michael C.</div>
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
                  <div style={{ fontWeight: 'bold' }}>Elena R.</div>
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
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', maxWidth: '500px', margin: '0 auto' }}>
              <input
                type="email"
                placeholder={t.newsletter.placeholder}
                className="card"
                style={{ flex: 1, margin: 0, background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--glass-border)' }}
              />
              <button className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                {t.newsletter.button}
              </button>
            </div>
            <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {t.newsletter.privacy}
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--bg-primary)', padding: '4rem 0', borderTop: '1px solid var(--glass-border)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '4rem', marginBottom: '4rem' }}>
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
                <li><Link href="#" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Integration</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontWeight: 'bold', marginBottom: '1.5rem' }}>{t.footer.resources}</h4>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-secondary)' }}>
                <li><Link href="#" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">API Reference</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontWeight: 'bold', marginBottom: '1.5rem' }}>{t.footer.company}</h4>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-secondary)' }}>
                <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
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
