'use client';

import { useState } from 'react';

interface SavedFilter {
  id: string;
  name: string;
  filters: Record<string, any>;
  createdAt: string;
}

export function useSavedFilters(key: string) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [loading] = useState(false);
  void key;

  const saveFilter = (name: string, filters: Record<string, any>) => {
    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name,
      filters,
      createdAt: new Date().toISOString(),
    };

    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    
  };

  const deleteFilter = (id: string) => {
    const updated = savedFilters.filter(f => f.id !== id);
    setSavedFilters(updated);
    
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
