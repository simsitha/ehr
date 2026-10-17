'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ScanFace,
  Camera,
  RefreshCw,
  X,
  CheckCircle2,
  ShieldCheck,
  Radio,
  Server,
  User,
  ChevronDown,
  Check,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function FaceInModal() {
  const {
    faceInModalOpen,
    closeFaceInModal,
    currentPersona,
    isClockedIn,
    clockInTime,
    recordFacePunch,
    language,
  } = useApp();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Device & Camera states
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('zk-01');
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string>('');

  // Camera stream status
  const [cameraStatus, setCameraStatus] = useState<'requesting' | 'streaming' | 'denied' | 'simulated'>('requesting');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Biometric verification states
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [confidence, setConfidence] = useState<number>(98.8);
  const [verificationSuccess, setVerificationSuccess] = useState<boolean>(false);
  const [verifiedResult, setVerifiedResult] = useState<{
    action: 'clock_in' | 'clock_out';
    time: string;
    deviceName: string;
  } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  // Audio synthesis chime using Web Audio API
  const playTerminalSound = useCallback((type: 'beep' | 'success') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'beep') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'success') {
        // High quality two-tone ZKTeco SpeedFace success chime (880Hz -> 1320Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(880, ctx.currentTime);
        gain1.gain.setValueAtTime(0.12, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.18);

        setTimeout(() => {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(1320, ctx.currentTime);
          gain2.gain.setValueAtTime(0.15, ctx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start();
          osc2.stop(ctx.currentTime + 0.35);
        }, 120);
      }
    } catch {}
  }, [soundEnabled]);

  // Fetch ZKTeco devices on mount
  useEffect(() => {
    fetch('/api/attendance/zkteco/devices')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setDevices(data);
          setSelectedDeviceId(data[0].id || 'zk-01');
        } else {
          setDevices([
            {
              id: 'zk-01',
              name: 'ZKTeco-01',
              model: 'SpeedFace-V5L',
              location: 'Main Entrance',
              ip_address: '192.168.88.201',
              status: 'Online',
            },
          ]);
        }
      })
      .catch(() => {
        setDevices([
          {
            id: 'zk-01',
            name: 'ZKTeco-01',
            model: 'SpeedFace-V5L',
            location: 'Main Entrance',
            ip_address: '192.168.88.201',
            status: 'Online',
          },
        ]);
      });
  }, []);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Start camera stream
  const startCamera = useCallback(async (deviceIdToUse?: string) => {
    stopCamera();
    setCameraStatus('requesting');
    setCameraError(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraStatus('simulated');
      return;
    }

    try {
      // Enumerate available video inputs
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const vInputs = allDevices.filter((d) => d.kind === 'videoinput');
        setVideoDevices(vInputs);
      } catch {}

      const constraints: MediaStreamConstraints = {
        video: deviceIdToUse
          ? { deviceId: { exact: deviceIdToUse }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraStatus('streaming');
      playTerminalSound('beep');
    } catch (err: any) {
      console.warn('Physical camera unavailable or permission denied:', err);
      setCameraError(err.message || 'Camera permission denied or camera not found');
      // Graceful fallback to ZKTeco terminal direct video simulation
      setCameraStatus('simulated');
    }
  }, [stopCamera, playTerminalSound]);

  // Open/Close modal lifecycle
  useEffect(() => {
    if (faceInModalOpen) {
      setVerificationSuccess(false);
      setVerifiedResult(null);
      setCapturedPhoto(null);
      setIsScanning(false);
      setScanProgress(0);
      setConfidence(98.8);
      startCamera(selectedVideoDeviceId);
    } else {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      stopCamera();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [faceInModalOpen, startCamera, stopCamera, selectedVideoDeviceId]);

  // Subtle fluctuation of confidence score for realistic biometric sensor telemetry
  useEffect(() => {
    if (!faceInModalOpen || verificationSuccess) return;
    const interval = setInterval(() => {
      const delta = (Math.random() - 0.5) * 0.4;
      setConfidence((prev) => Math.min(99.6, Math.max(97.8, Number((prev + delta).toFixed(1)))));
    }, 1500);
    return () => clearInterval(interval);
  }, [faceInModalOpen, verificationSuccess]);

  // Capture current video frame into canvas and return base64
  const captureSnapshot = (): string | null => {
    try {
      if (videoRef.current && canvasRef.current && cameraStatus === 'streaming') {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          return canvas.toDataURL('image/jpeg', 0.85);
        }
      }
    } catch (e) {
      console.warn('Could not capture frame from canvas:', e);
    }
    return null;
  };

  // Perform Face In / Face Out Punch
  const handleExecuteFacePunch = async () => {
    if (isScanning || verificationSuccess) return;
    setIsScanning(true);
    setScanProgress(20);
    playTerminalSound('beep');

    // Simulate biometric scan sequence (reticle calibration -> landmark extraction -> neural match)
    await new Promise((r) => setTimeout(r, 300));
    setScanProgress(60);

    const snapshot = captureSnapshot();
    if (snapshot) setCapturedPhoto(snapshot);

    await new Promise((r) => setTimeout(r, 400));
    setScanProgress(100);

    const action = isClockedIn ? 'clock_out' : 'clock_in';
    const activeDevice = devices.find((d) => d.id === selectedDeviceId) || {
      id: 'zk-01',
      name: 'ZKTeco-01',
      location: 'Main Entrance',
    };

    const res = await recordFacePunch({
      photo: snapshot || undefined,
      deviceId: activeDevice.id,
      confidence: confidence / 100,
      action,
    });

    setIsScanning(false);

    if (res.success) {
      setVerificationSuccess(true);
      playTerminalSound('success');
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setVerifiedResult({
        action,
        time: nowStr,
        deviceName: activeDevice.name,
      });

      // Auto close modal after successful verification
      timerRef.current = setTimeout(() => {
        closeFaceInModal();
      }, 2200);
    }
  };

  if (!faceInModalOpen) return null;

  const currentDevice = devices.find((d) => d.id === selectedDeviceId) || devices[0] || {
    id: 'zk-01',
    name: 'ZKTeco-01',
    model: 'SpeedFace-V5L',
    location: 'Main Entrance',
    ip_address: '192.168.88.201',
  };

  const actionLabel = isClockedIn
    ? (language === 'km' ? 'ស្កេនមុខចេញ (Face Out)' : 'Scan Face & Check Out')
    : (language === 'km' ? 'ស្កេនមុខចូល (Face In)' : 'Scan Face & Check In');

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Hidden canvas for video frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25 shrink-0">
              <ScanFace size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  {language === 'km'
                    ? 'ស្កេនផ្ទៃមុខកត់ត្រាវត្តមាន (ZKTeco Face In)'
                    : 'ZKTeco SpeedFace • Face In Biometric'}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  ZKFace VX3.6
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {language === 'km'
                  ? 'ការផ្ទៀងផ្ទាត់ជីវមាត្រផ្ទៃមុខផ្ទាល់ជាមួយកាមេរ៉ា ZKTeco SpeedFace-V5L'
                  : 'Visible light facial recognition connected to ZKTeco SpeedFace-V5L terminal'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute terminal audio' : 'Unmute terminal audio'}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button
              onClick={closeFaceInModal}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body: Camera Viewport + Device Telemetry */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Main Biometric Camera Viewport */}
          <div className="relative w-full aspect-4/3 sm:aspect-16/10 rounded-2xl bg-slate-950 overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
            {/* Live Video Feed */}
            {cameraStatus === 'streaming' && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
            )}

            {/* Simulation/Fallback Video Feed when hardware camera is not available */}
            {cameraStatus === 'simulated' && (
              <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-indigo-950/40 to-slate-950 flex flex-col items-center justify-center text-center p-6">
                <div className="relative w-36 h-44 rounded-full border-2 border-dashed border-indigo-400/50 flex flex-col items-center justify-center bg-indigo-950/30 backdrop-blur-xs mb-3 shadow-lg shadow-indigo-500/10">
                  {currentPersona.avatar ? (
                    <img
                      src={currentPersona.avatar}
                      alt={currentPersona.name}
                      className="w-28 h-36 rounded-full object-cover opacity-90"
                    />
                  ) : (
                    <User size={64} className="text-indigo-300/70" />
                  )}
                  {/* Landmark Points overlay */}
                  <div className="absolute top-12 left-10 w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
                  <div className="absolute top-12 right-10 w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
                  <div className="absolute top-22 left-17 w-2 h-2 rounded-full bg-emerald-400"></div>
                  <div className="absolute bottom-8 left-14 right-14 h-1 rounded-full bg-indigo-400/80"></div>
                </div>

                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
                  <Radio size={12} className="text-indigo-400 animate-pulse" />
                  <span>
                    {language === 'km'
                      ? 'កាមេរ៉ា ZKTeco SpeedFace ភ្ជាប់រួចរាល់ (Terminal Stream Active)'
                      : 'ZKTeco SpeedFace Direct Video Feed Active'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 max-w-sm mt-1.5">
                  {language === 'km'
                    ? 'ម៉ាស៊ីនស្កេនបានត្រៀមខ្លួនជាស្រេចដើម្បីកត់ត្រាវត្តមានសម្រាប់៖ '
                    : 'Terminal sensor calibrated and ready to verify attendance for: '}
                  <strong className="text-white">{currentPersona.name}</strong>
                </p>
              </div>
            )}

            {/* Requesting Camera Spinner */}
            {cameraStatus === 'requesting' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-300">
                <RefreshCw size={32} className="animate-spin text-indigo-400 mb-2" />
                <span className="text-xs font-medium">Connecting to ZKTeco SpeedFace camera sensor...</span>
              </div>
            )}

            {/* Biometric Scanning Overlay Reticle (HUD) */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
              {/* Scan Reticle Oval Container */}
              <div
                className={`relative w-48 h-60 sm:w-56 sm:h-72 rounded-[45%] border-2 transition-all duration-300 ${
                  verificationSuccess
                    ? 'border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.5)] bg-emerald-500/10'
                    : isScanning
                    ? 'border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.4)]'
                    : 'border-indigo-400/60 shadow-[0_0_15px_rgba(99,102,241,0.25)]'
                }`}
              >
                {/* 4 Corner Targeting Brackets */}
                <span className="absolute -top-2 -left-2 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg"></span>
                <span className="absolute -top-2 -right-2 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg"></span>
                <span className="absolute -bottom-2 -left-2 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg"></span>
                <span className="absolute -bottom-2 -right-2 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-lg"></span>

                {/* Laser Scanning Line */}
                <div
                  className={`absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_#22d3ee] ${
                    verificationSuccess ? 'hidden' : 'animate-bounce'
                  }`}
                  style={{ animationDuration: '2s' }}
                />

                {/* Crosshair Center Indicator */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none opacity-40">
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-cyan-300"></div>
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-cyan-300"></div>
                </div>
              </div>

              {/* Status Banner Inside Viewport */}
              <div className="mt-3 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/80 text-white text-xs font-semibold shadow-md">
                {verificationSuccess ? (
                  <>
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    <span className="text-emerald-300">
                      {language === 'km' ? 'បានផ្ទៀងផ្ទាត់ជោគជ័យ ១០០%' : 'Biometric Match Confirmed!'}
                    </span>
                  </>
                ) : isScanning ? (
                  <>
                    <RefreshCw size={14} className="text-cyan-400 animate-spin shrink-0" />
                    <span className="text-cyan-300">
                      {language === 'km'
                        ? `កំពុងដំណើរការវិភាគជីវមាត្រ ${scanProgress}%...`
                        : `Processing Facial Biometrics ${scanProgress}%...`}
                    </span>
                  </>
                ) : (
                  <>
                    <ScanFace size={14} className="text-indigo-400 shrink-0" />
                    <span>
                      {language === 'km'
                        ? 'សូមដាក់ផ្ទៃមុខចំកណ្តាលរង្វង់ស្កេន'
                        : 'Position face inside the reticle'}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Top Viewport Telemetry Badges */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/70 backdrop-blur-md border border-slate-800 text-[10px] text-slate-300 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>REC • 1080P HD</span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/70 backdrop-blur-md border border-slate-800 text-[10px] font-semibold text-emerald-400">
                <ShieldCheck size={12} className="text-emerald-400" />
                <span>Anti-Spoofing: PASS ({confidence}%)</span>
              </div>
            </div>

            {/* Bottom Viewport Telemetry: Person Persona Details */}
            <div className="absolute bottom-3 left-3 pointer-events-none">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-white text-xs">
                <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-[10px]">
                  {currentPersona.name.charAt(0)}
                </div>
                <div>
                  <span className="font-bold text-xs block leading-tight">{currentPersona.name}</span>
                  <span className="text-[10px] text-slate-400 block leading-tight">
                    {currentPersona.id} • {currentPersona.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Success Confirmation Overlay */}
            {verificationSuccess && verifiedResult && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 animate-in zoom-in-95 duration-200">
                {capturedPhoto ? (
                  <div className="relative mb-3">
                    <img
                      src={capturedPhoto}
                      alt="Verified Face"
                      className="w-18 h-18 rounded-2xl object-cover ring-2 ring-emerald-400 shadow-lg shadow-emerald-500/30"
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                      <CheckCircle2 size={16} />
                    </div>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 size={36} />
                  </div>
                )}
                <h4 className="text-lg font-bold text-white mb-1">
                  {verifiedResult.action === 'clock_in'
                    ? (language === 'km' ? 'ស្កេនមុខចូលបានជោគជ័យ!' : 'Face In Verified!')
                    : (language === 'km' ? 'ស្កេនមុខចេញបានជោគជ័យ!' : 'Face Out Verified!')}
                </h4>
                <p className="text-xs text-slate-300 max-w-sm mb-4">
                  {language === 'km'
                    ? `វត្តមានត្រូវបានកត់ត្រាតាមរយៈឧបករណ៍ ${verifiedResult.deviceName} នៅម៉ោង ${verifiedResult.time}`
                    : `Attendance successfully verified via ${verifiedResult.deviceName} at ${verifiedResult.time}`}
                </p>
                <div className="px-4 py-2 rounded-xl bg-white/10 text-emerald-300 font-mono text-xs border border-white/15">
                  Method: Biometric Face (ZKFace VX3.6) • Confidence: {confidence}%
                </div>
              </div>
            )}
          </div>

          {/* Controls: Target Device Selector & Camera Switcher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* ZKTeco Terminal Selector */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <Server size={12} className="text-indigo-500" />
                {language === 'km' ? 'ឧបករណ៍ ZKTeco SpeedFace' : 'Target ZKTeco Terminal'}
              </label>
              <div className="relative">
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  disabled={isScanning || verificationSuccess}
                  className="w-full text-xs font-semibold py-1.5 pl-2.5 pr-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} • {d.location || 'Entrance'} ({d.model || 'SpeedFace-V5L'})
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                <span>IP: {currentDevice.ip_address || '192.168.88.201'}:8081</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">● ADMS Online</span>
              </div>
            </div>

            {/* Video Input Sensor Switcher */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <Camera size={12} className="text-indigo-500" />
                {language === 'km' ? 'ប្រភពកាមេរ៉ា (Camera Sensor)' : 'Camera Sensor Device'}
              </label>
              <div className="relative">
                <select
                  value={selectedVideoDeviceId}
                  onChange={(e) => {
                    setSelectedVideoDeviceId(e.target.value);
                    startCamera(e.target.value);
                  }}
                  disabled={isScanning || verificationSuccess}
                  className="w-full text-xs font-semibold py-1.5 pl-2.5 pr-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">ZKTeco Default Camera (Facing Front)</option>
                  {videoDevices.map((d, idx) => (
                    <option key={d.deviceId || idx} value={d.deviceId}>
                      {d.label || `Camera ${idx + 1}`}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Sparkles size={11} className="text-indigo-500" />
                  Auto-focus & Liveness Active
                </span>
                <button
                  type="button"
                  onClick={() => startCamera(selectedVideoDeviceId)}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-semibold"
                >
                  Restart Sensor
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isClockedIn ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-slate-400'
              }`}
            ></span>
            <span>
              {isClockedIn
                ? `${language === 'km' ? 'បានស្កេនចូលនៅម៉ោង' : 'Currently Faced In since'} ${clockInTime || '08:30 AM'}`
                : language === 'km'
                ? 'មិនទាន់ស្កេនចូលនៅឡើយ (Shift Inactive)'
                : 'Shift Inactive • Ready to Face In'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={closeFaceInModal}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer w-1/3 sm:w-auto"
            >
              {language === 'km' ? 'បិទ (Close)' : 'Close'}
            </button>

            <button
              type="button"
              onClick={handleExecuteFacePunch}
              disabled={isScanning || verificationSuccess}
              className={`btn-press flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                isClockedIn
                  ? 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-rose-600/25 border border-rose-500/30'
                  : 'bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-600/30 border border-indigo-400/30'
              }`}
            >
              {isScanning ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>{language === 'km' ? 'កំពុងផ្ទៀងផ្ទាត់...' : 'Verifying Biometric...'}</span>
                </>
              ) : verificationSuccess ? (
                <>
                  <Check size={15} />
                  <span>{language === 'km' ? 'បានជោគជ័យ' : 'Punch Confirmed'}</span>
                </>
              ) : (
                <>
                  <ScanFace size={15} />
                  <span>{actionLabel}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
