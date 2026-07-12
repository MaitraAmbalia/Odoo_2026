import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';
import { useQueryClient } from '@tanstack/react-query';

export const useSocket = () => {
  const queryClient = useQueryClient();
  const { user, role, token, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !token || !user) return;

    // Connect socket
    const socket = io('http://localhost:4000', {
      auth: { token },
      transports: ['websocket']
    });

    socket.on('connect', () => {
      console.log('Connected to socket server');
      // Join rooms
      socket.emit('room:join', { userId: user.id, role, departmentId: user.departmentId });
    });

    // Handle incoming notification event
    socket.on('notification:new', (notif) => {
      console.log('New notification received via socket:', notif);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    // Handle booking updates
    socket.on('booking:updated', (data) => {
      console.log('Booking update notification received:', data);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    });

    // Handle role updates
    socket.on('role:changed', (data) => {
      console.log('Role update received:', data);
      // For real implementation: we would trigger auth/me query invalidation
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, token, user, role, queryClient]);
};
