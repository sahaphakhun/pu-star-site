'use client';

import React, { useState, useCallback, useRef } from 'react';
import { IContentBlock, ITextContent, IHeadingContent, IImageContent, IQuoteContent, IListContent } from '@/models/Article';
import { v4 as uuidv4 } from 'uuid';

interface RichTextEditorProps {
  content: IContentBlock[];
  onChange: (content: IContentBlock[]) => void;
  onImageUpload?: (file: File) => Promise<string>;
  className?: string;
}

interface ContentBlockComponentProps {
  block: IContentBlock;
  onUpdate: (updatedBlock: IContentBlock) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

// Component สำหรับแต่ละ content block
const ContentBlockComponent: React.FC<ContentBlockComponentProps> = ({
  block,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showStylePanel, setShowStylePanel] = useState(false);

  const updateContent = useCallback((newContent: any) => {
    onUpdate({
      ...block,
      content: newContent
    });
  }, [block, onUpdate]);

  const updateStyles = useCallback((newStyles: Partial<typeof block.styles>) => {
    onUpdate({
      ...block,
      styles: {
        ...block.styles,
        ...newStyles
      }
    });
  }, [block, onUpdate]);

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

  const baseClasses = `
    ${getAlignmentClass(block.styles.alignment)}
    ${getFontSizeClass(block.styles.fontSize)}
    ${getFontWeightClass(block.styles.fontWeight)}
  `;

  const renderContent = () => {
    switch (block.type) {
      case 'text':
        const textContent = block.content as ITextContent;
        return (
          <div className={`${baseClasses} mb-4`}>
            {isEditing ? (
              <textarea
                value={textContent.text}
                onChange={(e) => updateContent({ ...textContent, text: e.target.value })}
                onBlur={() => setIsEditing(false)}
                className="w-full p-2 border rounded resize-none min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            ) : (
              <div
                onClick={() => setIsEditing(true)}
                className="cursor-text min-h-[50px] p-2 hover:bg-gray-50 rounded"
                style={{ 
                  color: block.styles.color,
                  backgroundColor: block.styles.backgroundColor 
                }}
              >
                {textContent.format === 'html' ? (
                  <div dangerouslySetInnerHTML={{ __html: textContent.text }} />
                ) : (
                  <p>{textContent.text || 'คลิกเพื่อเพิ่มข้อความ...'}</p>
                )}
              </div>
            )}
          </div>
        );

      case 'heading':
        const headingContent = block.content as IHeadingContent;
        const HeadingTag = `h${headingContent.level}` as keyof JSX.IntrinsicElements;
        return (
          <div className={`${baseClasses} mb-4`}>
            {isEditing ? (
              <div className="space-y-2">
                <select
                  value={headingContent.level}
                  onChange={(e) => updateContent({ ...headingContent, level: parseInt(e.target.value) as any })}
                  className="px-2 py-1 border rounded"
                >
                  {[1, 2, 3, 4, 5, 6].map(level => (
                    <option key={level} value={level}>หัวข้อระดับ {level}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={headingContent.text}
                  onChange={(e) => updateContent({ ...headingContent, text: e.target.value })}
                  onBlur={() => setIsEditing(false)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            ) : (
              <HeadingTag
                onClick={() => setIsEditing(true)}
                className={`cursor-text hover:bg-gray-50 p-2 rounded ${
                  headingContent.level <= 2 ? 'text-2xl font-bold' :
                  headingContent.level <= 4 ? 'text-xl font-semibold' : 'text-lg font-medium'
                }`}
                style={{ 
                  color: block.styles.color,
                  backgroundColor: block.styles.backgroundColor 
                }}
              >
                {headingContent.text || 'คลิกเพื่อเพิ่มหัวข้อ...'}
              </HeadingTag>
            )}
          </div>
        );

      case 'image':
        const imageContent = block.content as IImageContent;
        return (
          <div className={`${baseClasses} mb-4`}>
            {isEditing ? (
              <div className="space-y-2 p-4 border rounded">
                <input
                  type="text"
                  placeholder="URL รูปภาพ"
                  value={imageContent.src}
                  onChange={(e) => updateContent({ ...imageContent, src: e.target.value })}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="Alt text"
                  value={imageContent.alt}
                  onChange={(e) => updateContent({ ...imageContent, alt: e.target.value })}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="คำบรรยายใต้รูป (ไม่บังคับ)"
                  value={imageContent.caption || ''}
                  onChange={(e) => updateContent({ ...imageContent, caption: e.target.value })}
                  className="w-full p-2 border rounded"
                />
                <select
                  value={imageContent.width || 'auto'}
                  onChange={(e) => updateContent({ ...imageContent, width: e.target.value as any })}
                  className="px-2 py-1 border rounded"
                >
                  <option value="auto">ขนาดอัตโนมัติ</option>
                  <option value="25%">25% ของความกว้าง</option>
                  <option value="50%">50% ของความกว้าง</option>
                  <option value="75%">75% ของความกว้าง</option>
                  <option value="100%">100% ของความกว้าง</option>
                </select>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  เสร็จสิ้น
                </button>
              </div>
            ) : (
              <div
                onClick={() => setIsEditing(true)}
                className="cursor-pointer hover:bg-gray-50 p-2 rounded"
              >
                {imageContent.src ? (
                  <div>
                    <img
                      src={imageContent.src}
                      alt={imageContent.alt}
                      className="max-w-full h-auto rounded"
                      style={{ 
                        width: imageContent.width === 'auto' ? 'auto' : imageContent.width,
                        objectFit: imageContent.objectFit || 'cover'
                      }}
                    />
                    {imageContent.caption && (
                      <p className="text-sm text-gray-600 mt-2 italic text-center">
                        {imageContent.caption}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <p className="text-gray-500">คลิกเพื่อเพิ่มรูปภาพ</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'quote':
        const quoteContent = block.content as IQuoteContent;
        return (
          <div className={`${baseClasses} mb-4`}>
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  placeholder="ข้อความที่อ้างอิง"
                  value={quoteContent.text}
                  onChange={(e) => updateContent({ ...quoteContent, text: e.target.value })}
                  className="w-full p-2 border rounded resize-none min-h-[100px]"
                />
                <input
                  type="text"
                  placeholder="ผู้พูด (ไม่บังคับ)"
                  value={quoteContent.author || ''}
                  onChange={(e) => updateContent({ ...quoteContent, author: e.target.value })}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="แหล่งที่มา (ไม่บังคับ)"
                  value={quoteContent.source || ''}
                  onChange={(e) => updateContent({ ...quoteContent, source: e.target.value })}
                  className="w-full p-2 border rounded"
                />
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  เสร็จสิ้น
                </button>
              </div>
            ) : (
              <blockquote
                onClick={() => setIsEditing(true)}
                className="cursor-text border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-r"
                style={{ 
                  color: block.styles.color,
                  backgroundColor: block.styles.backgroundColor || '#eff6ff'
                }}
              >
                <p className="italic">"{quoteContent.text || 'คลิกเพื่อเพิ่มข้อความที่อ้างอิง...'}"</p>
                {(quoteContent.author || quoteContent.source) && (
                  <footer className="text-sm text-gray-600 mt-2">
                    {quoteContent.author && <span>— {quoteContent.author}</span>}
                    {quoteContent.source && <span>, {quoteContent.source}</span>}
                  </footer>
                )}
              </blockquote>
            )}
          </div>
        );

      case 'list':
        const listContent = block.content as IListContent;
        return (
          <div className={`${baseClasses} mb-4`}>
            {isEditing ? (
              <div className="space-y-2">
                <select
                  value={listContent.type}
                  onChange={(e) => updateContent({ ...listContent, type: e.target.value as 'ordered' | 'unordered' })}
                  className="px-2 py-1 border rounded"
                >
                  <option value="unordered">รายการแบบจุด</option>
                  <option value="ordered">รายการแบบตัวเลข</option>
                </select>
                <div className="space-y-1">
                  {listContent.items.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => {
                          const newItems = [...listContent.items];
                          newItems[index] = e.target.value;
                          updateContent({ ...listContent, items: newItems });
                        }}
                        className="flex-1 p-2 border rounded"
                      />
                      <button
                        onClick={() => {
                          const newItems = listContent.items.filter((_, i) => i !== index);
                          updateContent({ ...listContent, items: newItems });
                        }}
                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        ลบ
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newItems = [...listContent.items, ''];
                      updateContent({ ...listContent, items: newItems });
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    เพิ่มรายการ
                  </button>
                </div>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  เสร็จสิ้น
                </button>
              </div>
            ) : (
              <div
                onClick={() => setIsEditing(true)}
                className="cursor-pointer hover:bg-gray-50 p-2 rounded"
                style={{ 
                  color: block.styles.color,
                  backgroundColor: block.styles.backgroundColor 
                }}
              >
                {listContent.type === 'ordered' ? (
                  <ol className="list-decimal list-inside space-y-1">
                    {listContent.items.map((item, index) => (
                      <li key={index}>{item || `รายการที่ ${index + 1}`}</li>
                    ))}
                  </ol>
                ) : (
                  <ul className="list-disc list-inside space-y-1">
                    {listContent.items.map((item, index) => (
                      <li key={index}>{item || `รายการที่ ${index + 1}`}</li>
                    ))}
                  </ul>
                )}
                {listContent.items.length === 0 && (
                  <p className="text-gray-500">คลิกเพื่อเพิ่มรายการ</p>
                )}
              </div>
            )}
          </div>
        );

      case 'divider':
        return (
          <div className={`${baseClasses} mb-4`}>
            <hr 
              className="border-t-2 my-4"
              style={{ 
                borderColor: block.styles.color || '#e5e7eb'
              }}
            />
          </div>
        );

      default:
        return <div>ประเภท content ไม่รู้จัก: {block.type}</div>;
    }
  };

  return (
    <div className="group relative border border-transparent hover:border-gray-300 rounded-lg">
      {/* Content */}
      <div className="relative">
        {renderContent()}
        
        {/* Control Panel */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          {/* Style Panel Toggle */}
          <button
            onClick={() => setShowStylePanel(!showStylePanel)}
            className="p-1 bg-white border rounded shadow hover:bg-gray-50"
            title="จัดรูปแบบ"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
            </svg>
          </button>
          
          {/* Move Up */}
          <button
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="p-1 bg-white border rounded shadow hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="เลื่อนขึ้น"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          
          {/* Move Down */}
          <button
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="p-1 bg-white border rounded shadow hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="เลื่อนลง"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Delete */}
          <button
            onClick={onDelete}
            className="p-1 bg-white border rounded shadow hover:bg-red-50 hover:text-red-600"
            title="ลบ"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Style Panel */}
      {showStylePanel && (
        <div className="absolute top-10 right-2 bg-white border rounded-lg shadow-lg p-4 z-10 min-w-[250px]">
          <h4 className="font-semibold mb-3">จัดรูปแบบ</h4>
          
          {/* Alignment */}
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">การจัดตำแหน่ง</label>
            <div className="flex gap-1">
              {[
                { value: 'left', icon: '⬅️', title: 'ชิดซ้าย' },
                { value: 'center', icon: '↔️', title: 'กึ่งกลาง' },
                { value: 'right', icon: '➡️', title: 'ชิดขวา' }
              ].map(align => (
                <button
                  key={align.value}
                  onClick={() => updateStyles({ alignment: align.value as any })}
                  className={`p-2 border rounded ${
                    block.styles.alignment === align.value ? 'bg-blue-100 border-blue-300' : 'hover:bg-gray-50'
                  }`}
                  title={align.title}
                >
                  {align.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">ขนาดตัวอักษร</label>
            <select
              value={block.styles.fontSize || 'normal'}
              onChange={(e) => updateStyles({ fontSize: e.target.value as any })}
              className="w-full px-2 py-1 border rounded"
            >
              <option value="small">เล็ก</option>
              <option value="normal">ปกติ</option>
              <option value="large">ใหญ่</option>
              <option value="xlarge">ใหญ่มาก</option>
            </select>
          </div>

          {/* Font Weight */}
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">น้ำหนักตัวอักษร</label>
            <select
              value={block.styles.fontWeight || 'normal'}
              onChange={(e) => updateStyles({ fontWeight: e.target.value as any })}
              className="w-full px-2 py-1 border rounded"
            >
              <option value="normal">ปกติ</option>
              <option value="bold">หนา</option>
            </select>
          </div>

          {/* Colors */}
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">สีข้อความ</label>
            <input
              type="color"
              value={block.styles.color || '#000000'}
              onChange={(e) => updateStyles({ color: e.target.value })}
              className="w-full h-8 border rounded"
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">สีพื้นหลัง</label>
            <input
              type="color"
              value={block.styles.backgroundColor || '#ffffff'}
              onChange={(e) => updateStyles({ backgroundColor: e.target.value })}
              className="w-full h-8 border rounded"
            />
          </div>

          <button
            onClick={() => setShowStylePanel(false)}
            className="w-full px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            ปิด
          </button>
        </div>
      )}
    </div>
  );
};

// Main RichTextEditor Component
const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  content, 
  onChange, 
  onImageUpload,
  className = '' 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addBlock = useCallback((type: IContentBlock['type']) => {
    const newBlock: IContentBlock = {
      id: uuidv4(),
      type,
      content: getDefaultContent(type),
      styles: {
        alignment: 'left',
        fontSize: 'normal',
        fontWeight: 'normal'
      },
      order: content.length
    };

    onChange([...content, newBlock]);
  }, [content, onChange]);

  const updateBlock = useCallback((index: number, updatedBlock: IContentBlock) => {
    const newContent = [...content];
    newContent[index] = updatedBlock;
    onChange(newContent);
  }, [content, onChange]);

  const deleteBlock = useCallback((index: number) => {
    const newContent = content.filter((_, i) => i !== index);
    // อัพเดต order
    const reorderedContent = newContent.map((block, i) => ({
      ...block,
      order: i
    }));
    onChange(reorderedContent);
  }, [content, onChange]);

  const moveBlock = useCallback((index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === content.length - 1)
    ) {
      return;
    }

    const newContent = [...content];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newContent[index], newContent[targetIndex]] = [newContent[targetIndex], newContent[index]];
    
    // อัพเดต order
    const reorderedContent = newContent.map((block, i) => ({
      ...block,
      order: i
    }));
    
    onChange(reorderedContent);
  }, [content, onChange]);

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onImageUpload) return;

    try {
      const imageUrl = await onImageUpload(file);
      addBlock('image');
      // หลังจากเพิ่ม block แล้ว ให้อัพเดต URL
      setTimeout(() => {
        const lastBlockIndex = content.length;
        const imageBlock: IContentBlock = {
          id: uuidv4(),
          type: 'image',
          content: {
            src: imageUrl,
            alt: file.name,
            width: '100%'
          } as IImageContent,
          styles: {
            alignment: 'center',
            fontSize: 'normal',
            fontWeight: 'normal'
          },
          order: lastBlockIndex
        };
        updateBlock(lastBlockIndex, imageBlock);
      }, 100);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [addBlock, content.length, onImageUpload, updateBlock]);

  return (
    <div className={`rich-text-editor ${className}`}>
      {/* Toolbar */}
      <div className="toolbar bg-gray-50 border border-gray-200 rounded-t-lg p-3 flex flex-wrap gap-2">
        <button
          onClick={() => addBlock('text')}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-50 flex items-center gap-1"
        >
          <span>📝</span> ข้อความ
        </button>
        
        <button
          onClick={() => addBlock('heading')}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-50 flex items-center gap-1"
        >
          <span>📰</span> หัวข้อ
        </button>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-50 flex items-center gap-1"
        >
          <span>🖼️</span> รูปภาพ
        </button>
        
        <button
          onClick={() => addBlock('quote')}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-50 flex items-center gap-1"
        >
          <span>💬</span> คำพูด
        </button>
        
        <button
          onClick={() => addBlock('list')}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-50 flex items-center gap-1"
        >
          <span>📋</span> รายการ
        </button>
        
        <button
          onClick={() => addBlock('divider')}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-50 flex items-center gap-1"
        >
          <span>➖</span> เส้นคั่น
        </button>
      </div>

      {/* Content Area */}
      <div className="content-area border border-t-0 border-gray-200 rounded-b-lg p-4 min-h-[400px] bg-white">
        {content.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-lg mb-2">เริ่มสร้างเนื้อหาของคุณ</p>
            <p className="text-sm">เลือกประเภทเนื้อหาจากแถบเครื่องมือด้านบน</p>
          </div>
        ) : (
          <div className="space-y-4">
            {content.map((block, index) => (
              <ContentBlockComponent
                key={block.id}
                block={block}
                onUpdate={(updatedBlock) => updateBlock(index, updatedBlock)}
                onDelete={() => deleteBlock(index)}
                onMoveUp={() => moveBlock(index, 'up')}
                onMoveDown={() => moveBlock(index, 'down')}
                canMoveUp={index > 0}
                canMoveDown={index < content.length - 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  );
};

// Helper function to get default content for each block type
function getDefaultContent(type: IContentBlock['type']): any {
  switch (type) {
    case 'text':
      return { text: '', format: 'paragraph' } as ITextContent;
    case 'heading':
      return { text: '', level: 2 } as IHeadingContent;
    case 'image':
      return { src: '', alt: '', width: '100%' } as IImageContent;
    case 'quote':
      return { text: '' } as IQuoteContent;
    case 'list':
      return { type: 'unordered', items: [''] } as IListContent;
    case 'divider':
      return {};
    default:
      return {};
  }
}

export default RichTextEditor;