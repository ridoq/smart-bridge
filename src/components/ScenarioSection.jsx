import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ScenarioSection({
  scenario,
  onSetScenario,
  payload
}) {
  let ewsBorder = 'border-[#1A7F37]/40 dark:border-[#3FB950]/50';
  let statusColor = 'text-[#1A7F37] dark:text-[#3FB950]';
  let statusTitle = 'STRUKTUR AMAN';
  let statusDesc = 'Lendutan dan getaran berada dalam batas toleransi elastis.';

  if (payload.status === 'DANGER') {
    ewsBorder = 'border-[#CF222E]/40 dark:border-[#F85149]';
    statusColor = 'text-[#CF222E] dark:text-[#F85149]';
    statusTitle = 'BAHAYA KRITIS (OVERLOAD)';
    statusDesc = 'Lendutan melebihi 8 mm dan deviasi frekuensi D > 18%.';
  } else if (payload.status === 'WARNING') {
    ewsBorder = 'border-[#9A6700]/40 dark:border-[#D29922]';
    statusColor = 'text-[#9A6700] dark:text-[#D29922]';
    statusTitle = 'STATUS WASPADA';
    statusDesc = 'Uji pembebanan panitia 1.7 Ton tercapai (δ ≈ 4.998 mm).';
  }

  return (
    <section id="sectionScenarios" className="grid grid-cols-1 lg:grid-cols-12 gap-4">

      {/* Testing Scenarios (8 cols) */}
      <div className="lg:col-span-8 bg-white dark:bg-[#161B22] border border-[#D0D7DE] dark:border-[#30363D] rounded-xl p-5 space-y-3 shadow-xs transition">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-[#1F2328] dark:text-white">Simulasi Pengujian Beban</h3>
          <span className="text-xs text-[#656D76] dark:text-[#8B949E]">Pilih skenario untuk demo respons jembatan</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Scenario 1 */}
          <button
            onClick={() => onSetScenario('baseline')}
            className={`p-3.5 rounded-lg bg-[#F6F8FA] dark:bg-[#0D1117] text-left hover:bg-[#F3F4F6] dark:hover:bg-[#1C2128] transition border ${
              scenario === 'baseline'
                ? 'border-[#1A7F37] dark:border-[#3FB950]'
                : 'border-[#D0D7DE] dark:border-[#30363D]'
            }`}
          >
            <div className="text-xs font-semibold text-[#1F2328] dark:text-white">1. Baseline (Tanpa Beban)</div>
            <div className="text-xs text-[#656D76] dark:text-[#8B949E] mt-1">fn = 4.88 Hz · δ = 0.85 mm · D = 0.0%</div>
          </button>

          {/* Scenario 2 */}
          <button
            onClick={() => onSetScenario('light')}
            className={`p-3.5 rounded-lg bg-[#F6F8FA] dark:bg-[#0D1117] text-left hover:bg-[#F3F4F6] dark:hover:bg-[#1C2128] transition border ${
              scenario === 'light'
                ? 'border-[#0969DA] dark:border-[#2F81F7]'
                : 'border-[#D0D7DE] dark:border-[#30363D]'
            }`}
          >
            <div className="text-xs font-semibold text-[#1F2328] dark:text-white">2. Beban Ringan (0.45 Ton)</div>
            <div className="text-xs text-[#656D76] dark:text-[#8B949E] mt-1">fn = 4.82 Hz · δ = 2.10 mm · D = 1.2%</div>
          </button>

          {/* Scenario 3 */}
          <button
            onClick={() => onSetScenario('testload')}
            className={`p-3.5 rounded-lg bg-[#F6F8FA] dark:bg-[#0D1117] text-left hover:bg-[#F3F4F6] dark:hover:bg-[#1C2128] transition border ${
              scenario === 'testload'
                ? 'border-[#9A6700] dark:border-[#D29922]'
                : 'border-[#D0D7DE] dark:border-[#30363D]'
            }`}
          >
            <div className="text-xs font-semibold text-[#1F2328] dark:text-white">3. Uji Beban Target (1.70 Ton)</div>
            <div className="text-xs text-[#656D76] dark:text-[#8B949E] mt-1">Target δ = 4.998 mm · fn = 4.55 Hz · D = 6.7%</div>
          </button>

          {/* Scenario 4 */}
          <button
            onClick={() => onSetScenario('danger')}
            className={`p-3.5 rounded-lg bg-[#F6F8FA] dark:bg-[#0D1117] text-left hover:bg-[#F3F4F6] dark:hover:bg-[#1C2128] transition border ${
              scenario === 'danger'
                ? 'border-[#CF222E] dark:border-[#F85149]'
                : 'border-[#D0D7DE] dark:border-[#30363D]'
            }`}
          >
            <div className="text-xs font-semibold text-[#1F2328] dark:text-white">4. Overload Kritis (&gt; 2.40 Ton)</div>
            <div className="text-xs text-[#656D76] dark:text-[#8B949E] mt-1">Lendutan 8.60 mm · fn = 3.85 Hz · D = 21.1%</div>
          </button>
        </div>
      </div>

      {/* EWS Status (4 cols) */}
      <div className={`lg:col-span-4 bg-white dark:bg-[#161B22] border ${ewsBorder} rounded-xl p-5 flex flex-col justify-between shadow-xs transition`}>
        <div>
          <div className="text-xs font-medium text-[#656D76] dark:text-[#8B949E]">Status Keamanan Struktur</div>
          <div className="mt-3">
            <h4 className={`text-base font-semibold ${statusColor}`}>{statusTitle}</h4>
            <p className="text-xs text-[#24292F] dark:text-[#C9D1D9] mt-1">{statusDesc}</p>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-[#F6F8FA] dark:bg-[#0D1117] border border-[#E1E4E8] dark:border-[#21262D] text-xs space-y-1">
            <div className="text-[#656D76] dark:text-[#8B949E]">Formula Degradasi Pt T-05-2002-B:</div>
            <div className="text-[#1F2328] dark:text-white font-medium">D = ((f₀ - f) / f₀) × 100%</div>
            <div className="flex justify-between text-[#656D76] dark:text-[#8B949E] pt-1">
              <span>f Aktual: <strong className="text-[#1F2328] dark:text-white font-normal">{payload.frequency.toFixed(2)} Hz</strong></span>
              <span>D: <strong className={`${statusColor} font-medium`}>{payload.damage_index.toFixed(1)}%</strong></span>
            </div>
          </div>

          {payload.status === 'DANGER' && (
            <div className="mt-3 p-2.5 rounded-lg bg-[#CF222E]/10 dark:bg-[#F85149]/15 border border-[#CF222E]/30 dark:border-[#F85149]/30 text-xs text-[#CF222E] dark:text-[#F85149] font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Alarm sirine fisik aktif di jembatan</span>
            </div>
          )}
        </div>

        <div className="mt-3 pt-2 text-[11px] text-[#8C959F] dark:text-[#6E7681]">
          Evaluasi otomatis berdasarkan Pt T-05-2002-B
        </div>
      </div>

    </section>
  );
}
