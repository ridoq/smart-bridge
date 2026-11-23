import React from 'react';
import { X, LayoutDashboard, Box, Activity, Sliders, FileText, Calculator, History } from 'lucide-react';

export default function Sidebar({
  isOpen,
  onClose,
  onOpenModal
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity ${
          isOpen ? 'block opacity-100' : 'hidden opacity-0'
        }`}
      />

      {/* Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-[#161B22] border-r border-[#30363D] shadow-2xl flex flex-col justify-between transform transition-transform duration-250 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#30363D] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide">BRIMON</h2>
              <p className="text-xs text-[#8B949E] mt-0.5">TIM 25 — Akral Catura</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-[#8B949E] hover:text-white hover:bg-[#21262D] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1 text-sm">
            <a
              href="#sectionOverview"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#F0F6FC] hover:bg-[#21262D] transition font-medium"
            >
              <LayoutDashboard className="w-4 h-4 text-[#8B949E]" />
              <span>Dashboard Utama</span>
            </a>
            <a
              href="#sectionModel3D"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#C9D1D9] hover:text-white hover:bg-[#21262D] transition"
            >
              <Box className="w-4 h-4 text-[#8B949E]" />
              <span>Model Struktur 3D</span>
            </a>
            <a
              href="#sectionCharts"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#C9D1D9] hover:text-white hover:bg-[#21262D] transition"
            >
              <Activity className="w-4 h-4 text-[#8B949E]" />
              <span>Grafik Getaran & FFT</span>
            </a>
            <a
              href="#sectionScenarios"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#C9D1D9] hover:text-white hover:bg-[#21262D] transition"
            >
              <Sliders className="w-4 h-4 text-[#8B949E]" />
              <span>Skenario Pengujian</span>
            </a>
            <button
              onClick={() => { onClose(); onOpenModal('tech'); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#C9D1D9] hover:text-white hover:bg-[#21262D] transition text-left"
            >
              <FileText className="w-4 h-4 text-[#8B949E]" />
              <span>Spesifikasi Desain Jembatan</span>
            </button>
            <button
              onClick={() => { onClose(); onOpenModal('formula'); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#C9D1D9] hover:text-white hover:bg-[#21262D] transition text-left"
            >
              <Calculator className="w-4 h-4 text-[#8B949E]" />
              <span>Metodologi Pt T-05-2002-B</span>
            </button>
            <button
              onClick={() => { onClose(); onOpenModal('logs'); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[#C9D1D9] hover:text-white hover:bg-[#21262D] transition text-left"
            >
              <History className="w-4 h-4 text-[#8B949E]" />
              <span>Riwayat Telemetri & CSV</span>
            </button>
          </nav>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#30363D] text-xs text-[#8B949E]">
          <div>Innovative Bridge Design Competition 2027</div>
          <div className="mt-1 text-[#484F58]">Through Tied Arch · Parker-Warren</div>
        </div>
      </aside>
    </>
  );
}
