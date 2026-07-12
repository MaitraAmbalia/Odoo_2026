import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { UserRole } from '../../types/enums';

interface RoleGateProps {
  allow: UserRole[];
  children: React.ReactNode;
}

export const RoleGate: React.FC<RoleGateProps> = ({ allow, children }) => {
  const role = useAuthStore(state => state.role);

  if (!role || !allow.includes(role)) {
    return null;
  }

  return <>{children}</>;
};
