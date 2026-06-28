// src/components/PanoramaViewer.jsx
import React, { useEffect, useRef } from 'react';
import * as PANOLENS from 'panolens';
import './PanoramaViewer.css';

const PanoramaViewer = ({ imageUrl, stallName, onClose }) => {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);

  useEffect(() => {
    if (!imageUrl) return;
    const panorama = new PANOLENS.ImagePanorama(imageUrl);
    const viewer = new PANOLENS.Viewer({
      container: containerRef.current,
      output: 'panolens',
      controlBar: false,
      autoRotate: false,
      cameraFov: 75,
    });
    viewer.add(panorama);
    viewerRef.current = viewer;
    // Cleanup on unmount
    return () => {
      viewer.dispose();
    };
  }, [imageUrl]);

  return (
    <div className="panorama-modal">
      <div className="panorama-header">
        <h3>{stallName}</h3>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>
      <div ref={containerRef} className="panorama-container" />
    </div>
  );
};

export default PanoramaViewer;
