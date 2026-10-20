import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { MorningBriefingView } from './components/MorningBriefingView';
import { FileTidyView } from './components/FileTidyView';
import { TodoAssistantView } from './components/TodoAssistantView';
import { FridgeToListView } from './components/FridgeToListView';
import { RelaxModeView } from './components/RelaxModeView';
import { PrivacyDataView } from './components/PrivacyDataView';
import { DemoTourModal } from './components/DemoTourModal';
import { SettingsModal } from './components/SettingsModal';
import { checkOllamaStatus, getAISettings, OllamaStatus, AISettings } from './services/ai';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);
  const [settings, setSettings] = useState<AISettings>(getAISettings());
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const refreshStatus = () => {
    checkOllamaStatus().then(setOllamaStatus);
  };

  useEffect(() => {
    refreshStatus();
    // Periodic gentle background healthcheck every 30s
    const timer = setInterval(refreshStatus, 30000);
    return () => clearInterval(timer);
  }, [settings]);

  const triggerDataRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Bar Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        status={ollamaStatus}
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onStartTour={() => setIsTourOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentTab === 'dashboard' && (
          <DashboardView
            key={`dash-${refreshKey}`}
            onNavigateTab={setCurrentTab}
            ollamaStatus={ollamaStatus}
            settings={settings}
          />
        )}

        {currentTab === 'briefing' && (
          <MorningBriefingView
            key={`brief-${refreshKey}`}
            onTaskAdded={triggerDataRefresh}
            onBriefingComplete={triggerDataRefresh}
          />
        )}

        {currentTab === 'file-tidy' && (
          <FileTidyView
            key={`tidy-${refreshKey}`}
            onTidyComplete={triggerDataRefresh}
          />
        )}

        {currentTab === 'tasks' && (
          <TodoAssistantView
            key={`tasks-${refreshKey}`}
            onTaskChange={triggerDataRefresh}
          />
        )}

        {currentTab === 'fridge' && (
          <FridgeToListView
            key={`fridge-${refreshKey}`}
            onScoreUpdated={triggerDataRefresh}
          />
        )}

        {currentTab === 'relax' && (
          <RelaxModeView />
        )}

        {currentTab === 'privacy' && (
          <PrivacyDataView />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200/80 bg-white/70 py-6 text-xs text-stone-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-800">SlothMate AI</span>
            <span>·</span>
            <span>Slow and Steady — Open-Source AI Challenge</span>
          </div>

          <div className="flex items-center gap-4 text-stone-500">
            <span>Offline-First Privacy</span>
            <span>·</span>
            <span>Zero Remote Telemetry</span>
            <span>·</span>
            <span>Local SQLite & Open Weights</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <DemoTourModal
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onNavigateTab={(tab) => {
          setCurrentTab(tab);
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        status={ollamaStatus}
        onSettingsChange={(newSettings) => {
          setSettings(newSettings);
          refreshStatus();
        }}
      />
    </div>
  );
}
