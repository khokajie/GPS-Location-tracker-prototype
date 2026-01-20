import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
} from '@ionic/react';
import { locationOutline, trashOutline } from 'ionicons/icons';
import { useState, useEffect } from 'react';
import { App } from '@capacitor/app';
import {
  LocationPoint,
  initTracking,
  getSavedLocations,
  clearLocations,
} from '../services/locationService';

const Home: React.FC = () => {
  const [locations, setLocations] = useState<LocationPoint[]>([]);
  const [statusMessage, setStatusMessage] = useState('Starting...');

  // Auto-start tracking when app opens
  useEffect(() => {
    const init = async () => {
      // Load existing locations first
      const savedLocations = await getSavedLocations();
      setLocations(savedLocations.reverse()); // Show newest first

      // Start tracking
      const success = await initTracking(handleLocationUpdate);
      if (success) {
        setStatusMessage('Tracking active - updates every 30 seconds');
      } else {
        setStatusMessage('Failed to start. Check location permissions.');
      }
    };

    init();

    // Reload locations when app returns from background
    const listener = App.addListener('appStateChange', async ({ isActive }) => {
      if (isActive) {
        // App returned to foreground - reload from Preferences
        const savedLocations = await getSavedLocations();
        setLocations(savedLocations.reverse());
        setStatusMessage('Tracking active - updates every 30 seconds');
      }
    });

    // Cleanup listener on unmount
    return () => {
      listener.then((l) => l.remove());
    };
  }, []);

  // Handle location updates from tracking
  const handleLocationUpdate = (location: LocationPoint) => {
    setLocations((prev) => [location, ...prev]);
    setStatusMessage(`Last update: ${location.dateString}`);
  };

  // Clear all locations
  const handleClearLocations = async () => {
    await clearLocations();
    setLocations([]);
    setStatusMessage('Locations cleared');
  };

  // Pull to refresh
  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    const savedLocations = await getSavedLocations();
    setLocations(savedLocations.reverse());
    event.detail.complete();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>mymekdi Location Tracker</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Location Tracker</IonTitle>
          </IonToolbar>
        </IonHeader>

        {/* Status Section */}
        <div className="p-4">
          <div className="flex items-center justify-center gap-2 p-4 rounded-xl text-lg font-semibold bg-green-100 text-green-700">
            <IonIcon icon={locationOutline} className="text-2xl" />
            <span>Tracking Active</span>
          </div>

          <p className="text-center text-gray-500 text-sm mt-2">
            {statusMessage}
          </p>
        </div>

        {/* Clear Button */}
        <div className="px-4">
          {locations.length > 0 && (
            <IonButton
              expand="block"
              fill="outline"
              color="medium"
              onClick={handleClearLocations}
            >
              <IonIcon slot="start" icon={trashOutline} />
              Clear All ({locations.length})
            </IonButton>
          )}
        </div>

        {/* Locations List */}
        <div className="mt-6 px-4">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-lg font-semibold text-gray-700">Saved Locations</h3>
            <IonBadge color="primary">{locations.length}</IonBadge>
          </div>

          <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
            <IonRefresherContent />
          </IonRefresher>

          {locations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <IonIcon icon={locationOutline} className="text-6xl mb-4" />
              <p className="text-lg">No locations saved yet</p>
              <p className="text-sm">First location will appear in ~30 seconds</p>
            </div>
          ) : (
            <IonList className="rounded-xl overflow-hidden">
              {locations.map((location, index) => (
                <IonItem key={location.id}>
                  <IonIcon icon={locationOutline} slot="start" color="primary" />
                  <IonLabel>
                    <h2 className="font-medium">
                      {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </h2>
                    <p className="text-gray-500 text-sm">{location.dateString}</p>
                    {location.accuracy && (
                      <p className="text-gray-400 text-xs">
                        Accuracy: ±{location.accuracy.toFixed(0)}m
                      </p>
                    )}
                  </IonLabel>
                  <IonBadge slot="end" color="light">
                    #{locations.length - index}
                  </IonBadge>
                </IonItem>
              ))}
            </IonList>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
