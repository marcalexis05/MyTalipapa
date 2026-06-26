import { useState, useRef, useEffect } from 'react';

export function useGeolocation({ userX, userY, setUserX, setUserY, setToastMsg }) {
  const [gpsActive, setGpsActive] = useState(false);
  const gpsWatchIdRef = useRef(null);
  const gpsAnchorRef = useRef(null);

  const toggleGps = () => {
    if (gpsActive) {
      if (gpsWatchIdRef.current !== null) { 
        navigator.geolocation.clearWatch(gpsWatchIdRef.current); 
        gpsWatchIdRef.current = null; 
      }
      gpsAnchorRef.current = null;
      setGpsActive(false);
      if (setToastMsg) setToastMsg("GPS tracking disabled.");
    } else {
      if (!navigator.geolocation) { 
        alert("Geolocation is not supported by your browser."); 
        return; 
      }
      if (setToastMsg) setToastMsg("Activating GPS. Please allow location access...");
      gpsAnchorRef.current = null;
      gpsWatchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          if (!gpsAnchorRef.current) {
            gpsAnchorRef.current = { lat: latitude, lng: longitude, mapX: userX, mapY: userY };
            if (setToastMsg) setToastMsg(`GPS active (Accuracy: ${Math.round(accuracy)}m). Anchored.`);
          } else {
            const latDiff = latitude - gpsAnchorRef.current.lat;
            const lngDiff = longitude - gpsAnchorRef.current.lng;
            const dyMeters = latDiff * 111139;
            const dxMeters = lngDiff * 111139 * Math.cos(gpsAnchorRef.current.lat * Math.PI / 180);
            const scale = 50;
            const newX = Math.round(gpsAnchorRef.current.mapX + dxMeters * scale);
            const newY = Math.round(gpsAnchorRef.current.mapY + (-dyMeters * scale));
            setUserX(Math.max(30, Math.min(2270, newX)));
            setUserY(Math.max(30, Math.min(1790, newY)));
          }
          setGpsActive(true);
        },
        (err) => {
          console.error("GPS error:", err);
          if (setToastMsg) setToastMsg(`GPS tracking failed: ${err.message}`);
          if (gpsWatchIdRef.current !== null) { 
            navigator.geolocation.clearWatch(gpsWatchIdRef.current); 
            gpsWatchIdRef.current = null; 
          }
          setGpsActive(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  };

  useEffect(() => {
    return () => { 
      if (gpsWatchIdRef.current !== null) navigator.geolocation.clearWatch(gpsWatchIdRef.current); 
    };
  }, []);

  return {
    gpsActive,
    toggleGps,
    gpsAnchorRef
  };
}
