if (typeof window !== 'undefined' && !(window as any).global) {
  (window as any).global = window;
}

import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class WebSocketService {
  private client: Client | null = null;
  private isConnected: boolean = false;
  private subscriptions: Map<string, any> = new Map();

  connect(onConnectedCallback?: () => void) {
    if (this.client && this.isConnected) {
      if (onConnectedCallback) onConnectedCallback();
      return;
    }

    const socketFactory = () => new SockJS('/ws');

    this.client = new Client({
      webSocketFactory: socketFactory,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        this.isConnected = true;
        console.log('[STOMP WebSocket] Connected successfully');
        if (onConnectedCallback) onConnectedCallback();
      },
      onDisconnect: () => {
        this.isConnected = false;
        console.log('[STOMP WebSocket] Disconnected');
      },
      onStompError: (frame) => {
        console.error('[STOMP WebSocket] Broker error: ' + frame.headers['message']);
      },
    });

    this.client.activate();
  }

  subscribe(topic: string, callback: (message: any) => void) {
    if (!this.client) {
      this.connect(() => this.subscribe(topic, callback));
      return;
    }

    if (this.subscriptions.has(topic)) {
      this.subscriptions.get(topic).unsubscribe();
    }

    if (this.isConnected) {
      const sub = this.client.subscribe(topic, (msg) => {
        try {
          const payload = JSON.parse(msg.body);
          callback(payload);
        } catch (e) {
          callback(msg.body);
        }
      });
      this.subscriptions.set(topic, sub);
    } else {
      setTimeout(() => this.subscribe(topic, callback), 1000);
    }
  }

  unsubscribe(topic: string) {
    if (this.subscriptions.has(topic)) {
      this.subscriptions.get(topic).unsubscribe();
      this.subscriptions.delete(topic);
    }
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.isConnected = false;
      this.subscriptions.clear();
    }
  }
}

export const wsService = new WebSocketService();
export default wsService;
