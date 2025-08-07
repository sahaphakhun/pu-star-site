'use client';

import React from 'react';
import Image from 'next/image';
import { IContentBlock, ITextContent, IHeadingContent, IImageContent, IQuoteContent, IListContent } from '@/models/Article';

interface ArticleRendererProps {
  content: IContentBlock[];
  className?: string;
}

const ArticleRenderer: React.FC<ArticleRendererProps> = ({ content, className = '' }) => {
  const slugify = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^\u0E00-\u0E7Fa-z0-9\s-]/g, '') // keep Thai letters, alphanumerics, spaces and dashes
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  const getAlignmentClass = (alignment?: string) => {
    switch (alignment) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  };

  const getFontSizeClass = (fontSize?: string) => {
    switch (fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      case 'xlarge': return 'text-xl';
      default: return 'text-base';
    }
  };

  const getFontWeightClass = (fontWeight?: string) => {
    return fontWeight === 'bold' ? 'font-bold' : 'font-normal';
  };

  const renderBlock = (block: IContentBlock, index: number) => {
    const baseClasses = `
      ${getAlignmentClass(block.styles.alignment)}
      ${getFontSizeClass(block.styles.fontSize)}
      ${getFontWeightClass(block.styles.fontWeight)}
    `;

    const blockStyle: React.CSSProperties = {
      color: block.styles.color,
      backgroundColor: block.styles.backgroundColor,
      padding: block.styles.padding,
      margin: block.styles.margin
    };

    switch (block.type) {
      case 'text':
        const textContent = block.content as ITextContent;
        return (
          <div 
            key={block.id || index} 
            className={`${baseClasses} mb-4`}
            style={blockStyle}
          >
            {textContent.format === 'html' ? (
              <div 
                dangerouslySetInnerHTML={{ __html: textContent.text }}
              />
            ) : (
              <p className="leading-relaxed">{textContent.text}</p>
            )}
          </div>
        );

      case 'heading':
        const headingContent = block.content as IHeadingContent;
        const HeadingTag = `h${headingContent.level}` as keyof JSX.IntrinsicElements;
        const headingId = `${slugify(headingContent.text)}-${index}`;
        
        const headingClasses = {
          1: 'text-4xl font-bold mb-6 mt-8',
          2: 'text-3xl font-bold mb-5 mt-7',
          3: 'text-2xl font-semibold mb-4 mt-6',
          4: 'text-xl font-semibold mb-3 mt-5',
          5: 'text-lg font-medium mb-3 mt-4',
          6: 'text-base font-medium mb-2 mt-3'
        };

        return (
          <HeadingTag
            id={headingId}
            key={block.id || index}
            className={`${baseClasses} ${headingClasses[headingContent.level]} text-gray-900 scroll-mt-24`}
            style={blockStyle}
          >
            {headingContent.text}
          </HeadingTag>
        );

      case 'image':
        const imageContent = block.content as IImageContent;
        
        if (!imageContent.src) return null;

        const getImageWidth = (width?: string) => {
          switch (width) {
            case '25%': return 'w-1/4';
            case '50%': return 'w-1/2';
            case '75%': return 'w-3/4';
            case '100%': return 'w-full';
            default: return 'w-auto';
          }
        };

        return (
          <div 
            key={block.id || index} 
            className={`${baseClasses} mb-6`}
            style={blockStyle}
          >
            <figure className={`${getImageWidth(imageContent.width)} mx-auto`}>
              <div className="relative">
                <Image
                  src={imageContent.src}
                  alt={imageContent.alt}
                  width={800}
                  height={600}
                  className={`rounded-lg shadow-md ring-1 ring-gray-200 ${
                    imageContent.objectFit === 'contain' ? 'object-contain' :
                    imageContent.objectFit === 'fill' ? 'object-fill' : 'object-cover'
                  }`}
                  style={{
                    width: '100%',
                    height: imageContent.height || 'auto'
                  }}
                />
              </div>
              {imageContent.caption && (
                <figcaption className="text-sm text-gray-600 mt-3 italic text-center leading-relaxed">
                  {imageContent.caption}
                </figcaption>
              )}
            </figure>
          </div>
        );

      case 'quote':
        const quoteContent = block.content as IQuoteContent;
        return (
          <blockquote
            key={block.id || index}
            className={`${baseClasses} mb-6 border-l-4 border-primary pl-6 py-4 bg-primary/5 rounded-r-lg`}
            style={blockStyle}
          >
            <p className="text-lg italic text-gray-800 leading-relaxed mb-2">
              "{quoteContent.text}"
            </p>
            {(quoteContent.author || quoteContent.source) && (
              <footer className="text-sm text-gray-600">
                {quoteContent.author && <span className="font-medium">— {quoteContent.author}</span>}
                {quoteContent.source && <span>, {quoteContent.source}</span>}
              </footer>
            )}
          </blockquote>
        );

      case 'list':
        const listContent = block.content as IListContent;
        const ListTag = listContent.type === 'ordered' ? 'ol' : 'ul';
        
        return (
          <div 
            key={block.id || index} 
            className={`${baseClasses} mb-6`}
            style={blockStyle}
          >
            <ListTag 
              className={`${
                listContent.type === 'ordered' 
                  ? 'list-decimal list-inside' 
                  : 'list-disc list-inside'
              } space-y-2 text-gray-800 leading-relaxed pl-4 marker:text-primary`}
            >
              {listContent.items.map((item, itemIndex) => (
                <li key={itemIndex} className="pl-2">
                  {item}
                </li>
              ))}
            </ListTag>
          </div>
        );

      case 'divider':
        return (
          <hr 
            key={block.id || index}
            className={`${baseClasses} my-8 border-t-2 border-gray-200`}
            style={{ 
              borderColor: block.styles.color || '#e5e7eb',
              margin: block.styles.margin || '2rem 0'
            }}
          />
        );

      default:
        return null;
    }
  };

  if (!content || content.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>ไม่มีเนื้อหาในบทความนี้</p>
      </div>
    );
  }

  // Sort content by order
  const sortedContent = [...content].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className={`article-content ${className}`}>
      <div className="prose prose-lg max-w-none text-gray-800">
        {sortedContent.map((block, index) => renderBlock(block, index))}
      </div>
    </div>
  );
};

export default ArticleRenderer;