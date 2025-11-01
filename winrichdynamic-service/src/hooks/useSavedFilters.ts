'use client';

import { useState, useEffect } from 'react';

interface SavedFilter {
  id: string;
  name: string;
  filters: Record<string, any>;
  createdAt: string;
}

export function useSavedFilters(key: string) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`saved_filters_${key}`);
      if (stored) {
        setSavedFilters(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading saved filters:', error);
    } finally {
      setLoading(false);
    }
  }, [key]);

  const saveFilter = (name: string, filters: Record<string, any>) => {
    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name,
      filters,
      createdAt: new Date().toISOString(),
    };

    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    
    try {
      localStorage.setItem(`saved_filters_${key}`, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving filter:', error);
    }
  };

  const deleteFilter = (id: string) => {
    const updated = savedFilters.filter(f => f.id !== id);
    setSavedFilters(updated);
    
    try {
      localStorage.setItem(`saved_filters_${key}`, JSON.stringify(updated));
    } catch (error) {
      console.error('Error deleting filter:', error);
    }
  };

  const applyFilter = (id: string) => {
    const filter = savedFilters.find(f => f.id === id);
    return filter ? filter.filters : null;
  };

  return {
    savedFilters,
    loading,
    saveFilter,
    deleteFilter,
    applyFilter,
  };
}
