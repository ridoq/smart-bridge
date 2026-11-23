import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
);

export default function TelemetryCharts({ vibrationHistory, frequency, theme = 'dark' }) {
  const isDark = theme === 'dark';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)';
  const tickColor = isDark ? '#8B949E' : '#656D76';

  // 1. Time Domain Vibration Chart
  const vibData = useMemo(() => {
    return {
      labels: Array(vibrationHistory.length).fill(''),
      datasets: [
        {
          data: vibrationHistory,
          borderColor: isDark ? '#2F81F7' : '#0969DA',
          borderWidth: 1.8,
          backgroundColor: isDark ? 'rgba(47, 129, 247, 0.08)' : 'rgba(9, 105, 218, 0.08)',
          fill: true,
          tension: 0.35,
          pointRadius: 0
        }
      ]
    };
  }, [vibrationHistory, isDark]);

  const vibOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        x: { grid: { display: false }, ticks: { display: false } },
        y: {
          min: 0,
          max: 4.0,
          grid: { color: gridColor },
          ticks: { color: tickColor, font: { family: 'Inter', size: 10 }, stepSize: 1.0 }
        }
      },
      plugins: { legend: { display: false } }
    };
  }, [gridColor, tickColor]);

  // 2. Frequency Domain FFT Spectrum
  const fftFreqLabels = useMemo(() => {
    const list = [];
    for (let f = 0; f <= 15; f += 0.5) list.push(f.toFixed(1));
    return list;
  }, []);

  const fftData = useMemo(() => {
    const data = fftFreqLabels.map(fl => {
      const f = parseFloat(fl);
      const diff = Math.abs(f - frequency);
      const val = 1.2 * Math.exp(- (diff * diff) / (2 * 0.35 * 0.35)) + (Math.random() * 0.04);
      return Math.max(0.02, parseFloat(val.toFixed(3)));
    });

    return {
      labels: fftFreqLabels,
      datasets: [
        {
          data,
          borderColor: isDark ? '#D29922' : '#9A6700',
          borderWidth: 1.8,
          backgroundColor: isDark ? 'rgba(210, 153, 34, 0.08)' : 'rgba(154, 103, 0, 0.08)',
          fill: true,
          tension: 0.25,
          pointRadius: 0
        }
      ]
    };
  }, [fftFreqLabels, frequency, isDark]);

  const fftOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: tickColor,
            font: { family: 'Inter', size: 10 },
            maxTicksLimit: 8,
            callback: (val) => fftFreqLabels[val] + ' Hz'
          }
        },
        y: {
          min: 0,
          max: 1.8,
          grid: { color: gridColor },
          ticks: { color: tickColor, font: { family: 'Inter', size: 10 }, stepSize: 0.5 }
        }
      },
      plugins: { legend: { display: false } }
    };
  }, [gridColor, tickColor, fftFreqLabels]);

  return (
    <section id="sectionCharts" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      
      {/* Chart 1: Time Domain */}
      <div className="bg-white dark:bg-[#161B22] border border-[#D0D7DE] dark:border-[#30363D] rounded-xl p-5 flex flex-col justify-between shadow-xs transition">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-semibold text-[#1F2328] dark:text-white">Getaran Vertikal Sumbu-Z (m/s²)</span>
          <span className="text-xs text-[#656D76] dark:text-[#8B949E]">100 Hz</span>
        </div>
        <div className="h-[190px] w-full">
          <Line data={vibData} options={vibOptions} />
        </div>
        <div className="mt-3 pt-2.5 border-t border-[#E1E4E8] dark:border-[#21262D] flex justify-between text-xs text-[#656D76] dark:text-[#8B949E]">
          <span>Batas Kritis: 2.50 m/s²</span>
          <span>Filter 1g Aktif</span>
        </div>
      </div>

      {/* Chart 2: Frequency Domain FFT */}
      <div className="bg-white dark:bg-[#161B22] border border-[#D0D7DE] dark:border-[#30363D] rounded-xl p-5 flex flex-col justify-between shadow-xs transition">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-semibold text-[#1F2328] dark:text-white">Spektrum Frekuensi FFT (PSD)</span>
          <span className="text-xs font-medium text-[#9A6700] dark:text-[#D29922]">Puncak: {frequency.toFixed(2)} Hz</span>
        </div>
        <div className="h-[190px] w-full">
          <Line data={fftData} options={fftOptions} />
        </div>
        <div className="mt-3 pt-2.5 border-t border-[#E1E4E8] dark:border-[#21262D] flex justify-between text-xs text-[#656D76] dark:text-[#8B949E]">
          <span>Resolusi: Δf = 0.098 Hz</span>
          <span>Hamming Window</span>
        </div>
      </div>

    </section>
  );
}
