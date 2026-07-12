import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export const useReportsData = () => {
  return useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      // Mock data matching blueprints
      return {
        utilization: [
          { department: 'Engineering', rate: 78 },
          { department: 'Design', rate: 64 },
          { department: 'Marketing', rate: 45 },
          { department: 'Sales', rate: 52 },
          { department: 'Support', rate: 60 }
        ],
        maintenanceFrequency: [
          { month: 'Jan', count: 3 },
          { month: 'Feb', count: 5 },
          { month: 'Mar', count: 2 },
          { month: 'Apr', count: 8 },
          { month: 'May', count: 6 },
          { month: 'Jun', count: 12 }
        ],
        mostUsed: [
          { name: 'MacBook Pro M2 (AF-0001)', bookings: 42, type: 'Laptop' },
          { name: 'Conference Room A (AF-0012)', bookings: 38, type: 'Room' },
          { name: 'Dell UltraSharp 27" (AF-0002)', bookings: 34, type: 'Monitor' }
        ],
        idle: [
          { name: 'Sony WH-1000XM4 (AF-0098)', idleDays: 62, type: 'Headphones' },
          { name: 'iPhone 13 Test Device (AF-0076)', idleDays: 45, type: 'Phone' }
        ]
      };
    }
  });
};
