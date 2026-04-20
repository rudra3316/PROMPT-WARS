import React, { useEffect, useRef, useState } from 'react';

const MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
];

const HeatMap = ({ coordinates, zones }) => {
  const mapRef = useRef(null);
  const [mapObj, setMapObj] = useState(null);
  const [heatmapLayer, setHeatmapLayer] = useState(null);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey) return;

    const loadGoogleMapsAPI = () => {
      const existingScript = document.getElementById('googleMapsApi');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=visualization`;
        script.id = 'googleMapsApi';
        script.async = true;
        script.defer = true;
        script.onload = initMap;
        document.body.appendChild(script);
      } else if (window.google && window.google.maps) {
        initMap();
      }
    };

    const initMap = () => {
      if (!mapRef.current) return;
      const initialMap = new window.google.maps.Map(mapRef.current, {
        center: { lat: 12.9716, lng: 77.5946 }, // Center of fictional venue context
        zoom: 17,
        styles: MAP_STYLES,
        disableDefaultUI: true,
        zoomControl: true,
      });

      const initialHeatmap = new window.google.maps.visualization.HeatmapLayer({
        data: [],
        map: initialMap,
        radius: 20,
      });

      setMapObj(initialMap);
      setHeatmapLayer(initialHeatmap);
    };

    loadGoogleMapsAPI();
  }, [apiKey]);

  useEffect(() => {
    if (!heatmapLayer || !window.google || !coordinates) return;

    const heatmapData = coordinates.map(c => new window.google.maps.LatLng(c.lat, c.lng));
    heatmapLayer.setData(heatmapData);
  }, [coordinates, heatmapLayer]);

  // Handle Zone Markers
  useEffect(() => {
    if (!mapObj || !window.google || !zones || zones.length === 0) return;
    
    // In a real app we'd attach absolute coordinates to zones.
    // We mock coordinates for markers here:
    const mockZoneCoords = {
      'Stage Front': { lat: 12.9735, lng: 77.5950 },
      'Stage Left': { lat: 12.9732, lng: 77.5940 },
      'Stage Right': { lat: 12.9732, lng: 77.5960 },
      'Food Court': { lat: 12.9722, lng: 77.5945 },
      'Entry Plaza': { lat: 12.9705, lng: 77.5945 },
      'Exit Zone': { lat: 12.9705, lng: 77.5955 }
    };

    const markers = [];
    zones.forEach(zone => {
      if (mockZoneCoords[zone.id]) {
        const marker = new window.google.maps.Marker({
          position: mockZoneCoords[zone.id],
          map: mapObj,
          title: `${zone.id} (Density: ${zone.density}%)`,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: zone.density > 85 ? '#EF4444' : zone.density > 60 ? '#F59E0B' : '#10B981',
            fillOpacity: 0.8,
            strokeWeight: 2,
            strokeColor: '#fff',
          }
        });
        
        const infoWindow = new window.google.maps.InfoWindow({
          content: `<div style="color:black;font-family:sans-serif;padding:4px;"><b>${zone.id}</b><br/>Density: ${zone.density}%</div>`
        });

        marker.addListener('click', () => {
          infoWindow.open(mapObj, marker);
        });

        markers.push(marker);
      }
    });

    return () => {
      markers.forEach(m => m.setMap(null));
    };
  }, [mapObj, zones]);

  return (
    <div 
      className="glass-panel" 
      style={{ height: '0', paddingBottom: '70%', position: 'relative', overflow: 'hidden' }}
      role="img"
      aria-label="Venue Heatmap indicating real-time crowd density"
    >
      {!apiKey && (
        <div style={{ position: 'absolute', inset: 0, padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ color: 'var(--text-secondary)', marginBottom: '16px', textAlign: 'center' }}>
            Google Maps API Key missing. Showing Mock Layout.
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '12px', 
            flex: 1
          }}>
            {zones && zones.length > 0 ? zones.map(zone => {
              let color = '#10B981'; // Green
              if (zone.density > 60) color = '#F59E0B'; // Yellow
              if (zone.density > 85) color = '#EF4444'; // Red
              return (
                <div key={zone.id} style={{ 
                  background: `rgba(${color === '#EF4444' ? '239, 68, 68' : color === '#F59E0B' ? '245, 158, 11' : '16, 185, 129'}, 0.2)`, 
                  border: `1px solid ${color}`,
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px',
                  textAlign: 'center',
                  transition: 'all 0.5s ease'
                }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{zone.id}</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px' }}>Density: {Math.floor(zone.density)}%</div>
                </div>
              );
            }) : (
              <div style={{ gridColumn: 'span 2', textAlign: 'center', color: 'var(--text-secondary)' }}>Waiting for zone data...</div>
            )}
          </div>
        </div>
      )}
      <div 
        ref={mapRef} 
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: 'inherit', opacity: apiKey ? 1 : 0 }} 
      />
    </div>
  );
};

export default React.memo(HeatMap);
