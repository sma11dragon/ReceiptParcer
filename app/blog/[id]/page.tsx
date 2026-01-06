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
            // Generating some dummy content based on the ID for demo purposes
            content: getDummyContent(postId),
            author: getDummyAuthor(postId),
            date: 'Jan 6, 2026'
        };
    };

    const getDummyAuthor = (id: string) => {
        if (id === '1') return 'Wei Leong';
        if (id === '2') return 'Harper';
        return 'James';
    };

    const getDummyContent = (id: string) => {
        const dummyText = `
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        
        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
        
        Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
      `;
        return dummyText; // In a real app, this would be rich text
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
