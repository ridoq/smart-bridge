import React from 'react';
import { X, Download } from 'lucide-react';

function ModalsComponent({
  activeModal,
  onClose,
  logs,
  onExportCSV
}) {
  if (!activeModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#161B22] border border-[#D0D7DE] dark:border-[#30363D] rounded-xl max-w-xl w-full p-6 shadow-2xl relative space-y-4">
        
        {/* Modal: Technical Specifications */}
        {activeModal === 'tech' && (
          <>
            <div className="flex justify-between items-center border-b border-[#D0D7DE] dark:border-[#30363D] pb-3">
              <h3 className="text-sm font-semibold text-[#1F2328] dark:text-white">Spesifikasi Teknis Maket Jembatan (TIM 25)</h3>
              <button
                onClick={onClose}
                aria-label="Close Modal"
                className="text-[#656D76] dark:text-[#8B949E] hover:text-[#1F2328] dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#F6F8FA] dark:bg-[#0D1117] rounded-lg border border-[#E1E4E8] dark:border-[#21262D]">
                <span className="text-[#656D76] dark:text-[#8B949E] block">Tipe Struktur</span>
                <strong className="text-[#1F2328] dark:text-white font-medium">Through Tied Arch (Parker-Warren)</strong>
              </div>
              <div className="p-3 bg-[#F6F8FA] dark:bg-[#0D1117] rounded-lg border border-[#E1E4E8] dark:border-[#21262D]">
                <span className="text-[#656D76] dark:text-[#8B949E] block">Dimensi Maket</span>
                <strong className="text-[#1F2328] dark:text-white font-medium">Bentang 2.500 mm · Tinggi 500 mm</strong>
              </div>
              <div className="p-3 bg-[#F6F8FA] dark:bg-[#0D1117] rounded-lg border border-[#E1E4E8] dark:border-[#21262D]">
                <span className="text-[#656D76] dark:text-[#8B949E] block">Berat Maket</span>
                <strong className="text-[#1A7F37] dark:text-[#3FB950] font-medium">31.28 kg (Batas Lomba &le; 40 kg)</strong>
              </div>
              <div className="p-3 bg-[#F6F8FA] dark:bg-[#0D1117] rounded-lg border border-[#E1E4E8] dark:border-[#21262D]">
                <span className="text-[#656D76] dark:text-[#8B949E] block">Material Profil</span>
                <strong className="text-[#1F2328] dark:text-white font-medium">Hollow Baja Ringan (SHS BJ-37)</strong>
              </div>
              <div className="p-3 bg-[#F6F8FA] dark:bg-[#0D1117] rounded-lg border border-[#E1E4E8] dark:border-[#21262D]">
                <span className="text-[#656D76] dark:text-[#8B949E] block">Target Uji Beban 1.7 Ton</span>
                <strong className="text-[#9A6700] dark:text-[#D29922] font-medium">Lendutan Target: 4.998 mm</strong>
              </div>
              <div className="p-3 bg-[#F6F8FA] dark:bg-[#0D1117] rounded-lg border border-[#E1E4E8] dark:border-[#21262D]">
                <span className="text-[#656D76] dark:text-[#8B949E] block">Beban Maksimum</span>
                <strong className="text-[#1F2328] dark:text-white font-medium">2.40 Ton (Rasio Tegangan 1.009)</strong>
              </div>
            </div>
          </>
        )}

        {/* Modal: Methodology & Standard */}
        {activeModal === 'formula' && (
          <>
            <div className="flex justify-between items-center border-b border-[#D0D7DE] dark:border-[#30363D] pb-3">
              <h3 className="text-sm font-semibold text-[#1F2328] dark:text-white">Standar Kerusakan Jembatan Pt T-05-2002-B</h3>
              <button
                onClick={onClose}
                aria-label="Close Modal"
                className="text-[#656D76] dark:text-[#8B949E] hover:text-[#1F2328] dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs text-[#24292F] dark:text-[#C9D1D9]">
              <p>Degradasi kekakuan struktur dievaluasi berdasarkan pergeseran frekuensi alami fundamental ragam 1 (f₀ = 4.88 Hz):</p>
              <div className="p-3 bg-[#F6F8FA] dark:bg-[#0D1117] rounded-lg border border-[#E1E4E8] dark:border-[#21262D] font-mono text-center text-[#1F2328] dark:text-white">
                D = ((f₀ - f) / f₀) × 100%
              </div>
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between p-2 rounded bg-[#F6F8FA] dark:bg-[#0D1117] border border-[#E1E4E8] dark:border-[#21262D]">
                  <span>D &le; 5%</span>
                  <strong className="text-[#1A7F37] dark:text-[#3FB950]">Kondisi Baik (Normal)</strong>
                </div>
                <div className="flex justify-between p-2 rounded bg-[#F6F8FA] dark:bg-[#0D1117] border border-[#E1E4E8] dark:border-[#21262D]">
                  <span>D = 6% – 10%</span>
                  <strong className="text-[#9A6700] dark:text-[#D29922]">Kondisi Cukup (Waspada Ringan)</strong>
                </div>
                <div className="flex justify-between p-2 rounded bg-[#F6F8FA] dark:bg-[#0D1117] border border-[#E1E4E8] dark:border-[#21262D]">
                  <span>D = 11% – 17%</span>
                  <strong className="text-[#9A6700] dark:text-[#D29922]">Kondisi Sedang (Waspada Struktural)</strong>
                </div>
                <div className="flex justify-between p-2 rounded bg-[#F6F8FA] dark:bg-[#0D1117] border border-[#E1E4E8] dark:border-[#21262D]">
                  <span>D &ge; 18%</span>
                  <strong className="text-[#CF222E] dark:text-[#F85149]">Kondisi Buruk (Bahaya / Rusak Berat)</strong>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Modal: Logs & CSV */}
        {activeModal === 'logs' && (
          <>
            <div className="flex justify-between items-center border-b border-[#D0D7DE] dark:border-[#30363D] pb-3">
              <h3 className="text-sm font-semibold text-[#1F2328] dark:text-white">Log Telemetri & Riwayat</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={onExportCSV}
                  className="px-2.5 py-1 rounded bg-[#F6F8FA] dark:bg-[#21262D] hover:bg-[#F3F4F6] dark:hover:bg-[#30363D] border border-[#D0D7DE] dark:border-[#30363D] text-xs text-[#1F2328] dark:text-white transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={onClose}
                  aria-label="Close Modal"
                  className="text-[#656D76] dark:text-[#8B949E] hover:text-[#1F2328] dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 text-xs">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded bg-[#F6F8FA] dark:bg-[#0D1117] border border-[#E1E4E8] dark:border-[#21262D] text-[#24292F] dark:text-[#C9D1D9] flex justify-between items-center"
                >
                  <span>{log.text}</span>
                  <span className="text-[10px] text-[#656D76] dark:text-[#8B949E] font-medium">{log.time}</span>
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </div>
  );
}

export default React.memo(ModalsComponent);
