import Geolocation from '@react-native-community/geolocation';
import { PostApi, GetApi } from '../Api/apiRequest';
import { endpointCustomer } from '../Api/endpoints';
import SocketService from './SocketService';

class TrackingService {
  private watchId: number | null = null;
  private currentToken: string | null = null;

  /**
   * DRIVER SIDE: Start tracking and syncing location
   */
  async startDriverTracking(token: string) {
    this.currentToken = token;

    // 1. Connect to Driver WebSocket
    SocketService.connect('driver', token);

    // 2. Start watching position
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
    }

    this.watchId = Geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log('📍 Driver Location Update:', latitude, longitude);

        // a. Call REST API to save location
        try {
          const response = await PostApi({
            url: endpointCustomer.saveDriverLocation,
            data: {
              lat: latitude,
              lon: longitude,
              status: 'Online'
            },
            token: this.currentToken
          }, null);
          console.log('✅ Save Location API Response:', response);
        } catch (error) {
          console.error('❌ Save Location API Error:', error);
        }

        // b. Send via WebSocket
        SocketService.sendMessage({
          type: 'online',
          lat: latitude,
          lon: longitude
        });
      },
      (error) => {
        console.warn('❌ Location Watch Error:', error);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10, // Update every 10 meters
        interval: 5000,
        fastestInterval: 2000
      }
    );
  }

  /**
   * DRIVER SIDE: Stop tracking
   */
  stopDriverTracking() {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    SocketService.disconnect();
    this.currentToken = null;
  }

  /**
   * USER SIDE: Get nearby drivers and listen for updates
   */
  async startUserTracking(token: string, onUpdate: (data: any) => void) {
    this.currentToken = token;

    // 1. Connect to User WebSocket
    SocketService.connect('user', token);
    SocketService.onMessage(onUpdate);

    // 2. Initial fetch of nearby drivers
    return this.fetchNearbyDrivers();
  }

  /**
   * USER SIDE: Fetch nearby drivers via REST API
   */
  async fetchNearbyDrivers() {
    if (!this.currentToken) return null;

    try {
      const response = await GetApi({
        url: endpointCustomer.nearbyDrivers,
        method: 'GET'
      }, (loading) => { });
      console.log('✅ Nearby Drivers API Response:', response);
      return response;
    } catch (error) {
      console.error('❌ Fetch Nearby Drivers Error:', error);
      return null;
    }
  }

  /**
   * USER SIDE: Stop tracking
   */
  stopUserTracking() {
    SocketService.disconnect();
    this.currentToken = null;
  }
}

export default new TrackingService();
