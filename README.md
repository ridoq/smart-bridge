# BRIMON SHMS — React Application

Aplikasi Structural Health Monitoring System (SHMS) berbasis **React 18 + Vite + Tailwind CSS + Three.js + Chart.js** untuk **TIM 25 – AKRAL CATURA (IBDC 2027)**.

## 🚀 Cara Menjalankan

### Cara 1: Menggunakan Terminal
1. Buka PowerShell / Command Prompt / Terminal VS Code di folder ini (`R:\laragon\www\smart-bridge`).
2. Jalankan development server:
   ```bash
   npm run dev
   ```
3. Buka peramban di: **`http://localhost:5173`**

### Cara 2: 1-Klik via File Batch
Cukup klik dua kali berkas:
👉 `start-react.bat`

---

## 📁 Struktur Komponen
- `src/hooks/useBridgeTelemetry.js` : Hook reaktif pengelola data sensor, skenario pengujian, dan alarm audio.
- `src/components/Header.jsx` : Navigasi atas, kontrol audio, status, dan pemilih cakupan.
- `src/components/Sidebar.jsx` : Menu navigasi off-canvas yang dapat disembunyikan (*hide*).
- `src/components/MetricsGrid.jsx` : 4 kartu metrik utama (frekuensi, lendutan, beban uji, getaran) tipografi sans-serif bersih.
- `src/components/Bridge3DViewer.jsx` : Engine Three.js WebGL jembatan Through Tied Arch Parker-Warren dengan simulasi lendutan riil.
- `src/components/TelemetryCharts.jsx` : Grafik domain waktu (getaran) dan domain frekuensi (FFT puncak 4.88 Hz).
- `src/components/ScenarioSection.jsx` : 4 tombol pengujian untuk demo juri dan kartu status EWS.
- `src/components/Modals.jsx` : Jendela modal spesifikasi jembatan, standar Pt T-05-2002-B, dan ekspor CSV.
