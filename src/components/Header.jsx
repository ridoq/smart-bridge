import React, { useState, useEffect } from 'react';
import { Menu, Volume2, VolumeX, Sun, Moon } from 'lucide-react';

export default function Header({
  onOpenSidebar,
  scope,
  onSetScope,
  mode,
  onSetMode,
  isMuted,
  onToggleSound,
  theme,
  onToggleTheme
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
    <header className="border-b border-[#D0D7DE] dark:border-[#30363D] bg-white dark:bg-[#0D1117] sticky top-0 z-30 px-6 py-3.5 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Left: Sidebar Trigger & Clean Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onOpenSidebar}
            aria-label="Menu"
            className="p-2 rounded-lg text-[#656D76] dark:text-[#8B949E] hover:text-[#1F2328] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#21262D] transition border border-[#D0D7DE] dark:border-[#30363D]"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <span className="text-base font-semibold text-[#1F2328] dark:text-white tracking-tight">ASETU</span>
            <span className="text-xs text-[#8C959F] dark:text-[#8B949E] hidden sm:inline">|</span>
            <span className="text-xs text-[#656D76] dark:text-[#8B949E] hidden sm:inline">Monitoring Struktur Jembatan</span>
          </div>
        </div>

        {/* Right: Clean Controls & Toggles */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Model Info (Simple non-button indicator) */}
          <div className="bg-[#F6F8FA] dark:bg-[#161B22] border border-[#D0D7DE] dark:border-[#30363D] px-2.5 py-1 rounded-md text-xs font-medium text-[#1F2328] dark:text-[#E6EDF3] select-none">
            Maket 2.5m
          </div>

          {/* Mode Switcher */}
          <div className="bg-[#F6F8FA] dark:bg-[#161B22] border border-[#D0D7DE] dark:border-[#30363D] p-0.5 rounded-lg flex items-center text-xs hidden md:flex">
            <button
              onClick={() => onSetMode('sim')}
              className={`px-3 py-1 rounded-md font-medium transition ${
                mode === 'sim'
                  ? 'bg-white dark:bg-[#21262D] text-[#1F2328] dark:text-white shadow-xs'
                  : 'text-[#656D76] dark:text-[#8B949E] hover:text-[#1F2328] dark:hover:text-white'
              }`}
            >
              Simulasi
            </button>
            <button
              onClick={() => onSetMode('live')}
              className={`px-3 py-1 rounded-md font-medium transition ${
                mode === 'live'
                  ? 'bg-white dark:bg-[#21262D] text-[#1F2328] dark:text-white shadow-xs'
                  : 'text-[#656D76] dark:text-[#8B949E] hover:text-[#1F2328] dark:hover:text-white'
              }`}
            >
              ESP32
            </button>
          </div>

          {/* Theme Switcher (Icon Only) */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle Theme"
            className="p-2 rounded-lg text-[#656D76] dark:text-[#8B949E] hover:text-[#1F2328] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#21262D] transition border border-[#D0D7DE] dark:border-[#30363D]"
            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[#D29922]" />
            ) : (
              <Moon className="w-4 h-4 text-[#0969DA]" />
            )}
          </button>

          {/* Audio Alarm Toggle */}
          <button
            onClick={onToggleSound}
            aria-label="Toggle Alarm Sound"
            className="p-2 rounded-lg text-[#656D76] dark:text-[#8B949E] hover:text-[#1F2328] dark:hover:text-white hover:bg-[#F3F4F6] dark:hover:bg-[#21262D] transition border border-[#D0D7DE] dark:border-[#30363D]"
            title={isMuted ? 'Nyalakan Suara Alarm' : 'Bisukan Suara Alarm'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Clock */}
          <div className="text-xs font-medium text-[#656D76] dark:text-[#8B949E] tabular-nums hidden lg:block border-l border-[#D0D7DE] dark:border-[#30363D] pl-3">
            {clock}
          </div>
        </div>

      </div>
    </header>
  );
}
