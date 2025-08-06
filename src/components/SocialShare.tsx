'use client';

import { useState } from 'react';

interface SocialShareProps {
  url: string;
  title: string;
  description: string;
  className?: string;
}

export default function SocialShare({ url, title, description, className = '' }: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  const shareData = {
    url: encodeURIComponent(url),
    title: encodeURIComponent(title),
    description: encodeURIComponent(description)
  };

  const socialLinks = [
    {
      name: 'Facebook',
      icon: '📘',
      url: `https://www.facebook.com/sharer/sharer.php?u=${shareData.url}&quote=${shareData.title}`,
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      name: 'Twitter',
      icon: '🐦',
      url: `https://twitter.com/intent/tweet?url=${shareData.url}&text=${shareData.title}`,
      color: 'bg-sky-500 hover:bg-sky-600'
    },
    {
      name: 'LINE',
      icon: '💬',
      url: `https://social-plugins.line.me/lineit/share?url=${shareData.url}&text=${shareData.title}`,
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      name: 'LinkedIn',
      icon: '💼',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${shareData.url}&title=${shareData.title}&summary=${shareData.description}`,
      color: 'bg-blue-700 hover:bg-blue-800'
    }
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleShare = (shareUrl: string) => {
    // Check if Web Share API is available (mobile)
    if (navigator.share) {
      navigator.share({
        title: title,
        text: description,
        url: url
      }).catch(err => {
        console.log('Error sharing:', err);
        // Fallback to opening share URL
        window.open(shareUrl, '_blank', 'width=600,height=400');
      });
    } else {
      // Desktop - open in new window
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  return (
    <div className={`social-share ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">แชร์บทความ</h3>
        <button
          onClick={copyToClipboard}
          className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
            copied 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span>{copied ? '✅' : '🔗'}</span>
          {copied ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {socialLinks.map((social) => (
          <button
            key={social.name}
            onClick={() => handleShare(social.url)}
            className={`flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg transition-colors ${social.color}`}
          >
            <span className="text-lg">{social.icon}</span>
            <span className="font-medium">{social.name}</span>
          </button>
        ))}
      </div>

      {/* Print button */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={() => window.print()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <span>🖨️</span>
          <span className="font-medium">พิมพ์บทความ</span>
        </button>
      </div>

      {/* Reading progress (for longer articles) */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>ความคืบหน้าการอ่าน</span>
          <span id="reading-progress">0%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div 
            id="reading-progress-bar"
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: '0%' }}
          ></div>
        </div>
      </div>

      <style jsx>{`
        @media print {
          .social-share {
            display: none !important;
          }
        }
      `}</style>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            // Reading progress tracker
            function updateReadingProgress() {
              const article = document.querySelector('article');
              if (!article) return;
              
              const articleHeight = article.offsetHeight;
              const articleTop = article.offsetTop;
              const scrollTop = window.pageYOffset;
              const windowHeight = window.innerHeight;
              
              const progress = Math.min(
                100,
                Math.max(0, ((scrollTop + windowHeight - articleTop) / articleHeight) * 100)
              );
              
              const progressElement = document.getElementById('reading-progress');
              const progressBar = document.getElementById('reading-progress-bar');
              
              if (progressElement && progressBar) {
                progressElement.textContent = Math.round(progress) + '%';
                progressBar.style.width = progress + '%';
              }
            }
            
            // Update on scroll
            window.addEventListener('scroll', updateReadingProgress);
            window.addEventListener('resize', updateReadingProgress);
            
            // Initial update
            setTimeout(updateReadingProgress, 100);
          `
        }}
      />
    </div>
  );
}