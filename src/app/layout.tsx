import { Inter } from 'next/font/google';
import './globals.css';
import './mobile-keyboard-fix.css';
import { AuthProvider } from '@/contexts/AuthContext';
import ClientSideEffects from '@/components/ClientSideEffects';
import { SiteInfoProvider, SiteInfo } from '@/contexts/SiteInfoContext';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: false, // Changed from true to false to prevent preload warnings
  fallback: ['system-ui', 'arial']
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let siteInfo: SiteInfo = {
    siteName: 'WINRICH DYNAMIC',
    logoUrl: '/favicon.ico',
    description:
      'ระบบจัดการร้านค้าออนไลน์ที่ครบครันสำหรับธุรกิจขนาดกลางและขนาดใหญ่ พัฒนาด้วย Next.js, TypeScript และ MongoDB'
  };

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.winrichdynamic.com'}/api/admin/settings/logo`,
      {
        next: { revalidate: 3600 }
      }
    );
    if (response.ok) {
      const data = await response.json();
      if (data?.success) {
        siteInfo = {
          siteName: data.data.siteName,
          logoUrl: data.data.logoUrl,
          description: data.data.description || siteInfo.description
        };
      }
    }
  } catch (error) {
    // ignore errors and use default site info
  }

  const { siteName, description, logoUrl } = siteInfo;

  return (
    <html lang="th" className="scroll-smooth">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#223f81" />
        <meta name="color-scheme" content="light dark" />

        {/* SEO Meta Tags */}
        <title>{siteName}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content="ร้านค้าออนไลน์, ระบบจัดการ, e-commerce, Next.js, TypeScript, MongoDB" />
        <meta name="author" content="WinRich Team" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://winrichdynamic.com" />
        <meta property="og:title" content={siteName} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={logoUrl} />
        <meta property="og:site_name" content={siteName} />
        <meta property="og:locale" content="th_TH" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://winrichdynamic.com" />
        <meta property="twitter:title" content={siteName} />
        <meta property="twitter:description" content={description} />
        <meta property="twitter:image" content={logoUrl} />

        {/* Additional Meta Tags */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={siteName} />

        {/* Icons - Fixed paths */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />

        {/* Optimized Resource Loading - Removed problematic preloads */}
        <link rel="dns-prefetch" href="//res.cloudinary.com" />
        <link rel="dns-prefetch" href="//www.winrichdynamic.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: siteName,
              url: 'https://winrichdynamic.com',
              logo: logoUrl,
              description,
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'customer service',
                availableLanguage: 'Thai'
              },
              sameAs: [
                'https://www.facebook.com/winrichdynamic',
                'https://www.instagram.com/winrichdynamic'
              ]
            })
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <SiteInfoProvider siteInfo={siteInfo}>
          <AuthProvider>
            <ClientSideEffects />
            <main className="min-h-screen bg-gray-100">{children}</main>
            <footer className="bg-white border-t border-gray-200">
              <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{siteName}</h3>
                    <p className="text-gray-600 text-sm">{description}</p>
                  </div>
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-4">บริการ</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li><a href="/shop" className="hover:text-blue-600">ร้านค้า</a></li>
                      <li><a href="/articles" className="hover:text-blue-600">บทความ</a></li>
                      <li><a href="/contact" className="hover:text-blue-600">ติดต่อ</a></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-4">สนับสนุน</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li><a href="/customer-service" className="hover:text-blue-600">บริการลูกค้า</a></li>
                      <li><a href="/customer-service/faq" className="hover:text-blue-600">คำถามที่พบบ่อย</a></li>
                      <li><a href="/privacy-policy" className="hover:text-blue-600">นโยบายความเป็นส่วนตัว</a></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-4">ติดต่อ</h4>
                    <div className="text-sm text-gray-600">
                      <p>📧 info@winrichdynamic.com</p>
                      <p>📱 02-XXX-XXXX</p>
                      <p>📍 กรุงเทพมหานคร, ประเทศไทย</p>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-200 mt-8 pt-8 text-center">
                  <p className="text-sm text-gray-500">
                    &copy; {new Date().getFullYear()} {siteName} - สงวนลิขสิทธิ์ |
                    พัฒนาด้วย ❤️ โดย WinRich Team
                  </p>
                </div>
              </div>
            </footer>
          </AuthProvider>
        </SiteInfoProvider>
      </body>
    </html>
  );
}
