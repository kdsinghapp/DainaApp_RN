import { WebSocket_Url } from '../Api';
import { AppState, AppStateStatus } from 'react-native';

class SocketService {
  private socket: WebSocket | null = null;
  private onMessageCallback: ((data: any) => void) | null = null;
  private reconnectInterval: any = null;
  private url: string = '';
  private currentType: 'driver' | 'user' | null = null;
  private currentToken: string | null = null;
  private appStateSubscription: any = null;

  constructor() {
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    // If the app comes to foreground and we don't have an active connection but we have credentials
    if (nextAppState === 'active' && this.currentType && this.currentToken) {
      if (!this.socket || this.socket.readyState === WebSocket.CLOSED || this.socket.readyState === WebSocket.CLOSING) {
        console.log(`📱 App foregrounded, reconnecting ${this.currentType} socket...`);
        this.connect(this.currentType, this.currentToken);
      }
    }
  };

  connect(type: 'driver' | 'user', token: string) {
    this.currentType = type;
    this.currentToken = token;

    if (this.socket) {
      this.socket.close();
    }

    this.url = `${WebSocket_Url}/${type}-live?token=${token}`;
    console.log('Connecting to socket:', this.url);

    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      console.log(`${type} socket connected`);
      if (this.reconnectInterval) {
        clearInterval(this.reconnectInterval);
        this.reconnectInterval = null;
      }
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Socket message received:', data);
        if (this.onMessageCallback) {
          this.onMessageCallback(data);
        }
      } catch (error) {
        console.error('Error parsing socket message:', error);
      }
    };

    this.socket.onerror = (error) => {
      console.error('Socket error:', error);
    };

    this.socket.onclose = (event) => {
      console.log(`${type} socket closed:`, event.reason);
      this.startReconnecting(type, token);
    };
  }

  private startReconnecting(type: 'driver' | 'user', token: string) {
    if (this.reconnectInterval) return;

    this.reconnectInterval = setInterval(() => {
      console.log(`Attempting to reconnect ${type} socket...`);
      this.connect(type, token);
    }, 5000);
  }

  sendMessage(message: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('Socket not connected, cannot send message');
    }
  }

  onMessage(callback: (data: any) => void) {
    this.onMessageCallback = callback;
  }

  disconnect() {
    this.currentType = null;
    this.currentToken = null;
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export default new SocketService();
