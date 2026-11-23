import React from 'react';

export default function MetricsGrid({ payload }) {
  // Damage Status Label styling
  let damageText = 'Normal · 0.0% deviasi';
  let damageColor = 'text-[#3FB950]';
  if (payload.damage_index >= 18.0) {
    damageText = `Bahaya · ${payload.damage_index.toFixed(1)}% deviasi`;
    damageColor = 'text-[#F85149]';
  } else if (payload.damage_index >= 6.0) {
    damageText = `Waspada · ${payload.damage_index.toFixed(1)}% deviasi`;
    damageColor = 'text-[#D29922]';
  }

  // Deflection Status
  let defText = 'Aman';
  let defColor = 'text-[#3FB950]';
  if (payload.deflection > 5.0) {
    defText = 'Over Limit';
    defColor = 'text-[#F85149]';
  } else if (payload.deflection > 3.125) {
    defText = 'Mendekati Target Uji';
    defColor = 'text-[#D29922]';
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* Card 1: Frekuensi Alami */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-5 hover:border-[#484F58] transition">
        <div className="text-xs font-medium text-[#8B949E]">Frekuensi Alami (fn)</div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-3xl font-semibold text-white tracking-tight tabular-nums">
            {payload.frequency.toFixed(2)}
          </span>
          <span className="text-xs text-[#8B949E]">Hz</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-[#8B949E] border-t border-[#21262D] pt-2.5">
          <span>Baseline 4.88 Hz</span>
          <span className={`${damageColor} font-medium`}>{damageText}</span>
        </div>
      </div>

      {/* Card 2: Lendutan Dek */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-5 hover:border-[#484F58] transition">
        <div className="text-xs font-medium text-[#8B949E]">Lendutan Tengah Dek (δ)</div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-3xl font-semibold text-white tracking-tight tabular-nums">
            {payload.deflection.toFixed(2)}
          </span>
          <span className="text-xs text-[#8B949E]">mm</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-[#8B949E] border-t border-[#21262D] pt-2.5">
          <span>Batas L/800: 3.12 mm</span>
          <span className={`${defColor} font-medium`}>{defText}</span>
        </div>
      </div>

      {/* Card 3: Beban Uji */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-5 hover:border-[#484F58] transition">
        <div className="text-xs font-medium text-[#8B949E]">Beban Uji Terpasang</div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-3xl font-semibold text-white tracking-tight tabular-nums">
            {payload.load_ton.toFixed(2)}
          </span>
          <span className="text-xs text-[#8B949E]">Ton</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-[#8B949E] border-t border-[#21262D] pt-2.5">
          <span>Target Uji 1.70 Ton</span>
          <span className="text-[#8B949E]">Maks 2.40 Ton</span>
        </div>
      </div>

      {/* Card 4: Getaran Vertikal */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-5 hover:border-[#484F58] transition">
        <div className="text-xs font-medium text-[#8B949E]">Getaran Vertikal (RMS)</div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-3xl font-semibold text-white tracking-tight tabular-nums">
            {payload.vibration.toFixed(2)}
          </span>
          <span className="text-xs text-[#8B949E]">m/s²</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-[#8B949E] border-t border-[#21262D] pt-2.5">
          <span>Kemiringan</span>
          <span className="text-[#8B949E] tabular-nums">
            {payload.pitch > 0 ? '+' : ''}{payload.pitch.toFixed(2)}°
          </span>
        </div>
      </div>

    </div>
  );
}
