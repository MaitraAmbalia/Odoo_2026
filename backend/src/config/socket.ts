import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { env } from './env';

let io: any;

export function initSocket(httpServer: HttpServer): any {
  io = new SocketServer(httpServer, {
    cors: {
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    },
  } as any);

  io.on('connection', (socket: any) => {
    // Expect the client to send their userId + role + departmentId after connecting
    socket.on('join', (data: { userId: string; role: string; departmentId?: string }) => {
      // Personal room
      socket.join(`user:${data.userId}`);

      // Role-based room
      socket.join(`role:${data.role}`);

      // Department room
      if (data.departmentId) {
        socket.join(`department:${data.departmentId}`);
      }

      console.log(`Socket ${socket.id} joined rooms for user ${data.userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket ${socket.id} disconnected`);
    });
  });

  return io;
}

export function getIO(): any {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initSocket() first.');
  }
  return io;
}

// ── Emit helper functions ──────────────────────────────

/** Send to a specific user */
export function emitToUser(userId: string, event: string, payload: unknown): void {
  getIO().to(`user:${userId}`).emit(event, payload);
}

/** Send to all users with a specific role */
export function emitToRole(role: string, event: string, payload: unknown): void {
  getIO().to(`role:${role}`).emit(event, payload);
}

/** Send to all users in a specific department */
export function emitToDepartment(departmentId: string, event: string, payload: unknown): void {
  getIO().to(`department:${departmentId}`).emit(event, payload);
}

/** Broadcast a dashboard KPI update to everyone */
export function emitDashboardUpdate(payload: unknown): void {
  getIO().emit('dashboard:kpi-update', payload);
}

/** Emit a booking calendar update for a specific asset */
export function emitBookingUpdate(assetId: string): void {
  getIO().emit('booking:updated', { assetId });
}
