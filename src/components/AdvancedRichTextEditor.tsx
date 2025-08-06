'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { IContentBlock, ITextContent, IHeadingContent, IImageContent, IQuoteContent, IListContent } from '@/models/Article';
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';

interface AdvancedRichTextEditorProps {
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
  onImageUpload?: (file: File) => Promise<string>;
}

// Toolbar Component
const Toolbar: React.FC<{
  onAddBlock: (type: IContentBlock['type']) => void;
  selectedBlock: IContentBlock | null;
  onUpdateStyles: (styles: Partial<IContentBlock['styles']>) => void;
}> = ({ onAddBlock, selectedBlock, onUpdateStyles }) => {
  const blockTypes = [
    { type: 'text' as const, icon: '📝', label: 'ข้อความ' },
    { type: 'heading' as const, icon: '📄', label: 'หัวข้อ' },
    { type: 'image' as const, icon: '🖼️', label: 'รูปภาพ' },
    { type: 'quote' as const, icon: '💬', label: 'คำพูด' },
    { type: 'list' as const, icon: '📋', label: 'รายการ' },
    { type: 'divider' as const, icon: '➖', label: 'เส้นแบ่g' },
  ];

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {/* Add Block Buttons */}
        <div className="flex gap-1 mr-4">
          <span className="text-sm font-medium text-gray-700 self-center mr-2">เพิ่มเนื้อหา:</span>
          {blockTypes.map(({ type, icon, label }) => (
            <button
              key={type}
              onClick={() => onAddBlock(type)}
              className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              title={label}
            >
              <span>{icon}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Style Controls */}
        {selectedBlock && (
          <div className="flex gap-2 pl-4 border-l border-gray-300">
            <span className="text-sm font-medium text-gray-700 self-center mr-2">จัดรูปแบบ:</span>
            
            {/* Alignment */}
            <div className="flex gap-1">
              {[
                { value: 'left', icon: '⬅️', label: 'ซ้าย' },
                { value: 'center', icon: '↔️', label: 'กลาง' },
                { value: 'right', icon: '➡️', label: 'ขวา' },
              ].map(({ value, icon, label }) => (
                <button
                  key={value}
                  onClick={() => onUpdateStyles({ alignment: value as any })}
                  className={`p-2 rounded ${
                    selectedBlock.styles.alignment === value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title={label}
                >
                  {icon}
                </button>
              ))}
            </div>

            {/* Font Size */}
            <select
              value={selectedBlock.styles.fontSize || 'normal'}
              onChange={(e) => onUpdateStyles({ fontSize: e.target.value as any })}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="small">เล็ก</option>
              <option value="normal">ปกติ</option>
              <option value="large">ใหญ่</option>
              <option value="xlarge">ใหญ่มาก</option>
            </select>

            {/* Font Weight */}
            <button
              onClick={() => onUpdateStyles({ 
                fontWeight: selectedBlock.styles.fontWeight === 'bold' ? 'normal' : 'bold' 
              })}
              className={`px-3 py-1 rounded text-sm font-bold ${
                selectedBlock.styles.fontWeight === 'bold'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              B
            </button>

            {/* Text Color */}
            <input
              type="color"
              value={selectedBlock.styles.color || '#000000'}
              onChange={(e) => onUpdateStyles({ color: e.target.value })}
              className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
              title="สีข้อความ"
            />

            {/* Background Color */}
            <input
              type="color"
              value={selectedBlock.styles.backgroundColor || '#ffffff'}
              onChange={(e) => onUpdateStyles({ backgroundColor: e.target.value })}
              className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
              title="สีพื้นหลัง"
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Content Block Component
const ContentBlockComponent: React.FC<ContentBlockComponentProps> = ({
  block,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  onImageUpload
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateContent = useCallback((newContent: any) => {
    onUpdate({
      ...block,
      content: newContent
    });
  }, [block, onUpdate]);

  const getAlignmentClass = (alignment?: string) => {
    switch (alignment) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: 'text-left';
    }
  };

  const getFontSizeClass = (fontSize?: string) => {
    switch (fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      case 'xlarge': return 'text-2xl';
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
  `.trim();

  const handleImageUpload = async (file: File) => {
    if (onImageUpload) {
      try {
        const imageUrl = await onImageUpload(file);
        const imageContent = block.content as IImageContent;
        updateContent({
          ...imageContent,
          src: imageUrl
        });
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
      }
    }
  };

  const renderContent = () => {
    const commonStyle = {
      color: block.styles.color,
      backgroundColor: block.styles.backgroundColor,
      padding: block.styles.padding,
      margin: block.styles.margin,
    };

    switch (block.type) {
      case 'text':
        const textContent = block.content as ITextContent;
        return (
          <div className={`${baseClasses} mb-4`} style={commonStyle}>
            {isEditing ? (
              <div className="space-y-2">
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => updateContent({ ...textContent, format: 'paragraph' })}
                    className={`px-3 py-1 rounded text-sm ${
                      textContent.format === 'paragraph' ? 'bg-blue-600 text-white' : 'bg-gray-200'
                    }`}
                  >
                    ข้อความธรรมดา
                  </button>
                  <button
                    onClick={() => updateContent({ ...textContent, format: 'html' })}
                    className={`px-3 py-1 rounded text-sm ${
                      textContent.format === 'html' ? 'bg-blue-600 text-white' : 'bg-gray-200'
                    }`}
                  >
                    HTML
                  </button>
                </div>
                <textarea
                  value={textContent.text}
                  onChange={(e) => updateContent({ ...textContent, text: e.target.value })}
                  onBlur={() => setIsEditing(false)}
                  className="w-full p-3 border rounded-lg resize-none min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                  placeholder="พิมพ์ข้อความที่นี่..."
                />
              </div>
            ) : (
              <div
                onClick={() => setIsEditing(true)}
                className="cursor-text min-h-[60px] p-3 hover:bg-gray-50 rounded-lg border-2 border-transparent hover:border-gray-200"
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
          <div className={`${baseClasses} mb-4`} style={commonStyle}>
            {isEditing ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <select
                    value={headingContent.level}
                    onChange={(e) => updateContent({ ...headingContent, level: parseInt(e.target.value) as any })}
                    className="px-3 py-2 border rounded-lg"
                  >
                    {[1, 2, 3, 4, 5, 6].map(level => (
                      <option key={level} value={level}>หัวข้อระดับ {level}</option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  value={headingContent.text}
                  onChange={(e) => updateContent({ ...headingContent, text: e.target.value })}
                  onBlur={() => setIsEditing(false)}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                  placeholder="พิมพ์หัวข้อที่นี่..."
                />
              </div>
            ) : (
              <HeadingTag
                onClick={() => setIsEditing(true)}
                className={`cursor-text hover:bg-gray-50 p-3 rounded-lg border-2 border-transparent hover:border-gray-200 ${
                  headingContent.level <= 2 ? 'text-3xl font-bold' :
                  headingContent.level <= 4 ? 'text-2xl font-semibold' : 'text-xl font-medium'
                }`}
              >
                {headingContent.text || 'คลิกเพื่อเพิ่มหัวข้อ...'}
              </HeadingTag>
            )}
          </div>
        );

      case 'image':
        const imageContent = block.content as IImageContent;
        return (
          <div className={`${baseClasses} mb-4`} style={commonStyle}>
            {isEditing || !imageContent.src ? (
              <div className="space-y-4 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    เลือกรูปภาพ
                  </button>
                  <p className="text-gray-500 mt-2">หรือลากไฟล์มาวางที่นี่</p>
                </div>
                
                {imageContent.src && (
                  <div className="space-y-3">
                    <div className="relative">
                      <Image
                        src={imageContent.src}
                        alt={imageContent.alt}
                        width={400}
                        height={300}
                        className="w-full max-w-md mx-auto rounded-lg"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ข้อความอธิบายรูป (Alt Text)
                        </label>
                        <input
                          type="text"
                          value={imageContent.alt}
                          onChange={(e) => updateContent({ ...imageContent, alt: e.target.value })}
                          className="w-full p-2 border rounded-lg"
                          placeholder="อธิบายรูปภาพ..."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          คำอธิบายใต้รูป
                        </label>
                        <input
                          type="text"
                          value={imageContent.caption || ''}
                          onChange={(e) => updateContent({ ...imageContent, caption: e.target.value })}
                          className="w-full p-2 border rounded-lg"
                          placeholder="คำอธิบายใต้รูป..."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ขนาดความกว้าง
                        </label>
                        <select
                          value={imageContent.width || '100%'}
                          onChange={(e) => updateContent({ ...imageContent, width: e.target.value as any })}
                          className="w-full p-2 border rounded-lg"
                        >
                          <option value="25%">25% ของความกว้าง</option>
                          <option value="50%">50% ของความกว้าง</option>
                          <option value="75%">75% ของความกว้าง</option>
                          <option value="100%">100% ของความกว้าง</option>
                          <option value="auto">ขนาดอัตโนมัติ</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          การแสดงผล
                        </label>
                        <select
                          value={imageContent.objectFit || 'cover'}
                          onChange={(e) => updateContent({ ...imageContent, objectFit: e.target.value as any })}
                          className="w-full p-2 border rounded-lg"
                        >
                          <option value="cover">ครอบคลุม</option>
                          <option value="contain">พอดี</option>
                          <option value="fill">เต็มพื้นที่</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        เสร็จสิ้น
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        เปลี่ยนรูปภาพ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                onClick={() => setIsEditing(true)}
                className="cursor-pointer group"
              >
                <div 
                  className="relative overflow-hidden rounded-lg"
                  style={{ width: imageContent.width === 'auto' ? 'auto' : imageContent.width }}
                >
                  <Image
                    src={imageContent.src}
                    alt={imageContent.alt}
                    width={800}
                    height={600}
                    className={`w-full h-auto group-hover:opacity-90 transition-opacity ${
                      imageContent.objectFit === 'contain' ? 'object-contain' :
                      imageContent.objectFit === 'fill' ? 'object-fill' : 'object-cover'
                    }`}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-gray-700 px-3 py-1 rounded-lg text-sm">
                      คลิกเพื่อแก้ไข
                    </div>
                  </div>
                </div>
                {imageContent.caption && (
                  <p className="text-center text-gray-600 text-sm mt-2 italic">
                    {imageContent.caption}
                  </p>
                )}
              </div>
            )}
          </div>
        );

      case 'quote':
        const quoteContent = block.content as IQuoteContent;
        return (
          <div className={`${baseClasses} mb-4`} style={commonStyle}>
            {isEditing ? (
              <div className="space-y-3 p-4 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg">
                <textarea
                  value={quoteContent.text}
                  onChange={(e) => updateContent({ ...quoteContent, text: e.target.value })}
                  className="w-full p-3 border rounded-lg resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="พิมพ์คำพูดที่นี่..."
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={quoteContent.author || ''}
                    onChange={(e) => updateContent({ ...quoteContent, author: e.target.value })}
                    className="p-2 border rounded-lg"
                    placeholder="ผู้พูด (ไม่บังคับ)"
                  />
                  <input
                    type="text"
                    value={quoteContent.source || ''}
                    onChange={(e) => updateContent({ ...quoteContent, source: e.target.value })}
                    className="p-2 border rounded-lg"
                    placeholder="แหล่งที่มา (ไม่บังคับ)"
                  />
                </div>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  เสร็จสิ้น
                </button>
              </div>
            ) : (
              <blockquote
                onClick={() => setIsEditing(true)}
                className="cursor-text border-l-4 border-blue-500 bg-blue-50 p-6 rounded-r-lg hover:bg-blue-100 transition-colors"
              >
                <p className="text-lg italic mb-2">
                  "{quoteContent.text || 'คลิกเพื่อเพิ่มคำพูด...'}"
                </p>
                {(quoteContent.author || quoteContent.source) && (
                  <footer className="text-sm text-gray-600">
                    {quoteContent.author && <span>— {quoteContent.author}</span>}
                    {quoteContent.source && <span className="ml-2">({quoteContent.source})</span>}
                  </footer>
                )}
              </blockquote>
            )}
          </div>
        );

      case 'list':
        const listContent = block.content as IListContent;
        return (
          <div className={`${baseClasses} mb-4`} style={commonStyle}>
            {isEditing ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => updateContent({ ...listContent, type: 'unordered' })}
                    className={`px-3 py-1 rounded text-sm ${
                      listContent.type === 'unordered' ? 'bg-blue-600 text-white' : 'bg-gray-200'
                    }`}
                  >
                    • รายการ
                  </button>
                  <button
                    onClick={() => updateContent({ ...listContent, type: 'ordered' })}
                    className={`px-3 py-1 rounded text-sm ${
                      listContent.type === 'ordered' ? 'bg-blue-600 text-white' : 'bg-gray-200'
                    }`}
                  >
                    1. รายการเรียงลำดับ
                  </button>
                </div>
                <div className="space-y-2">
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
                        className="flex-1 p-2 border rounded-lg"
                        placeholder={`รายการที่ ${index + 1}`}
                      />
                      <button
                        onClick={() => {
                          const newItems = listContent.items.filter((_, i) => i !== index);
                          updateContent({ ...listContent, items: newItems });
                        }}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
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
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    + เพิ่มรายการ
                  </button>
                </div>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  เสร็จสิ้น
                </button>
              </div>
            ) : (
              <div
                onClick={() => setIsEditing(true)}
                className="cursor-text hover:bg-gray-50 p-3 rounded-lg border-2 border-transparent hover:border-gray-200"
              >
                {listContent.type === 'ordered' ? (
                  <ol className="list-decimal list-inside space-y-1">
                    {listContent.items.length > 0 ? (
                      listContent.items.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))
                    ) : (
                      <li className="text-gray-500">คลิกเพื่อเพิ่มรายการ...</li>
                    )}
                  </ol>
                ) : (
                  <ul className="list-disc list-inside space-y-1">
                    {listContent.items.length > 0 ? (
                      listContent.items.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))
                    ) : (
                      <li className="text-gray-500">คลิกเพื่อเพิ่มรายการ...</li>
                    )}
                  </ul>
                )}
              </div>
            )}
          </div>
        );

      case 'divider':
        return (
          <div className={`${baseClasses} mb-4`} style={commonStyle}>
            <hr className="border-t-2 border-gray-300 my-6" />
          </div>
        );

      default:
        return <div>Unsupported block type: {block.type}</div>;
    }
  };

  return (
    <div
      className={`relative group ${isSelected ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}
      onClick={() => setIsSelected(true)}
    >
      {/* Block Controls */}
      <div className="absolute -left-12 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
        <button
          onClick={onMoveUp}
          disabled={!canMoveUp}
          className="p-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          title="ย้ายขึ้น"
        >
          ↑
        </button>
        <button
          onClick={onMoveDown}
          disabled={!canMoveDown}
          className="p-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          title="ย้ายลง"
        >
          ↓
        </button>
        <button
          onClick={onDelete}
          className="p-1 bg-red-200 text-red-600 rounded hover:bg-red-300"
          title="ลบ"
        >
          ✕
        </button>
      </div>

      {renderContent()}
    </div>
  );
};

// Main Editor Component
const AdvancedRichTextEditor: React.FC<AdvancedRichTextEditorProps> = ({
  content,
  onChange,
  onImageUpload,
  className = ''
}) => {
  const [selectedBlock, setSelectedBlock] = useState<IContentBlock | null>(null);

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

  const updateBlock = useCallback((updatedBlock: IContentBlock) => {
    const updatedContent = content.map(block =>
      block.id === updatedBlock.id ? updatedBlock : block
    );
    onChange(updatedContent);
    setSelectedBlock(updatedBlock);
  }, [content, onChange]);

  const deleteBlock = useCallback((blockId: string) => {
    const filteredContent = content.filter(block => block.id !== blockId);
    onChange(filteredContent);
    setSelectedBlock(null);
  }, [content, onChange]);

  const moveBlock = useCallback((blockId: string, direction: 'up' | 'down') => {
    const blockIndex = content.findIndex(block => block.id === blockId);
    if (blockIndex === -1) return;

    const newIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1;
    if (newIndex < 0 || newIndex >= content.length) return;

    const newContent = [...content];
    [newContent[blockIndex], newContent[newIndex]] = [newContent[newIndex], newContent[blockIndex]];

    // Update order
    newContent.forEach((block, index) => {
      block.order = index;
    });

    onChange(newContent);
  }, [content, onChange]);

  const updateSelectedBlockStyles = useCallback((styles: Partial<IContentBlock['styles']>) => {
    if (selectedBlock) {
      const updatedBlock = {
        ...selectedBlock,
        styles: {
          ...selectedBlock.styles,
          ...styles
        }
      };
      updateBlock(updatedBlock);
    }
  }, [selectedBlock, updateBlock]);

  function getDefaultContent(type: IContentBlock['type']) {
    switch (type) {
      case 'text':
        return { text: '', format: 'paragraph' } as ITextContent;
      case 'heading':
        return { text: '', level: 2 } as IHeadingContent;
      case 'image':
        return { src: '', alt: '', width: '100%', objectFit: 'cover' } as IImageContent;
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

  // Click outside to deselect
  useEffect(() => {
    const handleClickOutside = () => {
      setSelectedBlock(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className={`advanced-rich-text-editor ${className}`}>
      <Toolbar
        onAddBlock={addBlock}
        selectedBlock={selectedBlock}
        onUpdateStyles={updateSelectedBlockStyles}
      />

      <div className="p-6 pl-16 min-h-[400px] bg-white">
        {content.length > 0 ? (
          content
            .sort((a, b) => a.order - b.order)
            .map((block, index) => (
              <ContentBlockComponent
                key={block.id}
                block={block}
                onUpdate={updateBlock}
                onDelete={() => deleteBlock(block.id)}
                onMoveUp={() => moveBlock(block.id, 'up')}
                onMoveDown={() => moveBlock(block.id, 'down')}
                canMoveUp={index > 0}
                canMoveDown={index < content.length - 1}
                onImageUpload={onImageUpload}
              />
            ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-4">เริ่มต้นสร้างเนื้อหาของคุณ</p>
            <p className="text-sm">คลิกปุ่มด้านบนเพื่อเพิ่มเนื้อหา</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedRichTextEditor;