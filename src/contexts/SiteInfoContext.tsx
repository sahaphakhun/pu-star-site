'use client';

import { createContext, useContext, ReactNode } from 'react';

interface SiteInfo {
  siteName: string;
  logoUrl: string;
  description?: string;
}

const SiteInfoContext = createContext<SiteInfo | undefined>(undefined);

export function SiteInfoProvider({ siteInfo, children }: { siteInfo: SiteInfo; children: ReactNode }) {
  return <SiteInfoContext.Provider value={siteInfo}>{children}</SiteInfoContext.Provider>;
}

export function useSiteInfo() {
  const context = useContext(SiteInfoContext);
  if (!context) {
    throw new Error('useSiteInfo must be used within a SiteInfoProvider');
  }
  return context;
}

export type { SiteInfo };
