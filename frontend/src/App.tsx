import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { OverviewDashboard } from './pages/OverviewDashboard';
import { ModelManagement } from './pages/ModelManagement';
import { ModelPlayground } from './pages/ModelPlayground';
import { RequestLogs } from './pages/RequestLogs';
import { AlertsPage } from './pages/AlertsPage';
import { ModelEvaluation } from './pages/ModelEvaluation';
import { SettingsPage } from './pages/SettingsPage';
import {
  ModelConfig,
  MetricsOverview,
  AlertItem,
  RequestLogItem
} from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('overview');
  const [systemReady, setSystemReady] = useState<boolean | null>(null);
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [overview, setOverview] = useState<MetricsOverview | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [recentLogs, setRecentLogs] = useState<RequestLogItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);

  // Playground prefill state
  const [playgroundTarget, setPlaygroundTarget] = useState<{
    model_id: string;
    provider: 'local' | 'hosted' | 'mock';
  } | null>(null);

  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // System check
      try {
        const readyRes = await api.getReady();
        setSystemReady(readyRes.status === 'ready');
      } catch {
        setSystemReady(false);
      }

      // Fetch core datasets in parallel
      const [modelsData, overviewData, alertsData, logsData] = await Promise.all([
        api.getModels().catch(() => []),
        api.getMetricsOverview().catch(() => null),
        api.getAlerts().catch(() => []),
        api.getLogs({ page: 1, page_size: 5 }).catch(() => ({ items: [] }))
      ]);

      setModels(modelsData);
      setOverview(overviewData);
      setAlerts(alertsData);
      setRecentLogs(logsData.items || []);
    } catch (err) {
      console.error('Data loading error:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Auto-refresh metrics every 20 seconds
    const interval = setInterval(loadData, 20000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleSelectForPlayground = (modelId: string, provider: 'local' | 'hosted' | 'mock') => {
    setPlaygroundTarget({ model_id: modelId, provider });
    setCurrentPage('playground');
  };

  const handleAcknowledgeAlert = async (alertId: number) => {
    try {
      await api.updateAlertStatus(alertId, 'acknowledged');
      loadData();
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const handleOpenDeployModal = () => {
    setCurrentPage('models');
    setIsDeployModalOpen(true);
  };

  const activeAlertsCount = alerts.filter(a => a.status === 'active').length;

  return (
    <div className="min-h-screen bg-[#060606] text-[#F1D7AE] flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        systemReady={systemReady}
        activeAlertsCount={activeAlertsCount}
        onRefresh={loadData}
        isRefreshing={isRefreshing}
        onSelectPage={setCurrentPage}
        onOpenDeployModal={handleOpenDeployModal}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Compact Navigation Rail */}
        <Sidebar
          currentPage={currentPage}
          onSelectPage={setCurrentPage}
          activeAlertsCount={activeAlertsCount}
        />

        {/* Main Spacious Content Canvas */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 max-w-7xl mx-auto w-full">
          {currentPage === 'overview' && (
            <OverviewDashboard
              overview={overview}
              alerts={alerts}
              recentLogs={recentLogs}
              isLoading={isRefreshing && !overview}
              onNavigate={setCurrentPage}
              onOpenDeployModal={handleOpenDeployModal}
              onAcknowledgeAlert={handleAcknowledgeAlert}
            />
          )}

          {currentPage === 'models' && (
            <ModelManagement
              models={models}
              onRefresh={loadData}
              onSelectForPlayground={handleSelectForPlayground}
              isModalOpen={isDeployModalOpen}
              setIsModalOpen={setIsDeployModalOpen}
            />
          )}

          {currentPage === 'playground' && (
            <ModelPlayground
              models={models}
              initialModelId={playgroundTarget?.model_id}
              initialProvider={playgroundTarget?.provider}
              onExecutionCompleted={loadData}
            />
          )}

          {currentPage === 'logs' && (
            <RequestLogs models={models} />
          )}

          {currentPage === 'alerts' && (
            <AlertsPage alerts={alerts} onRefresh={loadData} />
          )}

          {currentPage === 'evaluation' && (
            <ModelEvaluation models={models} />
          )}

          {currentPage === 'settings' && (
            <SettingsPage />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
