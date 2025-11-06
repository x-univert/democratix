import { io, Socket } from 'socket.io-client';

/**
 * WebSocket Service for real-time notifications
 *
 * Provides real-time communication between frontend and backend
 * using Socket.io for instant updates when events occur.
 *
 * @example
 * ```typescript
 * // Connect to WebSocket
 * websocketService.connect();
 *
 * // Join election room to receive updates
 * websocketService.joinElection(42);
 *
 * // Listen for vote events
 * websocketService.on('vote:received', (data) => {
 *   console.log('New vote!', data);
 * });
 *
 * // Cleanup
 * websocketService.disconnect();
 * ```
 */
class WebSocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private backendUrl: string;

  constructor() {
    this.backendUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3003';
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.socket && this.isConnected) {
      console.log('✅ WebSocket already connected');
      return;
    }

    console.log('🔌 Connecting to WebSocket...', this.backendUrl);

    this.socket = io(this.backendUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventHandlers();
  }

  /**
   * Setup Socket.io event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection successful
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('✅ WebSocket connected', this.socket?.id);
    });

    // Welcome message from server
    this.socket.on('connected', (data) => {
      console.log('📨 Server welcome:', data);
    });

    // Connection error
    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Max reconnection attempts reached. Giving up.');
      }
    });

    // Disconnection
    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.warn('🔌 WebSocket disconnected:', reason);

      if (reason === 'io server disconnect') {
        // Server disconnected us, manually reconnect
        this.socket?.connect();
      }
    });

    // Reconnection attempt
    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}/${this.maxReconnectAttempts}`);
    });

    // Reconnection successful
    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ WebSocket reconnected after ${attemptNumber} attempts`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });
  }

  /**
   * Join an election room to receive updates for that election
   */
  joinElection(electionId: number): void {
    if (!this.socket) {
      console.warn('⚠️ Cannot join election: WebSocket not connected');
      return;
    }

    console.log(`📍 Joining election room: ${electionId}`);
    this.socket.emit('join:election', electionId);
  }

  /**
   * Leave an election room
   */
  leaveElection(electionId: number): void {
    if (!this.socket) return;

    console.log(`📍 Leaving election room: ${electionId}`);
    this.socket.emit('leave:election', electionId);
  }

  /**
   * Subscribe to organizer notifications (for organizers)
   */
  subscribeToOrganizer(address: string): void {
    if (!this.socket) {
      console.warn('⚠️ Cannot subscribe: WebSocket not connected');
      return;
    }

    console.log(`📍 Subscribing to organizer events: ${address}`);
    this.socket.emit('subscribe:organizer', address);
  }

  /**
   * Unsubscribe from organizer notifications
   */
  unsubscribeFromOrganizer(address: string): void {
    if (!this.socket) return;

    console.log(`📍 Unsubscribing from organizer events: ${address}`);
    this.socket.emit('unsubscribe:organizer', address);
  }

  /**
   * Listen for a specific event
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.socket) {
      console.warn(`⚠️ Cannot listen to ${event}: WebSocket not connected`);
      return;
    }

    this.socket.on(event, callback);
  }

  /**
   * Remove listener for a specific event
   */
  off(event: string, callback?: (data: any) => void): void {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting WebSocket...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Check if WebSocket is connected
   */
  getIsConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Get Socket.io instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
