<!-- src/components/PalengkeMap.jsx -->
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import PanoramaViewer from './PanoramaViewer';
import './PalengkeMap.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const PalengkeMap = () => {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const [selectedStall, setSelectedStall] = useState(null);

  useEffect(() => {
    if (!MAPBOX_TOKEN) {
      console.error('Mapbox token missing. Add VITE_MAPBOX_TOKEN to .env.local');
      return;
    }
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [120.9822, 14.5995], // default to Manila – replace with palengke center
      zoom: 14,
    });
    mapInstance.current = map;

    // Load stalls GeoJSON
    map.on('load', () => {
      map.addSource('stalls', {
        type: 'geojson',
        data: '/data/palengke_stalls.geojson',
      });
      map.addLayer({
        id: 'stalls-layer',
        type: 'circle',
        source: 'stalls',
        paint: {
          'circle-radius': 8,
          'circle-color': '#ff6b6b',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });
      // Click handling
      map.on('click', 'stalls-layer', (e) => {
        const feature = e.features[0];
        const { stallId, name, image } = feature.properties;
        setSelectedStall({ stallId, name, image });
      });
      // Change cursor on hover
      map.on('mouseenter', 'stalls-layer', () => map.getCanvas().style.cursor = 'pointer');
      map.on('mouseleave', 'stalls-layer', () => map.getCanvas().style.cursor = '');
    });

    return () => map.remove();
  }, []);

  return (
    <div className="palengke-map-wrapper">
      <div ref={mapContainer} className="palengke-map" />
      {selectedStall && (
        <PanoramaViewer
          imageUrl={selectedStall.image}
          stallName={selectedStall.name}
          onClose={() => setSelectedStall(null)}
        />
      )}
    </div>
  );
};

export default PalengkeMap;
