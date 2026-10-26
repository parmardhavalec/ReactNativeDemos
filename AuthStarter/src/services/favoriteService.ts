
import { supabase } from '../lib/supabase';
import type { Place } from './placeService';

export type FavoritePlace = Place & {
  user_id: string;
  created_at: string;
};

export async function getFavoritePlaces(): Promise<FavoritePlace[]> {
  const { data, error } = await supabase
    .from('favorite_places')
    .select(
      'id, user_id, place_id, name, address, latitude, longitude, created_at'
    )
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: String(row.place_id),
    user_id: row.user_id,
    place_id: row.place_id,
    name: row.name,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    created_at: row.created_at,
  }));
}

export async function saveFavoritePlace(place: Place): Promise<void> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Please sign in again to save a favorite.');
  }

  const { error } = await supabase.from('favorite_places').insert({
    user_id: user.id,
    place_id: place.id,
    name: place.name,
    address: place.address,
    latitude: place.latitude,
    longitude: place.longitude,
  });

  if (error?.code === '23505') {
    throw new Error('This place is already in your favorites.');
  }

  if (error) {
    throw new Error(error.message);
  }
}

export async function removeFavoritePlace(placeId: string): Promise<void> {
  const { error } = await supabase
    .from('favorite_places')
    .delete()
    .eq('place_id', placeId);

  if (error) {
    throw new Error(error.message);
  }
}
