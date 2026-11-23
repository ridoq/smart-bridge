import React, { useState, useEffect } from 'react';
import { Menu, Volume2, VolumeX } from 'lucide-react';

export default function Header({
  onOpenSidebar,
  scope,
  onSetScope,
  mode,
  onSetMode,
  isMuted,
  onToggleSound
}) {
  const [clock, setClock] = useState('00:00:00 WIB');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('id-ID') + ' WIB');
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="border-b border-[#30363D] bg-[#0D1117] sticky top-0 z-30 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Left: Sidebar Trigger & Clean Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onOpenSidebar}
            aria-label="Menu"
            className="p-2 rounded-lg text-[#8B949E] hover:text-white hover:bg-[#21262D] transition border border-transparent hover:border-[#30363D]"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <span className="text-base font-semibold text-white tracking-tight">BRIMON</span>
            <span className="text-xs text-[#8B949E] hidden sm:inline">|</span>
            <span className="text-xs text-[#8B949E] hidden sm:inline">Monitoring Struktur Jembatan</span>
          </div>
        </div>

        {/* Right: Clean Segmented Controls */}
        <div className="flex items-center gap-3">
          {/* Scope Switcher */}
          <div className="bg-[#161B22] border border-[#30363D] p-0.5 rounded-lg flex items-center text-xs">
            <button
              onClick={() => onSetScope('lab')}
              className={`px-3 py-1 rounded-md font-medium transition ${
                scope === 'lab' ? 'bg-[#21262D] text-white' : 'text-[#8B949E] hover:text-white'
              }`}
            >
              Maket 2.5m
            </button>
            <button
              onClick={() => onSetScope('real')}
              className={`px-3 py-1 rounded-md font-medium transition ${
                scope === 'real' ? 'bg-[#21262D] text-white' : 'text-[#8B949E] hover:text-white'
              }`}
            >
              Jembatan 120m
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="bg-[#161B22] border border-[#30363D] p-0.5 rounded-lg flex items-center text-xs hidden md:flex">
            <button
              onClick={() => onSetMode('sim')}
              className={`px-3 py-1 rounded-md font-medium transition ${
                mode === 'sim' ? 'bg-[#21262D] text-white' : 'text-[#8B949E] hover:text-white'
              }`}
            >
              Simulasi
            </button>
            <button
              onClick={() => onSetMode('live')}
              className={`px-3 py-1 rounded-md font-medium transition ${
                mode === 'live' ? 'bg-[#21262D] text-white' : 'text-[#8B949E] hover:text-white'
              }`}
            >
              ESP32
            </button>
          </div>

          {/* Audio Toggle */}
          <button
            onClick={onToggleSound}
            className="p-2 rounded-lg text-[#8B949E] hover:text-white hover:bg-[#21262D] transition"
            title="Audio Alarm"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Clock */}
          <div className="text-xs font-medium text-[#8B949E] tabular-nums hidden lg:block border-l border-[#30363D] pl-3">
            {clock}
          </div>
        </div>

      </div>
    </header>
  );
}
