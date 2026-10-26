
export type Place = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
};

export async function searchPlaces(query: string): Promise<Place[]> {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length < 3) {
    throw new Error('Enter at least 3 characters to search.');
  }

  const url =
    'https://nominatim.openstreetmap.org/search?' +
    new URLSearchParams({
      q: trimmedQuery,
      format: 'jsonv2',
      addressdetails: '1',
      limit: '8',
    }).toString();

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Place search failed. Please try again.');
  }

  const results = (await response.json()) as NominatimResult[];

  return results.map((item) => ({
    id: String(item.place_id),
    name: item.name || item.display_name.split(',')[0],
    address: item.display_name,
    latitude: Number(item.lat),
    longitude: Number(item.lon),
  }));
}
