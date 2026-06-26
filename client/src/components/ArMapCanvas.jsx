import { Compass } from "lucide-react";
import mapImage from "../images/map_aligned.jpg";

export default function ArMapCanvas({
  userX,
  userY,
  heading,
  motionActive,
  stepCount,
  stallsList,
  selectedStallId,
  pathPoints,
  onMapClick,
  onSelectStall,
}) {
  return (
    <div className="ar-map-body" style={{ flex: 1, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0, background: "#f4f4f5" }}>
      <div className="glass animate-slide-up" style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)", padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, color: "var(--color-text)", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", pointerEvents: "none", zIndex: 10, whiteSpace: "nowrap", maxWidth: "calc(100% - 24px)", overflow: "hidden", textOverflow: "ellipsis" }}>
        Tap a stall to route · tap elsewhere to set your spot
      </div>
      <svg viewBox="0 0 2305 1824" preserveAspectRatio="xMidYMid meet"
        onClick={onMapClick} style={{ width: "100%", height: "100%", cursor: "crosshair", userSelect: "none" }}>
        {/* Authentic market floor plan */}
        <image xlinkHref={mapImage} href={mapImage} x="0" y="0" width="2305" height="1824" preserveAspectRatio="none" />

        {/* Per-stall tap targets + highlight for the selected destination */}
        {stallsList.map(s => {
          if (s.x === 1020 && s.y === 635) return null; // unmapped fallback — skip
          const isDest = s.id === selectedStallId;
          return (
            <g
              key={s.id}
              transform={`translate(${s.x},${s.y})`}
              style={{ cursor: "pointer" }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectStall(s);
              }}
            >
              <rect x="-78" y="-32" width="156" height="64" fill="transparent" />
              {isDest && (
                <>
                  <rect x="-78" y="-32" width="156" height="64" rx="12" fill="rgba(232,98,26,0.28)" stroke="#e8621a" strokeWidth="5">
                    <animate attributeName="stroke-opacity" values="1;0.25;1" dur="1.4s" repeatCount="indefinite" />
                  </rect>
                  <circle cx="0" cy="-32" r="11" fill="#e8621a" stroke="#fff" strokeWidth="3" />
                </>
              )}
            </g>
          );
        })}

        {/* Walking route — white casing + animated orange dotted line */}
        {pathPoints.length > 1 && (
          <g style={{ pointerEvents: "none" }}>
            <polyline points={pathPoints.map(p => `${p.x},${p.y}`).join(" ")}
              fill="none" stroke="#ffffff" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
            <polyline points={pathPoints.map(p => `${p.x},${p.y}`).join(" ")}
              fill="none" stroke="#e8621a" strokeWidth="9" strokeDasharray="1 26" strokeLinecap="round" strokeLinejoin="round">
              <animate attributeName="stroke-dashoffset" from="27" to="0" dur="0.7s" repeatCount="indefinite" />
            </polyline>
          </g>
        )}

        {/* "You are here" marker — heading-aware cone + dot */}
        <g transform={`translate(${userX},${userY})`} style={{ pointerEvents: "none" }}>
          <path d="M0 0 L-70 -120 A140 140 0 0 1 70 -120 Z" fill="rgba(26,92,42,0.22)" transform={`rotate(${heading})`} style={{ transformOrigin: "0px 0px" }} />
          <g transform={`rotate(${heading})`}>
            <circle r="25" fill="var(--color-brand-green)" stroke="var(--color-surface)" strokeWidth="4" />
            <path d="M0 -15 L12 10 L0 4 L-12 10 Z" fill="var(--color-surface)" />
          </g>
        </g>
      </svg>
      <div className="sim-badge" style={{ position: "absolute", bottom: 6, left: 6, background: "var(--color-brand-green)", color: "#fff", fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 999, display: "flex", alignItems: "center", gap: 4, zIndex: 10 }}>
        <Compass size={10} className="animate-spin-slow" />
        <span>{userX}, {userY} | {heading}°{motionActive ? ` | ${stepCount}` : ''}</span>
      </div>
    </div>
  );
}
