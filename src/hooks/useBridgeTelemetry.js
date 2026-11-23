import { useState, useEffect, useRef, useCallback } from 'react';

const F_BASELINE = 4.88;

export function useBridgeTelemetry() {
  const [appMode, setAppMode] = useState('sim'); // 'sim' or 'live'
  const [scenario, setScenarioState] = useState('baseline');
  const [scope, setScopeState] = useState('lab');
  const [deformScale, setDeformScale] = useState(5);
  const [isMuted, setIsMuted] = useState(false);
  const [logs, setLogs] = useState([
    { id: 1, text: 'Sistem SHMS diinisialisasi. Baseline f₀ = 4.88 Hz', time: '00:00:01' }
  ]);

  const [payload, setPayload] = useState({
    frequency: 4.88,
    damage_index: 0.0,
    deflection: 0.85,
    load_ton: 0.00,
    vibration: 0.28,
    pitch: 0.12,
    roll: 0.08,
    status: 'NORMAL',
    alarm: false
  });

  const [vibrationHistory, setVibrationHistory] = useState(Array(30).fill(0.28));

  // Audio Context ref
  const audioCtxRef = useRef(null);

  const playBeep = useCallback((freq = 880, duration = 0.2) => {
    if (isMuted) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio context might need user gesture
    }
  }, [isMuted]);

  // Clean up AudioContext on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const addLog = useCallback((text) => {
    const time = new Date().toLocaleTimeString('id-ID');
    setLogs(prev => [{ id: Date.now(), text, time }, ...prev.slice(0, 24)]);
  }, []);

  const setScenario = useCallback((scen) => {
    setScenarioState(scen);
    if (scen === 'baseline') addLog('Skenario 1: Baseline (Tanpa Beban)');
    else if (scen === 'light') addLog('Skenario 2: Beban Ringan 0.45 Ton');
    else if (scen === 'testload') addLog('Skenario 3: Uji Beban Target 1.70 Ton (Lendutan rencana 4.998 mm)');
    else if (scen === 'danger') addLog('Skenario 4: Overload > 2.40 Ton (Bahaya Kerusakan Struktur)');
  }, [addLog]);

  const setBridgeScope = useCallback((s) => {
    setScopeState(s);
    addLog(s === 'lab' ? 'Mode: Maket Lab 2.500 mm' : 'Mode: Jembatan 120 m');
  }, [addLog]);

  const toggleSound = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  // Optimized Simulation / Live Loop (Relaxed to 600ms, paused when tab is hidden)
  useEffect(() => {
    let interval = null;

    const runTick = () => {
      if (appMode === 'sim') {
        let freq = 4.88;
        let def = 0.85;
        let load = 0.0;
        let vib = 0.28;
        let pitch = 0.12;
        let status = 'NORMAL';
        let isAlarm = false;

        if (scenario === 'baseline') {
          freq = 4.88 + (Math.random() - 0.5) * 0.04;
          def = 0.82 + Math.random() * 0.08;
          load = 0.00;
          vib = 0.22 + Math.random() * 0.12;
          pitch = 0.10 + (Math.random() - 0.5) * 0.05;
          status = 'NORMAL';
        } else if (scenario === 'light') {
          freq = 4.82 + (Math.random() - 0.5) * 0.06;
          def = 2.05 + Math.random() * 0.18;
          load = 0.45 + (Math.random() - 0.5) * 0.05;
          vib = 0.40 + Math.random() * 0.15;
          pitch = 0.35 + (Math.random() - 0.5) * 0.08;
          status = 'NORMAL';
        } else if (scenario === 'testload') {
          freq = 4.55 + (Math.random() - 0.5) * 0.08;
          def = 4.99 + (Math.random() - 0.5) * 0.08;
          load = 1.70 + (Math.random() - 0.5) * 0.04;
          vib = 1.35 + Math.random() * 0.35;
          pitch = 1.65 + (Math.random() - 0.5) * 0.15;
          status = 'WARNING';
        } else if (scenario === 'danger') {
          freq = 3.85 + (Math.random() - 0.5) * 0.12;
          def = 8.60 + Math.random() * 0.45;
          load = 2.55 + Math.random() * 0.15;
          vib = 2.85 + Math.random() * 0.85;
          pitch = 4.80 + (Math.random() - 0.5) * 0.60;
          status = 'DANGER';
          isAlarm = true;
          playBeep(940, 0.18);
        }

        const damage = Math.max(0, ((F_BASELINE - freq) / F_BASELINE) * 100);

        const newPayload = {
          frequency: parseFloat(freq.toFixed(2)),
          damage_index: parseFloat(damage.toFixed(1)),
          deflection: parseFloat(def.toFixed(2)),
          load_ton: parseFloat(load.toFixed(2)),
          vibration: parseFloat(vib.toFixed(2)),
          pitch: parseFloat(pitch.toFixed(2)),
          roll: parseFloat((pitch * 0.4).toFixed(2)),
          status,
          alarm: isAlarm
        };

        setPayload(newPayload);
        setVibrationHistory(prev => [...prev.slice(1), newPayload.vibration]);
      } else {
        // Polling from api.php
        fetch('../api.php')
          .then(res => res.json())
          .then(json => {
            if (json.success && json.data) {
              setPayload(json.data);
              setVibrationHistory(prev => [...prev.slice(1), json.data.vibration]);
              if (json.data.alarm) playBeep(940, 0.18);
            }
          })
          .catch(() => {});
      }
    };

    const startTimer = () => {
      if (!interval) {
        interval = setInterval(runTick, 600);
      }
    };

    const stopTimer = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        stopTimer();
      } else {
        startTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    startTimer();

    return () => {
      stopTimer();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [appMode, scenario, playBeep]);

  // Export CSV
  const exportLogsCSV = useCallback(() => {
    const header = "Timestamp,Team,BridgeType,Status,Frequency_fn(Hz),Damage_D(%),Deflection(mm),Load(Ton),Vibration_RMS(m/s2),Pitch(deg)\n";
    const now = new Date().toISOString();
    const row = `${now},TIM 25,Through Tied Arch Parker-Warren,${payload.status},${payload.frequency},${payload.damage_index},${payload.deflection},${payload.load_ton},${payload.vibration},${payload.pitch}\n`;
    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + header + row);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ASETU_SHMS_Log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addLog("Log telemetri diekspor ke CSV.");
  }, [payload, addLog]);

  return {
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
  };
}
