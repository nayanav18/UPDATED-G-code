import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import { AuthViews } from './components/Auth/AuthViews';
import { WorkspaceSetup } from './components/WorkspaceSetup/WorkspaceSetup';
import { Header } from './components/Navigation/Header';
import { Sidebar } from './components/Navigation/Sidebar';
import { ChatView } from './components/Chat/ChatView';
import { AnalysisView } from './components/Analysis/AnalysisView';
import { DashboardsView } from './components/Dashboard/DashboardsView';
import { PipelineView } from './components/Pipeline/PipelineView';
import { BuilderView } from './components/Builder/BuilderView';
import { DatasetSchemaView } from './components/DatasetSchema/DatasetSchemaView';

const MainAppContent: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isConfigured, currentView } = useWorkspace();

  if (authLoading) {
    return (
      <div className="h-screen w-screen bg-[#050a12] flex items-center justify-center text-white text-sm font-medium">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl gradient-brand flex items-center justify-center animate-pulse">
            <span className="text-white font-bold text-lg font-display">A</span>
          </div>
          <span className="text-xs text-[#8ba8d1]">Loading enterprise workspace...</span>
        </div>
      </div>
    );
  }

  // 1. Authentication flow: Login, Registration, Verification
  if (!isAuthenticated) {
    return <AuthViews />;
  }

  // 2. Setup flow: Select Business, Persona, and Dataset
  if (!isConfigured) {
    return <WorkspaceSetup />;
  }

  // 3. Main Analytics Shell
  return (
    <div className="h-screen w-screen bg-[#050a12] text-slate-100 flex flex-col overflow-hidden font-sans">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {currentView === 'chat' && <ChatView />}
          {currentView === 'analysis' && <AnalysisView />}
          {currentView === 'dashboards' && <DashboardsView />}
          {currentView === 'pipeline' && <PipelineView />}
          {currentView === 'builder' && <BuilderView />}
          {currentView === 'dataset_schema' && <DatasetSchemaView />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <MainAppContent />
      </WorkspaceProvider>
    </AuthProvider>
  );
}
