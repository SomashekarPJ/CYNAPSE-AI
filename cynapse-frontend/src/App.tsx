import React, { useState } from 'react';
import './styles/globals.css';
import Layout from './components/layout/Layout';
import LiveThreatTicker from './components/ui/LiveThreatTicker';
import Dashboard from './pages/Dashboard';
import CloneDetector from './components/features/CloneDetector';
import BotDetector from './components/features/BotDetector';
import PreTransferShield from './components/features/PreTransferShield';

type Page = 'dashboard' | 'clone-detector' | 'bot-detector' | 'pre-transfer';

function PageContent({ page }: { page: Page }) {
  switch (page) {
    case 'dashboard': return <Dashboard />;
    case 'clone-detector': return <CloneDetector />;
    case 'bot-detector': return <BotDetector />;
    case 'pre-transfer': return <PreTransferShield />;
    default: return <Dashboard />;
  }
}

export default function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard');

  return (
    <Layout activePage={activePage} setActivePage={(p) => setActivePage(p as Page)}>
      <LiveThreatTicker />
      <PageContent page={activePage} />
    </Layout>
  );
}
