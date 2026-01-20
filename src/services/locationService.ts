import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { registerPlugin } from '@capacitor/core';
import type { BackgroundGeolocationPlugin } from '@capacitor-community/background-geolocation';

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>('BackgroundGeolocation');

// Storage keys
const LOCATIONS_KEY = 'saved_locations';

// Location data structure
export interface LocationPoint {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
  dateString: string;
}

// Tracking interval in milliseconds
const TRACKING_INTERVAL_MS = 5 * 1000;

let watcherId: string | null = null;
let locationUpdateCallback: ((location: LocationPoint) => void) | null = null;
let isInitialized = false;
let trackingIntervalId: ReturnType<typeof setInterval> | null = null;
let lastKnownLocation: { latitude: number; longitude: number; accuracy: number } | null = null;
let lastSaveTimestamp = 0; // Track when we last saved (for Android background)

/**
 * Save a location point to storage
 */
const saveLocation = async (location: LocationPoint): Promise<void> => {
  try {
    const existing = await getSavedLocations();
    existing.push(location);

    await Preferences.set({
      key: LOCATIONS_KEY,
      value: JSON.stringify(existing),
    });
  } catch (error) {
    console.error('Error saving location:', error);
  }
};

/**
 * Get all saved locations from storage
 */
export const getSavedLocations = async (): Promise<LocationPoint[]> => {
  try {
    const { value } = await Preferences.get({ key: LOCATIONS_KEY });
    if (value) {
      return JSON.parse(value);
    }
    return [];
  } catch (error) {
    console.error('Error getting saved locations:', error);
    return [];
  }
};

/**
 * Clear all saved locations
 */
export const clearLocations = async (): Promise<void> => {
  try {
    await Preferences.remove({ key: LOCATIONS_KEY });
  } catch (error) {
    console.error('Error clearing locations:', error);
  }
};

/**
 * Create location point from location data
 */
const createLocationPoint = (location: { latitude: number; longitude: number; accuracy: number }): LocationPoint => {
  return {
    id: `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
    timestamp: Date.now(),
    dateString: new Date().toLocaleString(),
  };
};

/**
 * Initialize tracking - called once when app opens
 * Auto-starts and keeps running on both iOS and Android
 *
 * Strategy:
 * - Watcher: Only updates lastKnownLocation (never saves directly)
 * - Timer: Saves at fixed intervals using lastKnownLocation
 * - This ensures exactly 1 save per interval on both platforms
 */
export const initTracking = async (
  onLocationUpdate: (location: LocationPoint) => void
): Promise<boolean> => {
  // Prevent double initialization
  if (isInitialized && watcherId) {
    console.log('⚠️ Tracking already initialized');
    locationUpdateCallback = onLocationUpdate;
    return true;
  }

  try {
    locationUpdateCallback = onLocationUpdate;
    const platform = Capacitor.getPlatform();

    // Start watcher
    // - iOS: Only updates lastKnownLocation (timer handles saving)
    // - Android: Also saves in background when interval passes (JS timer suspended in background)
    watcherId = await BackgroundGeolocation.addWatcher(
      {
        backgroundMessage: 'Tracking location for mymekdi',
        backgroundTitle: 'Location Tracker Active',
        requestPermissions: true,
        stale: platform === 'ios',
        distanceFilter: 0,
      },
      async (location, error) => {
        if (error) {
          if (error.code === 'NOT_AUTHORIZED') {
            console.error('❌ Location permission not granted');
          }
          return;
        }

        if (location) {
          // Store latest location for timer-based saving
          lastKnownLocation = {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
          };

          // Android background: Save from watcher since JS timer is suspended
          if (platform === 'android') {
            const now = Date.now();
            if (now - lastSaveTimestamp >= TRACKING_INTERVAL_MS) {
              lastSaveTimestamp = now; // Update BEFORE async save to prevent duplicates

              const locationPoint = createLocationPoint(location);
              await saveLocation(locationPoint);

              // Notify UI (will work when app returns to foreground)
              if (locationUpdateCallback) {
                locationUpdateCallback(locationPoint);
              }
              console.log(`✅ [android-watcher] Location saved at ${locationPoint.dateString}`);
            }
          }
        }
      }
    );

    // Timer: Saves at fixed intervals (foreground for both platforms)
    trackingIntervalId = setInterval(async () => {
      if (lastKnownLocation) {
        const now = Date.now();

        // Check if we already saved recently (Android watcher may have saved in background)
        if (now - lastSaveTimestamp < TRACKING_INTERVAL_MS) {
          return; // Skip - already saved recently
        }

        lastSaveTimestamp = now;
        const locationPoint = createLocationPoint(lastKnownLocation);

        // Save to storage
        await saveLocation(locationPoint);

        // Notify UI
        if (locationUpdateCallback) {
          locationUpdateCallback(locationPoint);
        }

        console.log(`✅ [${platform}-timer] Location saved at ${locationPoint.dateString}`);
      } else {
        console.log('⏳ Waiting for first location...');
      }
    }, TRACKING_INTERVAL_MS);

    isInitialized = true;
    console.log(`🚀 [${platform}] Location tracking started - ${TRACKING_INTERVAL_MS / 1000}s intervals`);
    return true;
  } catch (error) {
    console.error('Error initializing tracking:', error);
    return false;
  }
};

/**
 * Get location count
 */
export const getLocationCount = async (): Promise<number> => {
  const locations = await getSavedLocations();
  return locations.length;
};
