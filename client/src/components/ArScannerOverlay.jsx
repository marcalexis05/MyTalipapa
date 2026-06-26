import QrScanner from "./QrScanner";

export default function ArScannerOverlay({ showScanner, onScan, onClose }) {
  if (!showScanner) return null;

  return (
    <div className="scanner-overlay glass animate-slide-up" style={{
      position: "absolute", inset: 0,
      zIndex: 50, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "flex-start",
      padding: 16, overflowY: "auto",
      WebkitOverflowScrolling: "touch"
    }}>
      <div style={{
        position: "relative", width: "100%", maxWidth: 400,
        background: "#0f172a", borderRadius: 24, overflow: "hidden",
        boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
      }}>
        <QrScanner onScan={onScan} onClose={onClose} />
      </div>
    </div>
  );
}
