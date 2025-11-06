import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../utils/logger';

/**
 * WebSocket Service using Socket.io for real-time notifications
 *
 * Events supported:
 * - election:created - New election created
 * - election:activated - Election activated
 * - election:closed - Election closed
 * - election:finalized - Election finalized
 * - vote:received - New vote received (for organizers)
 * - vote:decrypted - Votes decrypted
 * - candidate:added - New candidate added
 * - coorganizer:added - Co-organizer added
 * - coorganizer:removed - Co-organizer removed
 */

export interface NotificationPayload {
  type: string;
  electionId?: number;
  data?: any;
  timestamp: string;
  message?: string;
}

export class WebSocketService {
  private io: SocketIOServer | null = null;
  private connectedClients: Map<string, Socket> = new Map();

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HttpServer): void {
    // Allowed origins for WebSocket CORS
    const allowedOrigins = [
      process.env.CORS_ORIGIN,
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'https://localhost:3000',
      'https://localhost:3001',
      'https://localhost:3002',
    ].filter(Boolean);

    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupEventHandlers();
    logger.info('WebSocket service initialized');
  }

  /**
   * Setup Socket.io event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      const clientId = socket.id;
      this.connectedClients.set(clientId, socket);

      logger.info('Client connected', {
        clientId,
        totalClients: this.connectedClients.size,
      });

      // Handle client joining election room
      socket.on('join:election', (electionId: number) => {
        const room = `election:${electionId}`;
        socket.join(room);
        logger.info('Client joined election room', { clientId, electionId, room });
      });

      // Handle client leaving election room
      socket.on('leave:election', (electionId: number) => {
        const room = `election:${electionId}`;
        socket.leave(room);
        logger.info('Client left election room', { clientId, electionId, room });
      });

      // Handle client subscribing to organizer events
      socket.on('subscribe:organizer', (address: string) => {
        const room = `organizer:${address}`;
        socket.join(room);
        logger.info('Client subscribed to organizer events', { clientId, address, room });
      });

      // Handle client unsubscribing from organizer events
      socket.on('unsubscribe:organizer', (address: string) => {
        const room = `organizer:${address}`;
        socket.leave(room);
        logger.info('Client unsubscribed from organizer events', { clientId, address, room });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.connectedClients.delete(clientId);
        logger.info('Client disconnected', {
          clientId,
          totalClients: this.connectedClients.size,
        });
      });

      // Send welcome message
      socket.emit('connected', {
        clientId,
        message: 'Connected to DEMOCRATIX WebSocket server',
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * Notify all clients in an election room
   */
  notifyElection(electionId: number, event: string, data: any): void {
    if (!this.io) {
      logger.warn('WebSocket not initialized, skipping notification');
      return;
    }

    const room = `election:${electionId}`;
    const payload: NotificationPayload = {
      type: event,
      electionId,
      data,
      timestamp: new Date().toISOString(),
    };

    this.io.to(room).emit(event, payload);

    logger.info('Election notification sent', {
      room,
      event,
      electionId,
      clients: this.io.sockets.adapter.rooms.get(room)?.size || 0,
    });
  }

  /**
   * Notify organizer (all clients subscribed to organizer address)
   */
  notifyOrganizer(address: string, event: string, data: any): void {
    if (!this.io) {
      logger.warn('WebSocket not initialized, skipping notification');
      return;
    }

    const room = `organizer:${address}`;
    const payload: NotificationPayload = {
      type: event,
      data,
      timestamp: new Date().toISOString(),
    };

    this.io.to(room).emit(event, payload);

    logger.info('Organizer notification sent', {
      room,
      event,
      address,
      clients: this.io.sockets.adapter.rooms.get(room)?.size || 0,
    });
  }

  /**
   * Broadcast to all connected clients
   */
  broadcast(event: string, data: any): void {
    if (!this.io) {
      logger.warn('WebSocket not initialized, skipping broadcast');
      return;
    }

    const payload: NotificationPayload = {
      type: event,
      data,
      timestamp: new Date().toISOString(),
    };

    this.io.emit(event, payload);

    logger.info('Broadcast sent', {
      event,
      totalClients: this.connectedClients.size,
    });
  }

  /**
   * Get number of connected clients
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Get number of clients in election room
   */
  getElectionRoomSize(electionId: number): number {
    if (!this.io) return 0;
    const room = `election:${electionId}`;
    return this.io.sockets.adapter.rooms.get(room)?.size || 0;
  }

  /**
   * Get Socket.io instance
   */
  getIO(): SocketIOServer | null {
    return this.io;
  }

  /**
   * Close WebSocket server
   */
  close(): void {
    if (this.io) {
      this.io.close();
      this.connectedClients.clear();
      logger.info('WebSocket service closed');
    }
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
