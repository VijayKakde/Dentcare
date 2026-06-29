import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Clinic, UserLocation } from '@/services/clinicService';

// Fix for default marker icons in Leaflet with bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Override default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom clinic marker icon
const clinicIcon = L.divIcon({
  html: `<div class="flex items-center justify-center w-8 h-8 bg-primary rounded-full border-2 border-white shadow-lg">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2v4"></path>
      <path d="m6.8 14-3.5 2"></path>
      <path d="m20.7 16-3.5-2"></path>
      <path d="M6.8 10 3.3 8"></path>
      <path d="m20.7 8-3.5 2"></path>
      <path d="m9 22 3-8 3 8"></path>
      <path d="M8 22h8"></path>
      <path d="M12 6v2"></path>
    </svg>
  </div>`,
  className: 'custom-clinic-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// User location marker
const userIcon = L.divIcon({
  html: `<div class="flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full border-3 border-white shadow-lg animate-pulse">
    <div class="w-2 h-2 bg-white rounded-full"></div>
  </div>`,
  className: 'custom-user-marker',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

interface ClinicMapProps {
  userLocation: UserLocation;
  clinics: Clinic[];
  selectedClinicId: string | null;
  onClinicSelect: (clinicId: string) => void;
}

export function ClinicMap({
  userLocation,
  clinics,
  selectedClinicId,
  onClinicSelect,
}: ClinicMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView(
      [userLocation.lat, userLocation.lon],
      14
    );

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Add user location marker
    L.marker([userLocation.lat, userLocation.lon], { icon: userIcon })
      .addTo(map)
      .bindPopup('Your Location');

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [userLocation]);

  // Add clinic markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    // Add new markers
    clinics.forEach((clinic) => {
      const marker = L.marker([clinic.lat, clinic.lon], { icon: clinicIcon })
        .addTo(map)
        .bindPopup(
          `<div class="p-2">
            <h3 class="font-semibold text-sm">${clinic.name}</h3>
            <p class="text-xs text-gray-600">${clinic.distance} km away</p>
            ${clinic.address ? `<p class="text-xs text-gray-500 mt-1">${clinic.address}</p>` : ''}
            ${clinic.phone ? `<p class="text-xs text-blue-600 mt-1">${clinic.phone}</p>` : ''}
          </div>`
        );

      marker.on('click', () => {
        onClinicSelect(clinic.id);
      });

      markersRef.current.set(clinic.id, marker);
    });

    // Fit bounds to show all markers
    if (clinics.length > 0) {
      const bounds = L.latLngBounds([
        [userLocation.lat, userLocation.lon],
        ...clinics.map((c) => [c.lat, c.lon] as [number, number]),
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [clinics, userLocation, onClinicSelect]);

  // Focus on selected clinic
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedClinicId) return;

    const marker = markersRef.current.get(selectedClinicId);
    if (marker) {
      map.setView(marker.getLatLng(), 16, { animate: true });
      marker.openPopup();
    }
  }, [selectedClinicId]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full min-h-[300px] rounded-xl overflow-hidden"
    />
  );
}
