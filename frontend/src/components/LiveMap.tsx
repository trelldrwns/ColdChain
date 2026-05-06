"use client";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet icon issue in Next.js
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

// Mock geocoding simple cities to coordinates
const getCoords = (city: string): [number, number] => {
  const c = city.toLowerCase();
  if (c.includes('new york')) return [40.7128, -74.0060];
  if (c.includes('boston')) return [42.3601, -71.0589];
  if (c.includes('chicago')) return [41.8781, -87.6298];
  if (c.includes('seattle')) return [47.6062, -122.3321];
  if (c.includes('miami')) return [25.7617, -80.1918];
  if (c.includes('austin')) return [30.2672, -97.7431];
  if (c.includes('san francisco')) return [37.7749, -122.4194];
  if (c.includes('los angeles')) return [34.0522, -118.2437];
  
  // Random fallback
  return [39.8283 + (Math.random() * 10 - 5), -98.5795 + (Math.random() * 20 - 10)];
};

export default function LiveMap({ origin, destination, isDelivered }: { origin: string, destination: string, isDelivered: boolean }) {
  const start = getCoords(origin);
  const end = getCoords(destination);
  
  // Calculate a mid-point for the current location if in transit
  const current: [number, number] = isDelivered ? end : [
    start[0] + (end[0] - start[0]) * 0.6, // 60% of the way there
    start[1] + (end[1] - start[1]) * 0.6
  ];

  const bounds = L.latLngBounds([start, end]);

  return (
    <MapContainer 
      bounds={bounds} 
      boundsOptions={{ padding: [50, 50] }}
      style={{ height: '100%', width: '100%', zIndex: 1 }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />
      
      {!isDelivered && (
        <Polyline positions={[start, current]} color="#15803D" weight={4} />
      )}
      {!isDelivered && (
        <Polyline positions={[current, end]} color="#94A3B8" weight={4} dashArray="5, 10" />
      )}
      {isDelivered && (
        <Polyline positions={[start, end]} color="#15803D" weight={4} />
      )}

      <Marker position={start} icon={icon}><Popup>Origin: {origin}</Popup></Marker>
      <Marker position={end} icon={icon}><Popup>Destination: {destination}</Popup></Marker>
      {!isDelivered && <Marker position={current} icon={icon}><Popup>Current Location</Popup></Marker>}
    </MapContainer>
  );
}
