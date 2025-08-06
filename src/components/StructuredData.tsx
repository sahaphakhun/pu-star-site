import { IArticle } from '@/models/Article';

interface StructuredDataProps {
  article: IArticle;
}

export default function StructuredData({ article }: StructuredDataProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.winrichdynamic.com';
  
  // Article structured data
  const articleStructuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.excerpt,
    "image": article.featuredImage ? `${baseUrl}${article.featuredImage}` : undefined,
    "author": {
      "@type": "Person",
      "name": article.author.name,
      "email": article.author.email
    },
    "publisher": {
      "@type": "Organization",
      "name": "PU STAR Thailand",
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/logo.jpg`
      }
    },
    "datePublished": article.publishedAt || article.createdAt,
    "dateModified": article.updatedAt,
    "url": `${baseUrl}/articles/${article.slug}`,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${baseUrl}/articles/${article.slug}`
    },
    "keywords": article.tags.map(tag => tag.name).join(', '),
    "articleSection": article.tags.length > 0 ? article.tags[0].name : 'บทความ',
    "wordCount": calculateWordCount(article.content),
    "timeRequired": `PT${article.readingTime}M`, // ISO 8601 duration format
    "inLanguage": "th-TH"
  };

  // Breadcrumb structured data
  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "หน้าหลัก",
        "item": baseUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "บทความ",
        "item": `${baseUrl}/articles`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": article.title,
        "item": `${baseUrl}/articles/${article.slug}`
      }
    ]
  };

  // Website structured data
  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "PU STAR Thailand",
    "url": baseUrl,
    "description": "ผู้นำด้านกาว ซีลแลนท์ และผลิตภัณฑ์ PU คุณภาพสูงในประเทศไทย",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/articles?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      {/* Article structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleStructuredData)
        }}
      />
      
      {/* Breadcrumb structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbStructuredData)
        }}
      />
      
      {/* Website structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteStructuredData)
        }}
      />
    </>
  );
}

// Helper function to calculate word count from content blocks
function calculateWordCount(content: any[]): number {
  if (!content || !Array.isArray(content)) return 0;
  
  const textContent = content
    .filter(block => ['text', 'heading', 'quote', 'list'].includes(block.type))
    .map(block => {
      if (block.type === 'text' || block.type === 'heading' || block.type === 'quote') {
        return block.content?.text || '';
      } else if (block.type === 'list') {
        return block.content?.items?.join(' ') || '';
      }
      return '';
    })
    .join(' ');
    
  return textContent.split(/\s+/).filter(word => word.length > 0).length;
}