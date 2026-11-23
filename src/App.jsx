import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MetricsGrid from './components/MetricsGrid';
import Bridge3DViewer from './components/Bridge3DViewer';
import TelemetryCharts from './components/TelemetryCharts';
import ScenarioSection from './components/ScenarioSection';
import Modals from './components/Modals';
import { useBridgeTelemetry } from './hooks/useBridgeTelemetry';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  const {
    payload,
    scenario,
    setScenario,
    scope,
    setBridgeScope,
    appMode,
    setAppMode,
    deformScale,
    setDeformScale,
    isMuted,
    toggleSound,
    logs,
    vibrationHistory,
    exportLogsCSV
  } = useBridgeTelemetry();

  return (
    <div className="min-h-screen flex flex-col bg-[#0D1117] text-[#C9D1D9] antialiased">
      {/* Off-canvas Navigation Drawer */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenModal={(modal) => setActiveModal(modal)}
      />

      {/* Top Header */}
      <Header
        onOpenSidebar={() => setSidebarOpen(true)}
        scope={scope}
        onSetScope={setBridgeScope}
        mode={appMode}
        onSetMode={setAppMode}
        isMuted={isMuted}
        onToggleSound={toggleSound}
      />

      {/* Main Content Layout */}
      <main id="sectionOverview" className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        
        {/* KPI Metrics */}
        <MetricsGrid payload={payload} />

        {/* 3D Model Viewport */}
        <Bridge3DViewer
          deflection={payload.deflection}
          status={payload.status}
          deformScale={deformScale}
          onSetDeformScale={setDeformScale}
        />

        {/* Dual Live Charts */}
        <TelemetryCharts
          vibrationHistory={vibrationHistory}
          frequency={payload.frequency}
        />

        {/* Testing Scenarios & EWS */}
        <ScenarioSection
          scenario={scenario}
          onSetScenario={setScenario}
          payload={payload}
        />

      </main>

      {/* Modals for Deep Specs / Formulas / Logs */}
      <Modals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        logs={logs}
        onExportCSV={exportLogsCSV}
      />

      {/* Clean Minimal Footer */}
      <footer className="mt-auto border-t border-[#30363D] py-4 text-center text-xs text-[#6E7681]">
        BRIMON SHMS &copy; 2026 TIM 25 — AKRAL CATURA · Innovative Bridge Design Competition 2027
      </footer>
    </div>
  );
}
