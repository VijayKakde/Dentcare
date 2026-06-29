export interface Clinic {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distance: number;
  address?: string;
  phone?: string;
  website?: string;
  openingHours?: string;
}

export interface UserLocation {
  lat: number;
  lon: number;
}

export async function getUserLocation(): Promise<UserLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Location permission denied. Please enable location access.'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Location information is unavailable.'));
            break;
          case error.TIMEOUT:
            reject(new Error('Location request timed out.'));
            break;
          default:
            reject(new Error('An unknown error occurred while getting location.'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      }
    );
  });
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function fetchNearbyClinics(
  userLocation: UserLocation,
  radiusKm: number = 5
): Promise<Clinic[]> {
  const { lat, lon } = userLocation;
  const radiusMeters = radiusKm * 1000;

  // Overpass API query for dentists
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="dentist"](around:${radiusMeters},${lat},${lon});
      way["amenity"="dentist"](around:${radiusMeters},${lat},${lon});
      relation["amenity"="dentist"](around:${radiusMeters},${lat},${lon});
    );
    out center;
  `;

  const url = 'https://overpass-api.de/api/interpreter';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();

    const clinics: Clinic[] = data.elements
      .map((element: any) => {
        const clinicLat = element.lat || element.center?.lat;
        const clinicLon = element.lon || element.center?.lon;

        if (!clinicLat || !clinicLon) return null;

        const distance = calculateDistance(lat, lon, clinicLat, clinicLon);

        return {
          id: String(element.id),
          name: element.tags?.name || 'Dental Clinic',
          lat: clinicLat,
          lon: clinicLon,
          distance: Math.round(distance * 100) / 100,
          address: element.tags?.['addr:full'] || 
                   [element.tags?.['addr:street'], element.tags?.['addr:housenumber'], element.tags?.['addr:city']]
                     .filter(Boolean)
                     .join(', ') || undefined,
          phone: element.tags?.phone || element.tags?.['contact:phone'],
          website: element.tags?.website || element.tags?.['contact:website'],
          openingHours: element.tags?.opening_hours,
        };
      })
      .filter((clinic: Clinic | null): clinic is Clinic => clinic !== null)
      .sort((a: Clinic, b: Clinic) => a.distance - b.distance);

    return clinics;
  } catch (error) {
    console.error('Error fetching clinics:', error);
    throw error;
  }
}
