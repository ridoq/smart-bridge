import React from 'react';

function MetricsGridComponent({ payload }) {
  // Damage Status Label styling
  let damageText = 'Normal · 0.0% deviasi';
  let damageColor = 'text-[#1A7F37] dark:text-[#3FB950]';
  if (payload.damage_index >= 18.0) {
    damageText = `Bahaya · ${payload.damage_index.toFixed(1)}% deviasi`;
    damageColor = 'text-[#CF222E] dark:text-[#F85149]';
  } else if (payload.damage_index >= 6.0) {
    damageText = `Waspada · ${payload.damage_index.toFixed(1)}% deviasi`;
    damageColor = 'text-[#9A6700] dark:text-[#D29922]';
  }

  // Deflection Status
  let defText = 'Aman';
  let defColor = 'text-[#1A7F37] dark:text-[#3FB950]';
  if (payload.deflection > 5.0) {
    defText = 'Over Limit';
    defColor = 'text-[#CF222E] dark:text-[#F85149]';
  } else if (payload.deflection > 3.125) {
    defText = 'Mendekati Target Uji';
    defColor = 'text-[#9A6700] dark:text-[#D29922]';
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* Card 1: Frekuensi Alami */}
      <div className="bg-white dark:bg-[#161B22] border border-[#D0D7DE] dark:border-[#30363D] rounded-xl p-5 hover:border-[#AFB8C1] dark:hover:border-[#484F58] shadow-xs transition">
        <div className="text-xs font-medium text-[#656D76] dark:text-[#8B949E]">Frekuensi Alami (fn)</div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-3xl font-semibold text-[#1F2328] dark:text-white tracking-tight tabular-nums">
            {payload.frequency.toFixed(2)}
          </span>
          <span className="text-xs text-[#656D76] dark:text-[#8B949E]">Hz</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-[#656D76] dark:text-[#8B949E] border-t border-[#E1E4E8] dark:border-[#21262D] pt-2.5">
          <span>Baseline 4.88 Hz</span>
          <span className={`${damageColor} font-medium`}>{damageText}</span>
        </div>
      </div>

      {/* Card 2: Lendutan Dek */}
      <div className="bg-white dark:bg-[#161B22] border border-[#D0D7DE] dark:border-[#30363D] rounded-xl p-5 hover:border-[#AFB8C1] dark:hover:border-[#484F58] shadow-xs transition">
        <div className="text-xs font-medium text-[#656D76] dark:text-[#8B949E]">Lendutan Tengah Dek (δ)</div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-3xl font-semibold text-[#1F2328] dark:text-white tracking-tight tabular-nums">
            {payload.deflection.toFixed(2)}
          </span>
          <span className="text-xs text-[#656D76] dark:text-[#8B949E]">mm</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-[#656D76] dark:text-[#8B949E] border-t border-[#E1E4E8] dark:border-[#21262D] pt-2.5">
          <span>Batas L/800: 3.12 mm</span>
          <span className={`${defColor} font-medium`}>{defText}</span>
        </div>
      </div>

      {/* Card 3: Beban Uji Aktuator */}
      <div className="bg-white dark:bg-[#161B22] border border-[#D0D7DE] dark:border-[#30363D] rounded-xl p-5 hover:border-[#AFB8C1] dark:hover:border-[#484F58] shadow-xs transition">
        <div className="text-xs font-medium text-[#656D76] dark:text-[#8B949E]">Beban Uji Aktuator Hidrolik</div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-3xl font-semibold text-[#1F2328] dark:text-white tracking-tight tabular-nums">
            {payload.load_ton.toFixed(2)}
          </span>
          <span className="text-xs text-[#656D76] dark:text-[#8B949E]">Ton</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-[#656D76] dark:text-[#8B949E] border-t border-[#E1E4E8] dark:border-[#21262D] pt-2.5">
          <span>Tengah Bentang</span>
          <span className="text-[#656D76] dark:text-[#8B949E]">Target 1.70 Ton</span>
        </div>
      </div>

      {/* Card 4: Getaran Vertikal */}
      <div className="bg-white dark:bg-[#161B22] border border-[#D0D7DE] dark:border-[#30363D] rounded-xl p-5 hover:border-[#AFB8C1] dark:hover:border-[#484F58] shadow-xs transition">
        <div className="text-xs font-medium text-[#656D76] dark:text-[#8B949E]">Getaran Vertikal (RMS)</div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-3xl font-semibold text-[#1F2328] dark:text-white tracking-tight tabular-nums">
            {payload.vibration.toFixed(2)}
          </span>
          <span className="text-xs text-[#656D76] dark:text-[#8B949E]">m/s²</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-[#656D76] dark:text-[#8B949E] border-t border-[#E1E4E8] dark:border-[#21262D] pt-2.5">
          <span>Kemiringan</span>
          <span className="text-[#656D76] dark:text-[#8B949E] tabular-nums">
            {payload.pitch > 0 ? '+' : ''}{payload.pitch.toFixed(2)}°
          </span>
        </div>
      </div>

    </div>
  );
}

export default React.memo(MetricsGridComponent);
