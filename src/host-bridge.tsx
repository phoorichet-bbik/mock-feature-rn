import React, { createContext, useContext } from 'react';

// ─────────────────────────────────────────────
// Types — the contract between host and remote
// ─────────────────────────────────────────────

export interface HostTheme {
  primaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  textSecondaryColor: string;
  isDark: boolean;
}

export interface HostConfig {
  appName: string;
  apiBaseUrl: string;
  userDisplayName?: string;
  userEmail?: string;
}

export interface HostNavigation {
  /** Push to any screen within this feature by slug, with optional params */
  push: (slug: string, params?: Record<string, string>) => void;
  /** Go back one step (works within the feature stack) */
  goBack: () => void;
  /** Pop entirely back to the main app (exit the feature) */
  backToMainApp: () => void;
}

export interface HostBridge {
  theme: HostTheme;
  config: HostConfig;
  navigation: HostNavigation;
}

// ─────────────────────────────────────────────
// Context — host fills it, remote reads it
// ─────────────────────────────────────────────

const HostBridgeContext = createContext<HostBridge | null>(null);

export function HostBridgeProvider({
  children,
  bridge,
}: {
  children: React.ReactNode;
  bridge: HostBridge;
}) {
  return (
    <HostBridgeContext.Provider value={bridge}>
      {children}
    </HostBridgeContext.Provider>
  );
}

export function useHostBridge(): HostBridge {
  const ctx = useContext(HostBridgeContext);
  if (!ctx) {
    throw new Error('useHostBridge must be called inside HostBridgeProvider');
  }
  return ctx;
}
