'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';

interface PerformanceOptimizerProps {
  children: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  className?: string;
}

// Component สำหรับ Lazy Loading
export const LazyLoad: React.FC<PerformanceOptimizerProps> = ({
  children,
  threshold = 0.1,
  rootMargin = '50px',
  triggerOnce = true,
  className = ''
}) => {
  const [ref, inView] = useInView({
    threshold,
    rootMargin,
    triggerOnce
  });

  return (
    <div ref={ref} className={className}>
      {inView ? children : (
        <div className="animate-pulse bg-gray-200 rounded min-h-[200px] flex items-center justify-center">
          <div className="text-gray-400">กำลังโหลด...</div>
        </div>
      )}
    </div>
  );
};

// Component สำหรับ Image Lazy Loading
interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
  priority?: boolean;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  placeholder = '/images/placeholder.jpg',
  priority = false
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (priority) {
      setIsLoaded(true);
    }
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setError(true);
  };

  if (error) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-500 text-sm">ไม่สามารถโหลดรูปภาพได้</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoaded && (
        <img
          src={placeholder}
          alt="placeholder"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
      />
    </div>
  );
};

// Component สำหรับ Preload Critical Resources
export const PreloadResources: React.FC = () => {
  useEffect(() => {
    // Preload critical CSS
    const preloadCSS = document.createElement('link');
    preloadCSS.rel = 'preload';
    preloadCSS.href = '/globals.css';
    preloadCSS.as = 'style';
    document.head.appendChild(preloadCSS);

    // Preload critical fonts
    const preloadFont = document.createElement('link');
    preloadFont.rel = 'preload';
    preloadFont.href = '/fonts/inter-var.woff2';
    preloadFont.as = 'font';
    preloadFont.type = 'font/woff2';
    preloadFont.crossOrigin = 'anonymous';
    document.head.appendChild(preloadFont);

    // Preload critical images
    const preloadImage = document.createElement('link');
    preloadImage.rel = 'preload';
    preloadImage.href = '/favicon.ico';
    preloadImage.as = 'image';
    document.head.appendChild(preloadImage);

    return () => {
      document.head.removeChild(preloadCSS);
      document.head.removeChild(preloadFont);
      document.head.removeChild(preloadImage);
    };
  }, []);

  return null;
};

// Component สำหรับ Intersection Observer
export const IntersectionObserver: React.FC<{
  children: React.ReactNode;
  onIntersect?: () => void;
  threshold?: number;
  rootMargin?: string;
}> = ({ children, onIntersect, threshold = 0.1, rootMargin = '0px' }) => {
  const [ref, inView] = useInView({
    threshold,
    rootMargin,
    triggerOnce: false
  });

  useEffect(() => {
    if (inView && onIntersect) {
      onIntersect();
    }
  }, [inView, onIntersect]);

  return <div ref={ref}>{children}</div>;
};

// Component สำหรับ Virtual Scrolling (สำหรับรายการยาว)
export const VirtualList: React.FC<{
  items: any[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: any, index: number) => React.ReactNode;
}> = ({ items, itemHeight, containerHeight, renderItem }) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleItems = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleItems + 1, items.length);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return (
    <div
      ref={containerRef}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {items.slice(startIndex, endIndex).map((item, index) =>
            renderItem(item, startIndex + index)
          )}
        </div>
      </div>
    </div>
  );
};

// Component สำหรับ Debounced Search
export const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Component สำหรับ Throttled Scroll
export const useThrottledScroll = (callback: () => void, delay: number) => {
  const lastCall = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const now = Date.now();
      if (now - lastCall.current >= delay) {
        lastCall.current = now;
        callback();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [callback, delay]);
};

export default {
  LazyLoad,
  LazyImage,
  PreloadResources,
  IntersectionObserver,
  VirtualList,
  useDebounce,
  useThrottledScroll
};
