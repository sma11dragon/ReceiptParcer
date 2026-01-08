'use client';

import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';
import { ArrowLeft, Clock, User, Tag } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function BlogPost() {
    const { t } = useLanguage();
    const params = useParams();
    const id = params?.id as string;

    // Helper to get post data safely
    const getPostData = (postId: string) => {
        // In a real app, this would fetch from an API or CMS
        // Here we map ID to translation keys
        const validIds = ['1', '2', '3'];
        if (!validIds.includes(postId)) return null;

        return {
            title: (t.blog as any)[`post${postId}_title`],
            desc: (t.blog as any)[`post${postId}_desc`],
            tag: (t.blog as any)[`post${postId}_tag`],
            content: getContent(postId),
            author: getAuthor(postId),
            date: 'Jan 6, 2026'
        };
    };

    const getAuthor = (id: string) => {
        if (id === '1') return 'Rachel Tan';
        if (id === '2') return 'Michael Chen';
        return 'James Mitchell';
    };

    const getContent = (id: string) => {
        if (id === '1') {
            return `The Challenge

As Finance Manager at a fast-growing tech company in Singapore, I was drowning in expense claims. My team of 12 sales representatives travels constantly across Southeast Asia — Malaysia, Thailand, Indonesia, Vietnam — meeting clients and closing deals. Every week, I'd receive stacks of Grab receipts, taxi fares, client dinner bills, and hotel invoices in four different currencies.

The old process was brutal. Sales reps would stuff receipts in their wallets, forget about them for weeks, then dump everything on my desk at month-end. I'd spend three full days manually entering data into Excel, cross-referencing exchange rates, and preparing GST reports for IRAS. Errors were common, and reimbursements were always delayed.

Discovering ReceiptAI

A colleague mentioned she'd started using a Telegram bot for receipt tracking. I was skeptical — how could a chat app solve our enterprise-level problems? But desperation pushed me to try it.

The setup took five minutes. Each sales rep connected their Telegram to ReceiptAI, and suddenly, expense tracking became as simple as forwarding a photo. The AI extracts the vendor name, amount, date, and even categorizes the expense automatically. Multi-currency? No problem — it handles SGD, MYR, THB, IDR, and VND seamlessly.

The Results

After three months with ReceiptAI, here's what changed:

• Month-end processing dropped from 3 days to just 4 hours
• GST reporting for IRAS is now automated and error-free
• Reimbursement turnaround improved from 2 weeks to 3 days
• My team actually submits expenses on time (finally!)

The real game-changer was the real-time visibility. I can now see spending patterns as they happen, flag unusual expenses immediately, and forecast our travel budget accurately. My CFO was so impressed, she's rolling out ReceiptAI to the entire APAC finance team.

For any finance professional managing distributed teams across Asia, this isn't just a nice-to-have — it's essential infrastructure.`;
        }

        if (id === '2') {
            return `The Real Estate Hustle

Being a real estate agent in San Francisco means my calendar is a battlefield. On any given week, I'm juggling 15-20 property showings, a dozen client lunches, networking events, staging consultations, and endless drives across the Bay Area. Every single one of these generates receipts that my CPA needs for Schedule C deductions.

Before ReceiptAI, tax season was my worst nightmare. I'd have shoeboxes — literally, multiple shoeboxes — stuffed with crumpled receipts. Gas station slips faded beyond recognition. Restaurant receipts torn in half. Client gift purchases with no record of who they were for. My accountant charged me extra just for the "receipt archaeology" she had to perform.

The Breaking Point

Last April, I nearly missed $12,000 in legitimate deductions because I couldn't find the receipts to support them. That's when a fellow agent at Compass mentioned he'd been using ReceiptAI. "Just snap and send," he said. "The bot does everything else."

I downloaded Telegram that same day.

How It Changed My Business

Now, the moment I get a receipt — whether it's a $4 coffee with a potential client or a $400 staging consultation — I snap a photo and send it to the bot. Within seconds, it's categorized, dated, and stored. The AI even learns my patterns: it knows that Philz Coffee is always "Client Entertainment" and Shell stations are "Vehicle Expenses."

The integration with my workflow is seamless:

• I tag receipts by client or property address
• Monthly summaries show exactly where my money goes
• Quarterly reports are ready for my CPA in one click
• I can search any expense by date, vendor, or category

My CPA's Reaction

When I handed my accountant this year's records, she actually laughed. "These are cleaner than my corporate clients," she said. "What happened to you?"

For the first time in my career, I'm claiming every legitimate deduction. My estimated tax savings this year: over $8,000. ReceiptAI paid for itself about 200 times over.

If you're in real estate — or any profession where expenses are your lifeline to tax savings — stop torturing yourself with shoeboxes. The future is in your pocket.`;
        }

        return `The Tradie's Tax Nightmare

Running a plumbing business in Melbourne sounds simple enough: fix pipes, send invoices, get paid. But anyone who's actually done it knows the paperwork is what kills you. Every job means receipts — copper fittings from Reece, PVC pipes from Bunnings, fuel from wherever's closest, lunch from the servo, parking at job sites. Multiply that by 40-50 jobs a month, and you've got chaos.

For years, my "system" was a shoebox in the ute. End of financial year, I'd dump everything on the kitchen table and spend an entire weekend trying to make sense of it. Half the receipts were faded thermal paper, illegible. The other half were missing entirely. My BAS lodgements were always late, always stressful, and probably always wrong.

My accountant kept warning me: "James, the ATO is cracking down on tradies. You need proper records." Easy for him to say — he's not crawling under houses at 6 AM.

Finding a Better Way

My nephew, who works in IT, set me up with ReceiptAI last winter. I was resistant at first — I'm not exactly tech-savvy, and I figured it'd be another app I'd never use. But he showed me how simple it was: just take a photo of the receipt and send it to a Telegram bot. Done.

The first time it automatically categorized a Bunnings receipt as "Materials" and a BP receipt as "Fuel," I was sold. The AI actually understands what tradies buy. It knows Reece is plumbing supplies, not retail. It knows Kennards is tool hire. It even handles handwritten receipts from small suppliers.

The BAS Revolution

Come BAS time, I was genuinely shocked. Instead of a weekend of spreadsheet hell, I exported a clean report in about 10 minutes. Everything was categorized, GST was calculated, and I could see exactly what I'd spent on materials versus fuel versus tools.

My accountant nearly fell off his chair. "This is the cleanest set of books you've ever given me," he said. "What changed?"

Here's what the numbers look like now:

• BAS preparation: from 2 days to 30 minutes
• Missing receipts: from ~30% to basically zero
• Accountant fees: down by $800/year (less time sorting my mess)
• Tax deductions claimed: up 15% (because I'm actually capturing everything)

Advice for Fellow Tradies

Look, I get it. We're not accountants, and we don't want to be. But the ATO doesn't care. They want records, and they want them right. ReceiptAI lets me do the bare minimum — snap a photo after each purchase — and handles everything else.

If you're still using the shoebox method, do yourself a favor. Your future self, sitting at that kitchen table in June, will thank you.`;
    };

    const post = getPostData(id);

    if (!post) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
                    <Link href="/" className="text-accent hover:underline">Return Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen" style={{ paddingTop: '100px', paddingBottom: '4rem' }}>
            {/* Navbar Background for consistency */}
            <nav className="fixed w-full z-50 top-0 left-0 transition-all duration-300" style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--glass-border)' }}>
                <div className="container" style={{ display: 'flex', alignItems: 'center', height: '80px' }}>
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.25rem' }}>
                        <ArrowLeft size={20} />
                        <span>Back</span>
                    </Link>
                </div>
            </nav>

            <div className="container max-w-3xl">
                <span className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-6" style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-primary)' }}>
                    {post.tag}
                </span>

                <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                    {post.title}
                </h1>

                <div className="flex items-center gap-6 text-sm text-gray-400 mb-12 border-b border-white/10 pb-8" style={{ color: 'var(--text-secondary)' }}>
                    <div className="flex items-center gap-2">
                        <User size={16} />
                        <span>{post.author}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock size={16} />
                        <span>{post.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Tag size={16} />
                        <span>Success Story</span>
                    </div>
                </div>

                <div className="prose prose-invert max-w-none">
                    <p className="text-xl mb-8 leading-relaxed font-light" style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
                        {post.desc}
                    </p>
                    <div style={{ whiteSpace: 'pre-line', lineHeight: '1.8', color: 'var(--text-secondary)' }}>
                        {post.content}
                    </div>
                </div>
            </div>
        </div>
    );
}
