
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
  GeoJSONSource,
  Layer,
  type CameraRef,
} from '@maplibre/maplibre-react-native';

import * as Location from 'expo-location';
import PrimaryButton from '../components/PrimaryButton';
import { searchPlaces, type Place } from '../services/placeService';
import {
  getFavoritePlaces,
  saveFavoritePlace,
  removeFavoritePlace,
  type FavoritePlace,
} from '../services/favoriteService';

import {
  getDrivingRoute,
  formatDistance,
  formatDuration,
  type RouteResult,
  type Coordinates,
} from '../services/directionsService';

type Props = {
  email: string;
  loading: boolean;
  onLogout: () => void;
};

const INITIAL_CENTER: Coordinates = [72.5714, 23.0225];

export default function HomeScreen({
  email,
  loading,
  onLogout,
}: Props) {
  const cameraRef = useRef<CameraRef>(null);

  const [locationLoading, setLocationLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const [favoritePlaces, setFavoritePlaces] = useState<FavoritePlace[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);

  const [userCoordinates, setUserCoordinates] =
    useState<Coordinates | null>(null);

  const [selectedPlace, setSelectedPlace] =
    useState<Place | null>(null);

  const [route, setRoute] = useState<RouteResult | null>(null);
  const [showDirections, setShowDirections] = useState(false);

  // Load the signed-in user's favorites from Supabase.
  const loadFavoritePlaces = async () => {
    try {
      const favorites = await getFavoritePlaces();

      setFavoritePlaces(favorites);
      setFavoriteIds(favorites.map((place) => place.id));
    } catch (error) {
      console.error('Unable to load favorites:', error);

      Alert.alert(
        'Favorites',
        error instanceof Error
          ? error.message
          : 'Unable to load your favorite places.',
      );
    }
  };

  useEffect(() => {
    void loadFavoritePlaces();
  }, []);

  // Move the camera when a place is selected.
  useEffect(() => {
    if (!showFavorites && selectedPlace && !route) {
      cameraRef.current?.easeTo({
        center: [
          selectedPlace.longitude,
          selectedPlace.latitude,
        ],
        zoom: 15,
        duration: 1000,
      });
    }
  }, [selectedPlace, showFavorites, route]);

  // Search for a city, address, or landmark.
  const handleSearch = async () => {
    if (query.trim().length < 3) {
      Alert.alert(
        'Search places',
        'Please enter at least 3 characters.',
      );
      return;
    }

    try {
      Keyboard.dismiss();
      setSearchLoading(true);
      setHasSearched(false);
      setResults([]);

      const places = await searchPlaces(query.trim());

      setResults(places);
      setHasSearched(true);
    } catch (error) {
      console.error('Place search failed:', error);

      Alert.alert(
        'Search unavailable',
        error instanceof Error
          ? error.message
          : 'Unable to search places. Please try again.',
      );
    } finally {
      setSearchLoading(false);
    }
  };

  // Select a search result.
  const selectPlace = (place: Place) => {
    setRoute(null);
    setShowDirections(false);
    setSelectedPlace(place);
    setResults([]);
    setHasSearched(false);
    setShowFavorites(false);
    Keyboard.dismiss();
  };

  // Open a saved favorite on the map.
  const openFavoriteOnMap = (place: FavoritePlace) => {
    setRoute(null);
    setShowDirections(false);

    setSelectedPlace({
      id: place.id,
      name: place.name,
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
    });

    setQuery('');
    setResults([]);
    setHasSearched(false);
    setShowFavorites(false);
    Keyboard.dismiss();
  };

  // Obtain the current device location.
  const getCurrentCoordinates = async (): Promise<Coordinates> => {
    const permission =
      await Location.requestForegroundPermissionsAsync();

    if (!permission.granted) {
      throw new Error(
        'Location permission is required. Allow location access in your device settings and try again.',
      );
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return [
      location.coords.longitude,
      location.coords.latitude,
    ];
  };

  // Show the device's current location.
  const showMyLocation = async () => {
    try {
      setLocationLoading(true);

      const coordinates = await getCurrentCoordinates();

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
        error instanceof Error
          ? error.message
          : 'Could not retrieve your location. Check your device settings and try again.',
      );
    } finally {
      setLocationLoading(false);
    }
  };

  // Calculate and display a driving route to the selected place.
  const handleGetDirections = async () => {
    if (!selectedPlace || routeLoading) {
      return;
    }

    try {
      Keyboard.dismiss();
      setRouteLoading(true);
      setRoute(null);
      setShowDirections(false);

      const origin = await getCurrentCoordinates();
      setUserCoordinates(origin);

      const destination: Coordinates = [
        selectedPlace.longitude,
        selectedPlace.latitude,
      ];

      const result = await getDrivingRoute(origin, destination);

      setRoute(result);
      setShowDirections(true);

      // Fit the entire route into the map viewport.
      const longitudes = result.coordinates.map((point) => point[0]);
      const latitudes = result.coordinates.map((point) => point[1]);

      const west = Math.min(...longitudes);
      const east = Math.max(...longitudes);
      const south = Math.min(...latitudes);
      const north = Math.max(...latitudes);

      if (west === east && south === north) {
        cameraRef.current?.easeTo({
          center: origin,
          zoom: 15,
          duration: 1000,
        });
      } else {
        cameraRef.current?.fitBounds(
          [west, south, east, north],
          {
            padding: { top: 50, right: 40, bottom: 70, left: 40 },
            duration: 1000,
          },
        );
      }
    } catch (error) {
      console.error('Unable to calculate route:', error);

      Alert.alert(
        'Directions unavailable',
        error instanceof Error
          ? error.message
          : 'Could not calculate a route. Check your internet connection and try again.',
      );
    } finally {
      setRouteLoading(false);
    }
  };

  // Clear the current route without clearing the selected place.
  const clearRoute = () => {
    setRoute(null);
    setShowDirections(false);

    if (selectedPlace) {
      cameraRef.current?.easeTo({
        center: [
          selectedPlace.longitude,
          selectedPlace.latitude,
        ],
        zoom: 15,
        duration: 700,
      });
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

        Alert.alert(
          'Favorite removed',
          'Place removed from your favorites.',
        );
      } else {
        await saveFavoritePlace(selectedPlace);

        Alert.alert(
          'Favorite saved',
          'Place added to your favorites.',
        );
      }

      await loadFavoritePlaces();
    } catch (error) {
      console.error('Unable to update favorite:', error);

      Alert.alert(
        'Favorites',
        error instanceof Error
          ? error.message
          : 'Unable to update favorite. Please try again.',
      );
    } finally {
      setFavoriteLoading(false);
    }
  };

  // Remove a favorite directly from the favorites screen.
  const confirmRemoveFavorite = (place: FavoritePlace) => {
    if (favoriteLoading) {
      return;
    }

    Alert.alert(
      'Remove favorite?',
      `Remove "${place.name}" from your saved places?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            void removeFavoriteFromList(place);
          },
        },
      ],
    );
  };

  const removeFavoriteFromList = async (place: FavoritePlace) => {
    try {
      setFavoriteLoading(true);

      await removeFavoritePlace(place.id);

      setFavoritePlaces((current) =>
        current.filter((item) => item.id !== place.id),
      );

      setFavoriteIds((current) =>
        current.filter((id) => id !== place.id),
      );

      if (selectedPlace?.id === place.id) {
        setSelectedPlace(null);
        setRoute(null);
        setShowDirections(false);
      }
    } catch (error) {
      console.error('Unable to remove favorite:', error);

      Alert.alert(
        'Unable to remove favorite',
        error instanceof Error
          ? error.message
          : 'Please try again.',
      );

      await loadFavoritePlaces();
    } finally {
      setFavoriteLoading(false);
    }
  };

  const routeGeoJSON = route
    ? {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'LineString' as const,
          coordinates: route.coordinates,
        },
      }
    : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>
            {showFavorites ? 'My Favorite Places' : 'Explore Map'}
          </Text>

          <Text style={styles.email} numberOfLines={1}>
            {email}
          </Text>
        </View>

        <Pressable
          style={styles.favoritesHeaderButton}
          onPress={() => {
            if (showFavorites) {
              setShowFavorites(false);
            } else {
              setShowFavorites(true);
              setSelectedPlace(null);
              setRoute(null);
              setShowDirections(false);
              setResults([]);
              setHasSearched(false);
              Keyboard.dismiss();
              void loadFavoritePlaces();
            }
          }}
        >
          <Text style={styles.favoritesHeaderButtonText}>
            {showFavorites
              ? 'Back to Map'
              : `★ Favorites (${favoritePlaces.length})`}
          </Text>
        </Pressable>
      </View>

      {showFavorites ? (
        /* My Favorite Places screen */
        <View style={styles.favoritesContainer}>
          <View style={styles.favoritesIntro}>
            <Text style={styles.favoritesHeading}>
              Your saved places
            </Text>

            <Text style={styles.favoritesDescription}>
              Open a place on the map or remove it from your list.
            </Text>
          </View>

          {favoritePlaces.length === 0 ? (
            <View style={styles.emptyFavorites}>
              <Text style={styles.emptyFavoritesIcon}>☆</Text>

              <Text style={styles.emptyFavoritesTitle}>
                No favorite places yet
              </Text>

              <Text style={styles.emptyFavoritesDescription}>
                Search for a place on the map and tap Save to add it here.
              </Text>

              <Pressable
                style={styles.emptyFavoritesButton}
                onPress={() => setShowFavorites(false)}
              >
                <Text style={styles.emptyFavoritesButtonText}>
                  Explore the map
                </Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              style={styles.favoritesList}
              contentContainerStyle={styles.favoritesListContent}
              keyboardShouldPersistTaps="handled"
            >
              {favoritePlaces.map((place) => (
                <View key={place.id} style={styles.favoriteItem}>
                  <Pressable
                    style={styles.favoriteItemContent}
                    onPress={() => openFavoriteOnMap(place)}
                  >
                    <View style={styles.favoriteIcon}>
                      <Text style={styles.favoriteIconText}>★</Text>
                    </View>

                    <View style={styles.favoriteItemText}>
                      <Text
                        style={styles.favoriteItemName}
                        numberOfLines={2}
                      >
                        {place.name}
                      </Text>

                      <Text
                        style={styles.favoriteItemAddress}
                        numberOfLines={3}
                      >
                        {place.address}
                      </Text>

                      <Text style={styles.openMapHint}>
                        Tap to open on map
                      </Text>
                    </View>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.removeFavoriteButton,
                      favoriteLoading && styles.disabledButton,
                    ]}
                    onPress={() => confirmRemoveFavorite(place)}
                    disabled={favoriteLoading}
                    accessibilityLabel={`Remove ${place.name} from favorites`}
                  >
                    <Text style={styles.removeFavoriteButtonText}>
                      Remove
                    </Text>
                  </Pressable>
                </View>
              ))}

              <Text style={styles.attribution}>
                Place search data © OpenStreetMap contributors
              </Text>
            </ScrollView>
          )}
        </View>
      ) : (
        <>
          {/* Place search */}
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

          {/* Map and route */}
          <View style={styles.mapContainer}>
            <Map
              style={styles.map}
              mapStyle="https://tiles.openfreemap.org/styles/liberty"
            >
              <Camera
                ref={cameraRef}
                initialViewState={{
                  center: selectedPlace
                    ? [selectedPlace.longitude, selectedPlace.latitude]
                    : INITIAL_CENTER,
                  zoom: selectedPlace ? 15 : 10,
                }}
              />

              {routeGeoJSON && (
                <GeoJSONSource
                  id="route-source"
                  data={routeGeoJSON}
                >
                  <Layer
                    id="route-line"
                    type="line"
                    paint={{
                      'line-color': '#1769e0',
                      'line-width': 5,
                      'line-opacity': 0.9,
                    }}
                    layout={{
                      'line-cap': 'round',
                      'line-join': 'round',
                    }}
                  />
                </GeoJSONSource>
              )}

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

          {/* Selected place actions */}
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

              <View style={styles.placeActions}>
                <Pressable
                  style={[
                    styles.directionsButton,
                    routeLoading && styles.disabledButton,
                  ]}
                  onPress={handleGetDirections}
                  disabled={routeLoading}
                >
                  {routeLoading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.actionButtonText}>
                      Directions
                    </Text>
                  )}
                </Pressable>

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
                    <Text style={styles.actionButtonText}>
                      {favoriteIds.includes(selectedPlace.id)
                        ? '★ Saved'
                        : '☆ Save'}
                    </Text>
                  )}
                </Pressable>

                <Pressable
                  style={styles.closeButton}
                  onPress={() => {
                    setSelectedPlace(null);
                    setRoute(null);
                    setShowDirections(false);
                  }}
                  accessibilityLabel="Close selected place"
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Route summary and step-by-step directions */}
          {route && showDirections && (
            <View style={styles.directionsPanel}>
              <View style={styles.routeSummary}>
                <View style={styles.routeSummaryItem}>
                  <Text style={styles.routeSummaryValue}>
                    {formatDistance(route.distance)}
                  </Text>
                  <Text style={styles.routeSummaryLabel}>Distance</Text>
                </View>

                <View style={styles.routeSummaryDivider} />

                <View style={styles.routeSummaryItem}>
                  <Text style={styles.routeSummaryValue}>
                    {formatDuration(route.duration)}
                  </Text>
                  <Text style={styles.routeSummaryLabel}>
                    Estimated drive
                  </Text>
                </View>

                <Pressable
                  style={styles.clearRouteButton}
                  onPress={clearRoute}
                >
                  <Text style={styles.clearRouteText}>Clear route</Text>
                </Pressable>
              </View>

              <Text style={styles.directionsHeading}>
                Driving directions
              </Text>

              <ScrollView
                style={styles.directionsList}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              >
                {route.steps.map((step, index) => (
                  <View
                    key={`${index}-${step.instruction}`}
                    style={styles.directionStep}
                  >
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>
                        {index + 1}
                      </Text>
                    </View>

                    <View style={styles.stepTextContainer}>
                      <Text style={styles.stepInstruction}>
                        {step.instruction}
                      </Text>

                      {step.roadName.length > 0 && (
                        <Text style={styles.stepRoadName}>
                          {step.roadName}
                        </Text>
                      )}
                    </View>

                    <Text style={styles.stepDistance}>
                      {formatDistance(step.distance)}
                    </Text>
                  </View>
                ))}

                <Text style={styles.routeDisclaimer}>
                  Estimated route and travel time. Actual conditions may vary.
                </Text>
              </ScrollView>
            </View>
          )}
        </>
      )}

      {/* Sign out */}
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
    gap: 10,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#172033',
  },
  email: {
    marginTop: 5,
    color: '#667085',
    fontSize: 12,
  },
  favoritesHeaderButton: {
    backgroundColor: '#1769e0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoritesHeaderButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
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
    opacity: 0.65,
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
    minHeight: 150,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  locationButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#1769e0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minWidth: 112,
    alignItems: 'center',
    elevation: 3,
  },
  locationButtonText: {
    color: '#ffffff',
    fontWeight: '600',
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
    backgroundColor: '#ffffff',
    marginHorizontal: 12,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e7ec',
    gap: 10,
  },
  placeText: {
    minWidth: 0,
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
  placeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  directionsButton: {
    flex: 1,
    backgroundColor: '#1769e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    flex: 1,
    backgroundColor: '#1769e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  closeButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  closeButtonText: {
    color: '#667085',
    fontSize: 18,
  },
  directionsPanel: {
    maxHeight: 245,
    backgroundColor: '#ffffff',
    marginHorizontal: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e4e7ec',
    borderRadius: 12,
    padding: 12,
  },
  routeSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eaecf0',
  },
  routeSummaryItem: {
    flex: 1,
  },
  routeSummaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#172033',
  },
  routeSummaryLabel: {
    fontSize: 11,
    color: '#667085',
    marginTop: 3,
  },
  routeSummaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#e4e7ec',
  },
  clearRouteButton: {
    backgroundColor: '#fff5f5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  clearRouteText: {
    color: '#c53030',
    fontSize: 12,
    fontWeight: '600',
  },
  directionsHeading: {
    color: '#172033',
    fontSize: 14,
    fontWeight: '700',
    paddingTop: 10,
    paddingBottom: 5,
  },
  directionsList: {
    flexShrink: 1,
  },
  directionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
  },
  stepNumber: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: '#e8f1ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#1769e0',
    fontSize: 12,
    fontWeight: '700',
  },
  stepTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  stepInstruction: {
    color: '#172033',
    fontSize: 13,
    fontWeight: '600',
  },
  stepRoadName: {
    color: '#667085',
    fontSize: 11,
    marginTop: 3,
  },
  stepDistance: {
    color: '#667085',
    fontSize: 11,
    paddingTop: 4,
  },
  routeDisclaimer: {
    color: '#667085',
    fontSize: 10,
    paddingVertical: 8,
  },
  favoritesContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  favoritesIntro: {
    paddingHorizontal: 4,
    paddingTop: 6,
    paddingBottom: 12,
  },
  favoritesHeading: {
    color: '#172033',
    fontSize: 18,
    fontWeight: '700',
  },
  favoritesDescription: {
    color: '#667085',
    fontSize: 13,
    marginTop: 5,
  },
  favoritesList: {
    flex: 1,
  },
  favoritesListContent: {
    paddingBottom: 12,
  },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e7ec',
    padding: 12,
    marginBottom: 10,
    gap: 8,
  },
  favoriteItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    minWidth: 0,
  },
  favoriteIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff3d6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  favoriteIconText: {
    color: '#b7791f',
    fontSize: 20,
    fontWeight: '700',
  },
  favoriteItemText: {
    flex: 1,
    minWidth: 0,
  },
  favoriteItemName: {
    color: '#172033',
    fontSize: 14,
    fontWeight: '700',
  },
  favoriteItemAddress: {
    color: '#667085',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  openMapHint: {
    color: '#1769e0',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 7,
  },
  removeFavoriteButton: {
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f0b7b7',
    backgroundColor: '#fff5f5',
  },
  removeFavoriteButtonText: {
    color: '#c53030',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyFavorites: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  emptyFavoritesIcon: {
    color: '#b8c1d1',
    fontSize: 64,
    marginBottom: 12,
  },
  emptyFavoritesTitle: {
    color: '#172033',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyFavoritesDescription: {
    color: '#667085',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  emptyFavoritesButton: {
    backgroundColor: '#1769e0',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginTop: 20,
  },
  emptyFavoritesButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  footer: {
    padding: 12,
  },
});
