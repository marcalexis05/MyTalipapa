import { useEffect, useRef, useState } from "react";
import { X, Keyboard, Zap, ZapOff, QrCode, Loader2 } from "lucide-react";

/**
 * Self-contained QR scanner overlay for the MyTalipapa AR finder.
 *
 * Decoding strategy (universal coverage):
 *   1. Native `BarcodeDetector` API  → fast, used on Chrome / Android / Edge.
 *   2. `jsqr` fallback (dynamic import) → covers iOS Safari & Firefox, which
 *      do not implement BarcodeDetector.
 *   3. Manual code entry → if the camera is blocked or unavailable.
 *
 * Props:
 *   onDetected(text) — fired exactly once with the raw decoded string.
 *   onClose()        — fired when the user dismisses the scanner.
 */
export default function QrScanner({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const detectorRef = useRef(null);
  const jsQRRef = useRef(null);
  const lastScanRef = useRef(0);
  const detectedRef = useRef(false);

  const [status, setStatus] = useState("starting"); // starting | scanning | error
  const [errorMsg, setErrorMsg] = useState("");
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualValue, setManualValue] = useState("");

  const stopAll = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  // Emit the decoded value exactly once, then tear down the camera.
  const emit = (text) => {
    if (detectedRef.current || !text) return;
    detectedRef.current = true;
    if (navigator.vibrate) {
      try { navigator.vibrate(60); } catch { /* noop */ }
    }
    stopAll();
    onDetected(String(text));
  };

  useEffect(() => {
    let cancelled = false;

    const setupDecoder = async () => {
      // Prefer the native detector when it actually supports QR.
      if ("BarcodeDetector" in window) {
        try {
          const formats = await window.BarcodeDetector.getSupportedFormats?.();
          if (!formats || formats.includes("qr_code")) {
            detectorRef.current = new window.BarcodeDetector({ formats: ["qr_code"] });
            return;
          }
        } catch { /* fall through to jsQR */ }
      }
      try {
        const mod = await import("jsqr");
        jsQRRef.current = mod.default || mod;
      } catch {
        // No decoder available — manual entry still works.
      }
    };

    const scanLoop = () => {
      rafRef.current = requestAnimationFrame(scanLoop);
      const now = performance.now();
      if (now - lastScanRef.current < 180) return; // throttle ~5.5 fps
      lastScanRef.current = now;

      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      // Native detector path.
      if (detectorRef.current) {
        detectorRef.current
          .detect(video)
          .then((codes) => {
            if (codes && codes.length && codes[0].rawValue) emit(codes[0].rawValue);
          })
          .catch(() => { /* transient detect errors are non-fatal */ });
        return;
      }

      // jsQR fallback path — sample a downscaled frame for speed.
      if (jsQRRef.current) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const w = video.videoWidth, h = video.videoHeight;
        if (!w || !h) return;
        const scale = Math.min(1, 640 / Math.max(w, h));
        const cw = Math.round(w * scale), ch = Math.round(h * scale);
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(video, 0, 0, cw, ch);
        const img = ctx.getImageData(0, 0, cw, ch);
        const code = jsQRRef.current(img.data, cw, ch, { inversionAttempts: "dontInvert" });
        if (code && code.data) emit(code.data);
      }
    };

    const start = async () => {
      await setupDecoder();
      if (cancelled) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        const track = stream.getVideoTracks()[0];
        const caps = track?.getCapabilities?.();
        if (caps && caps.torch) setTorchSupported(true);
        setStatus("scanning");
        scanLoop();
      } catch (e) {
        setErrorMsg(
          e?.name === "NotAllowedError"
            ? "Camera permission denied. Enter the stall code manually below."
            : "Camera unavailable. Enter the stall code manually below."
        );
        setStatus("error");
        setManualOpen(true);
      }
    };

    start();
    return () => { cancelled = true; stopAll(); };
  }, []);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks?.()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn((v) => !v);
    } catch { /* torch not toggleable */ }
  };

  const handleClose = () => { stopAll(); onClose(); };
  const submitManual = () => emit(manualValue.trim());

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "#000", display: "flex", flexDirection: "column",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <style>{`
        @keyframes qrScanMove { 0% { top: 4%; } 50% { top: 96%; } 100% { top: 4%; } }
        @keyframes qrSpin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
        .qr-icon-btn {
          width: 40px; height: 40px; border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.12); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #fff; transition: background 0.15s, transform 0.1s;
        }
        .qr-icon-btn:active { transform: scale(0.92); }
        .qr-icon-btn.on { background: #e8621a; border-color: #e8621a; }
      `}</style>

      {/* Live camera feed */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Dim vignette */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, transparent 38%, rgba(0,0,0,0.55) 78%)", pointerEvents: "none" }} />

      {/* Top bar */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px" }}>
        <button onClick={handleClose} className="qr-icon-btn"><X size={18} /></button>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#fff", fontWeight: 800, fontSize: 13 }}>
          <QrCode size={16} color="#e8621a" /> Scan Stall QR
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {torchSupported && (
            <button onClick={toggleTorch} className={`qr-icon-btn${torchOn ? " on" : ""}`}>
              {torchOn ? <Zap size={17} /> : <ZapOff size={17} />}
            </button>
          )}
          <button onClick={() => setManualOpen((v) => !v)} className={`qr-icon-btn${manualOpen ? " on" : ""}`}>
            <Keyboard size={17} />
          </button>
        </div>
      </div>

      {/* Reticle */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
        <div style={{ position: "relative", width: "min(68vw, 300px)", aspectRatio: "1 / 1" }}>
          {[
            { top: 0, left: 0, borders: "borderTop borderLeft" },
            { top: 0, right: 0, borders: "borderTop borderRight" },
            { bottom: 0, left: 0, borders: "borderBottom borderLeft" },
            { bottom: 0, right: 0, borders: "borderBottom borderRight" },
          ].map((c, i) => (
            <div key={i} style={{
              position: "absolute", width: 34, height: 34,
              top: c.top, bottom: c.bottom, left: c.left, right: c.right,
              borderTop: c.borders.includes("borderTop") ? "4px solid #e8621a" : "none",
              borderBottom: c.borders.includes("borderBottom") ? "4px solid #e8621a" : "none",
              borderLeft: c.borders.includes("borderLeft") ? "4px solid #e8621a" : "none",
              borderRight: c.borders.includes("borderRight") ? "4px solid #e8621a" : "none",
              borderRadius: 6,
            }} />
          ))}
          {status === "scanning" && (
            <div style={{ position: "absolute", left: "4%", right: "4%", height: 2, background: "linear-gradient(90deg, transparent, #e8621a, transparent)", boxShadow: "0 0 12px 2px rgba(232,98,26,0.7)", animation: "qrScanMove 2.4s ease-in-out infinite" }} />
          )}
        </div>
      </div>

      {/* Status / instructions */}
      <div style={{ position: "absolute", bottom: manualOpen ? 200 : 70, left: 0, right: 0, zIndex: 2, textAlign: "center", padding: "0 24px", pointerEvents: "none" }}>
        {status === "starting" && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#fff", fontSize: 13, fontWeight: 700, background: "rgba(0,0,0,0.5)", padding: "8px 14px", borderRadius: 999 }}>
            <Loader2 size={15} style={{ animation: "qrSpin 1s linear infinite" }} /> Starting camera…
          </div>
        )}
        {status === "scanning" && (
          <div style={{ color: "rgba(255,255,255,0.92)", fontSize: 13, fontWeight: 700, textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
            Point at the QR code on a stall or entrance
          </div>
        )}
        {status === "error" && (
          <div style={{ color: "#fca5a5", fontSize: 13, fontWeight: 700, textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
            {errorMsg}
          </div>
        )}
      </div>

      {/* Manual entry panel */}
      {manualOpen && (
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 3, background: "rgba(10,15,10,0.97)", borderTop: "1px solid rgba(255,255,255,0.12)", borderRadius: "16px 16px 0 0", padding: "16px 16px 22px" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Enter stall code</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={manualValue}
              onChange={(e) => setManualValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submitManual(); }}
              placeholder='e.g. "meat-11" or "MTP:STALL:fish-21"'
              autoFocus
              style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.07)", color: "#fff", fontSize: 13, outline: "none" }}
            />
            <button onClick={submitManual} style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: "#e8621a", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
              Go
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
