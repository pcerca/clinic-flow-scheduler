// Geocoding utility using OpenStreetMap's Nominatim service
// Free to use with attribution

export interface GeocodingResult {
    lat: number;
    lng: number;
    displayName: string;
}

/**
 * Geocode an address using OpenStreetMap's Nominatim service
 * Free to use, no API key required
 * Please be respectful of their usage policy: https://operations.osmfoundation.org/policies/nominatim/
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
    if (!address || address.trim().length === 0) {
        return null;
    }

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?` +
            new URLSearchParams({
                q: address,
                format: 'json',
                limit: '1',
                addressdetails: '1'
            }),
            {
                headers: {
                    'User-Agent': 'ClinicFlow/1.0' // Nominatim requires a user agent
                }
            }
        );

        if (!response.ok) {
            console.error('Geocoding failed:', response.statusText);
            return null;
        }

        const data = await response.json();

        if (data && data.length > 0) {
            const result = data[0];
            return {
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon),
                displayName: result.display_name
            };
        }

        return null;
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}

/**
 * Reverse geocode coordinates to get an address
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?` +
            new URLSearchParams({
                lat: lat.toString(),
                lon: lng.toString(),
                format: 'json'
            }),
            {
                headers: {
                    'User-Agent': 'ClinicFlow/1.0'
                }
            }
        );

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return data.display_name || null;
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return null;
    }
}
