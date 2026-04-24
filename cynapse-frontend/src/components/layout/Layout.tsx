import React, { useState, useEffect } from 'react';
import { Shield, Eye, MessageSquare, Wallet, Activity, Menu, X, Zap, Sun, Moon } from 'lucide-react';

interface LayoutProps {
  activePage: string;
  setActivePage: (page: string) => void;
  children: React.ReactNode;
}

const navItems = [
  { id: 'dashboard', icon: Activity, label: 'Dashboard', sublabel: 'Live Overview' },
  { id: 'clone-detector', icon: Eye, label: 'Clone Detector', sublabel: 'Feature A' },
  { id: 'bot-detector', icon: MessageSquare, label: 'Bot Detector', sublabel: 'Feature B' },
  { id: 'pre-transfer', icon: Wallet, label: 'Pre-Transfer Shield', sublabel: 'Feature C' },
];

export default function Layout({ activePage, setActivePage, children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-surface)' }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col transition-all duration-300 border-r"
        style={{
          width: sidebarOpen ? '240px' : '64px',
          borderColor: 'var(--color-border)',
          background: 'var(--color-panel)',
          minWidth: sidebarOpen ? '240px' : '64px',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div
            className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0"
            style={{ background: 'var(--color-brand)' }}
          >
            <Shield size={18} className="text-white" />
          </div>
          {sidebarOpen && (
            <div>
              <div className="font-display font-bold text-sm tracking-widest" style={{ color: 'var(--color-text-primary)' }}>
                CYNAPSE
              </div>
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>AI Security</div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto text-muted hover:text-primary transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map(({ id, icon: Icon, label, sublabel }) => {
            const isActive = activePage === id;
            return (
              <button
                key={id}
                onClick={() => setActivePage(id)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 text-left"
                style={{
                  background: isActive ? 'rgba(26,86,219,0.15)' : 'transparent',
                  borderLeft: isActive ? '2px solid var(--color-brand)' : '2px solid transparent',
                  color: isActive ? 'var(--color-brand)' : 'var(--color-text-muted)',
                }}
              >
                <Icon size={18} className="flex-shrink-0" />
                {sidebarOpen && (
                  <div>
                    <div className="text-sm font-medium" style={{ color: isActive ? 'var(--color-brand)' : 'var(--color-text-primary)' }}>
                      {label}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{sublabel}</div>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Removed Sprint badge */}
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'var(--color-border)', background: 'var(--color-panel)' }}>
          <div>
            <h1 className="font-display text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {navItems.find(n => n.id === activePage)?.label || 'CYNAPSE AI'}
            </h1>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Cyber Neural Adaptive Protection System Engine
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{ color: 'var(--color-text-muted)' }}
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono" style={{ background: 'rgba(46,204,113,0.1)', color: 'var(--color-safe)', border: '1px solid rgba(46,204,113,0.3)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
              SYSTEM ONLINE
            </div>
            <div className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
              T1 · Frontend Lead
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
