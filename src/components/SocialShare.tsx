'use client';

import { useMemo, useState } from 'react';

interface SocialShareProps {
  url: string;
  title: string;
  description: string;
  className?: string;
}

export default function SocialShare({ url, title, description, className = '' }: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  const encoded = useMemo(() => ({
    url: encodeURIComponent(url),
    title: encodeURIComponent(title),
    description: encodeURIComponent(description)
  }), [url, title, description]);

  const socialLinks = [
    {
      name: 'Facebook',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
          <path d="M22 12.07C22 6.48 17.52 2 11.93 2S2 6.48 2 12.07c0 4.99 3.66 9.13 8.44 9.93v-7.02H7.9v-2.91h2.54V9.41c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.91h-2.34V22c4.78-.8 8.44-4.94 8.44-9.93z"/>
        </svg>
      ),
      href: (e: typeof encoded) => `https://www.facebook.com/sharer/sharer.php?u=${e.url}&quote=${e.title}`,
      className: 'text-white bg-[#1877F2] hover:bg-[#166FE5]'
    },
    {
      name: 'X',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
          <path d="M18.146 2H21L13.5 10.59 22 22h-6.146l-5.2-6.79L4.6 22H2l8.05-9.2L2 2h6.146l4.873 6.5L18.146 2z"/>
        </svg>
      ),
      href: (e: typeof encoded) => `https://twitter.com/intent/tweet?url=${e.url}&text=${e.title}`,
      className: 'text-white bg-black hover:bg-zinc-800'
    },
    {
      name: 'LINE',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
          <path d="M20.666 3.334C22.035 4.703 22.8 6.54 22.8 8.571c0 5.07-5.514 9.186-12.32 9.186-1.092 0-2.147-.11-3.153-.315L2 21.8l2.57-4.521C3.639 15.84 2.8 14.284 2.8 12.614 2.8 7.546 8.315 3.429 15.12 3.429c2.032 0 3.869.765 5.246 1.934z"/>
        </svg>
      ),
      href: (e: typeof encoded) => `https://social-plugins.line.me/lineit/share?url=${e.url}&text=${e.title}`,
      className: 'text-white bg-[#06C755] hover:bg-[#05b04c]'
    },
    {
      name: 'LinkedIn',
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
          <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V24h-4V8zM8.5 8h3.8v2.2h.05c.53-1 1.83-2.2 3.77-2.2 4.03 0 4.78 2.65 4.78 6.1V24h-4v-7.1c0-1.7-.03-3.9-2.4-3.9-2.4 0-2.77 1.87-2.77 3.8V24h-4V8z"/>
        </svg>
      ),
      href: (e: typeof encoded) => `https://www.linkedin.com/sharing/share-offsite/?url=${e.url}&title=${e.title}&summary=${e.description}`,
      className: 'text-white bg-[#0A66C2] hover:bg-[#0a5bb0]'
    }
  ] as const;

  const handleShareOrOpen = (shareUrl: string) => {
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      (navigator as any)
        .share({ title, text: description, url })
        .catch(() => window.open(shareUrl, '_blank', 'width=600,height=400'));
      return;
    }
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (_) {
      setCopied(false);
    }
  };

  return (
    <div className={`social-share ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">แชร์บทความ</h3>
          <p className="text-xs text-gray-500">บอกต่อบนโซเชียลที่คุณใช้</p>
        </div>
        <button
          onClick={copyToClipboard}
          className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-full border transition-colors ${
            copied ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
          }`}
          aria-label="คัดลอกลิงก์บทความ"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden>
            <path d="M3.9 12a3.9 3.9 0 013.9-3.9h3v2h-3A1.9 1.9 0 006 12a1.9 1.9 0 001.9 1.9h3v2h-3A3.9 3.9 0 013.9 12zm6.1 1h4v-2h-4v2zm6.1-4.9A1.9 1.9 0 0014.1 10h-3V8h3a3.9 3.9 0 013.9 3.9 3.9 3.9 0 01-3.9 3.9h-3v-2h3A1.9 1.9 0 0016.1 12z"/>
          </svg>
          {copied ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {socialLinks.map((item) => (
          <button
            key={item.name}
            onClick={() => handleShareOrOpen(item.href(encoded))}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors ${item.className}`}
            aria-label={`แชร์ไปที่ ${item.name}`}
          >
            {item.icon}
            <span className="font-medium text-sm">{item.name}</span>
          </button>
        ))}
      </div>

      <style jsx>{`
        @media print { .social-share { display: none !important; } }
      `}</style>
    </div>
  );
}