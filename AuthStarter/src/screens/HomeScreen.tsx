
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
  Keyboard,
} from 'react-native';

import {
  Map,
  Camera,
  ViewAnnotation,
  type CameraRef,
} from '@maplibre/maplibre-react-native';

import * as Location from 'expo-location';
import PrimaryButton from '../components/PrimaryButton';
import { searchPlaces, type Place } from '../services/placeService';
import {
  getFavoritePlaces,
  saveFavoritePlace,
  removeFavoritePlace,
} from '../services/favoriteService';

type Props = {
  email: string;
  loading: boolean;
  onLogout: () => void;
};

const INITIAL_CENTER: [number, number] = [72.5714, 23.0225];

export default function HomeScreen({
  email,
  loading,
  onLogout,
}: Props) {
  const cameraRef = useRef<CameraRef>(null);

  const [locationLoading, setLocationLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const [userCoordinates, setUserCoordinates] =
    useState<[number, number] | null>(null);

  const [selectedPlace, setSelectedPlace] =
    useState<Place | null>(null);

  // Load the signed-in user's saved favorite places.
  const loadFavoriteIds = async () => {
    try {
      const favorites = await getFavoritePlaces();
      setFavoriteIds(favorites.map((place) => place.id));
    } catch (error) {
      console.error('Unable to load favorites:', error);
    }
  };

  useEffect(() => {
    void loadFavoriteIds();
  }, []);

  // Search for a city, address, or landmark.
  const handleSearch = async () => {
    if (query.trim().length < 3) {
      Alert.alert(
        'Search places',
        'Please enter at least 3 characters.'
      );
      return;
    }

    try {
      Keyboard.dismiss();
      setSearchLoading(true);
      setHasSearched(false);
      setResults([]);

      const places = await searchPlaces(query);

      setResults(places);
      setHasSearched(true);
    } catch (error) {
      console.error('Place search failed:', error);

      Alert.alert(
        'Search unavailable',
        error instanceof Error
          ? error.message
          : 'Unable to search places. Please try again.'
      );
    } finally {
      setSearchLoading(false);
    }
  };

  // Select a search result and move the map to it.
  const selectPlace = (place: Place) => {
    const coordinates: [number, number] = [
      place.longitude,
      place.latitude,
    ];

    setSelectedPlace(place);
    setResults([]);
    setHasSearched(false);
    Keyboard.dismiss();

    cameraRef.current?.easeTo({
      center: coordinates,
      zoom: 15,
      duration: 1000,
    });
  };

  // Show the device's current location.
  const showMyLocation = async () => {
    try {
      setLocationLoading(true);

      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Location permission',
          'Allow location access in your device settings to show your position on the map.'
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coordinates: [number, number] = [
        location.coords.longitude,
        location.coords.latitude,
      ];

      setUserCoordinates(coordinates);

      cameraRef.current?.easeTo({
        center: coordinates,
        zoom: 15,
        duration: 1000,
      });
    } catch (error) {
      console.error('Unable to get current location:', error);

      Alert.alert(
        'Location unavailable',
        'Could not retrieve your location. Please check your device location settings and try again.'
      );
    } finally {
      setLocationLoading(false);
    }
  };

  // Save a selected place or remove it if already saved.
  const toggleFavorite = async () => {
    if (!selectedPlace || favoriteLoading) {
      return;
    }

    try {
      setFavoriteLoading(true);

      if (favoriteIds.includes(selectedPlace.id)) {
        await removeFavoritePlace(selectedPlace.id);

        setFavoriteIds((ids) =>
          ids.filter((id) => id !== selectedPlace.id)
        );

        Alert.alert(
          'Favorite removed',
          'Place removed from your favorites.'
        );
      } else {
        await saveFavoritePlace(selectedPlace);

        setFavoriteIds((ids) =>
          ids.includes(selectedPlace.id)
            ? ids
            : [...ids, selectedPlace.id]
        );

        Alert.alert(
          'Favorite saved',
          'Place added to your favorites.'
        );
      }
    } catch (error) {
      console.error('Unable to update favorite:', error);

      Alert.alert(
        'Favorites',
        error instanceof Error
          ? error.message
          : 'Unable to update favorite. Please try again.'
      );

      // Refresh the saved list in case the server changed
      // but the local operation did not complete as expected.
      await loadFavoriteIds();
    } finally {
      setFavoriteLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Explore Map</Text>
          <Text style={styles.email} numberOfLines={1}>
            {email}
          </Text>
        </View>

        <Pressable
          style={styles.locationButton}
          onPress={showMyLocation}
          disabled={locationLoading}
        >
          {locationLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.locationButtonText}>
              My Location
            </Text>
          )}
        </Pressable>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search city, address or landmark"
            placeholderTextColor="#98a2b3"
            returnKeyType="search"
            autoCorrect={false}
            onSubmitEditing={handleSearch}
            accessibilityLabel="Search for a place"
          />

          <Pressable
            style={[
              styles.searchButton,
              searchLoading && styles.disabledButton,
            ]}
            onPress={handleSearch}
            disabled={searchLoading}
          >
            {searchLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.searchButtonText}>Search</Text>
            )}
          </Pressable>
        </View>

        {searchLoading && (
          <Text style={styles.statusText}>
            Searching places...
          </Text>
        )}

        {!searchLoading && hasSearched && results.length === 0 && (
          <Text style={styles.statusText}>
            No places found. Try a different search.
          </Text>
        )}

        {results.length > 0 && (
          <ScrollView
            style={styles.resultsList}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {results.map((place) => (
              <Pressable
                key={place.id}
                style={styles.resultItem}
                onPress={() => selectPlace(place)}
              >
                <Text style={styles.resultName} numberOfLines={1}>
                  {place.name}
                </Text>

                <Text style={styles.resultAddress} numberOfLines={2}>
                  {place.address}
                </Text>
              </Pressable>
            ))}

            <Text style={styles.attribution}>
              Search data © OpenStreetMap contributors
            </Text>
          </ScrollView>
        )}
      </View>

      <View style={styles.mapContainer}>
        <Map
          style={styles.map}
          mapStyle="https://tiles.openfreemap.org/styles/liberty"
        >
          <Camera
            ref={cameraRef}
            initialViewState={{
              center: INITIAL_CENTER,
              zoom: 10,
            }}
          />

          {userCoordinates && (
            <ViewAnnotation lngLat={userCoordinates}>
              <View style={styles.marker}>
                <View style={styles.markerInner} />
              </View>
            </ViewAnnotation>
          )}

          {selectedPlace && (
            <ViewAnnotation
              lngLat={[
                selectedPlace.longitude,
                selectedPlace.latitude,
              ]}
            >
              <View style={styles.selectedMarker}>
                <View style={styles.selectedMarkerInner} />
              </View>
            </ViewAnnotation>
          )}
        </Map>
      </View>

      {selectedPlace && (
        <View style={styles.placeCard}>
          <View style={styles.placeText}>
            <Text style={styles.placeTitle} numberOfLines={1}>
              {selectedPlace.name}
            </Text>

            <Text style={styles.placeAddress} numberOfLines={2}>
              {selectedPlace.address}
            </Text>
          </View>

          <Pressable
            style={[
              styles.favoriteButton,
              favoriteLoading && styles.disabledButton,
            ]}
            onPress={toggleFavorite}
            disabled={favoriteLoading}
          >
            {favoriteLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.favoriteButtonText}>
                {favoriteIds.includes(selectedPlace.id)
                  ? '★ Saved'
                  : '☆ Save'}
              </Text>
            )}
          </Pressable>

          <Pressable
            style={styles.closeButton}
            onPress={() => setSelectedPlace(null)}
            accessibilityLabel="Close selected place"
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.footer}>
        <PrimaryButton
          title="Sign Out"
          loading={loading}
          onPress={onLogout}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fc',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#172033',
  },
  email: {
    marginTop: 5,
    color: '#667085',
    fontSize: 12,
  },
  locationButton: {
    backgroundColor: '#1769e0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minWidth: 112,
    alignItems: 'center',
  },
  locationButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  searchSection: {
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d0d5dd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: '#172033',
    fontSize: 14,
  },
  searchButton: {
    backgroundColor: '#1769e0',
    borderRadius: 10,
    paddingHorizontal: 16,
    minWidth: 82,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
  statusText: {
    paddingTop: 8,
    paddingHorizontal: 4,
    color: '#667085',
    fontSize: 13,
  },
  resultsList: {
    maxHeight: 180,
    marginTop: 6,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e4e7ec',
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eaecf0',
  },
  resultName: {
    color: '#172033',
    fontSize: 14,
    fontWeight: '600',
  },
  resultAddress: {
    marginTop: 4,
    color: '#667085',
    fontSize: 12,
  },
  attribution: {
    padding: 8,
    color: '#667085',
    fontSize: 10,
  },
  mapContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  marker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1769e0',
    borderWidth: 3,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  markerInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  selectedMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e04444',
    borderWidth: 3,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  selectedMarkerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 12,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e7ec',
  },
  placeText: {
    flex: 1,
  },
  placeTitle: {
    color: '#172033',
    fontSize: 15,
    fontWeight: '700',
  },
  placeAddress: {
    marginTop: 4,
    color: '#667085',
    fontSize: 12,
  },
  favoriteButton: {
    backgroundColor: '#1769e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginLeft: 8,
    minWidth: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  closeButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  closeButtonText: {
    color: '#667085',
    fontSize: 18,
  },
  footer: {
    padding: 12,
  },
});
