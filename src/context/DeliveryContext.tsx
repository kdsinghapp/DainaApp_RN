import React, { createContext, useContext } from 'react';
import { useDeliveryHome } from '../screen/DeliveryBottomTab/Delivery/DeliveryHome/useDeliveryHome';

const DeliveryContext = createContext<ReturnType<typeof useDeliveryHome> | null>(null);

export function DeliveryProvider({ children }: { children: React.ReactNode }) {
  const value = useDeliveryHome();
  return <DeliveryContext.Provider value={value}>{children}</DeliveryContext.Provider>;
}

export function useDeliveryContext() {
  const ctx = useContext(DeliveryContext);
  if (!ctx) return null;
  return ctx;
}
