import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebSocket_Url } from '../Api';
import { Parceldetails } from '../Api/apiRequest';
import { successToast } from '../utils/customToast';

export type CounterOfferAcceptedPayload = {
  type: string;
  parcelId?: number;
  offerId?: number;
  status?: string;
  acceptedBy?: string;
  deliveryUserId?: number;
  driver?: { name?: string; image?: string };
  pickupOtp?: string;
  deliveryOtp?: string;
  timestamp?: string;
  notifyType?: string;
  title?: string;
  message?: string;
};

type DashboardContextType = {
  counterOfferAcceptedModal: {
    visible: boolean;
    data: CounterOfferAcceptedPayload | null;
  };
  setCounterOfferAcceptedModal: (v: {
    visible: boolean;
    data: CounterOfferAcceptedPayload | null;
  }) => void;
  generalAlert: {
    visible: boolean;
    title?: string;
    message?: string;
    type?: 'success' | 'error' | 'info';
    onClose?: () => void;
  };
  setGeneralAlert: (v: {
    visible: boolean;
    title?: string;
    message?: string;
    type?: 'success' | 'error' | 'info';
    onClose?: () => void;
  }) => void;
  registerOrderUpdateCallback: (cb: () => void) => void;
  getParceldetailsApi: (setLoading: (v: boolean) => void) => Promise<void>;
  orderData: any[];
  setOrderData: (data: any[]) => void;
};

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [counterOfferAcceptedModal, setCounterOfferAcceptedModal] = useState<{
    visible: boolean;
    data: CounterOfferAcceptedPayload | null;
  }>({ visible: false, data: null });
  const [generalAlert, setGeneralAlert] = useState<{
    visible: boolean;
    title?: string;
    message?: string;
    type?: 'success' | 'error' | 'info';
    onClose?: () => void;
  }>({ visible: false });
  const [orderData, setOrderData] = useState<any[]>([]);
  const orderUpdateCallbackRef = useRef<(() => void) | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const getParceldetailsApi = async (setLoading: (v: boolean) => void) => {
    try {
      const response = await Parceldetails(setLoading);
      if (response?.parcels) {
        setOrderData(response.parcels);
      }
    } catch (_) { }
  };

  const registerOrderUpdateCallback = (cb: () => void) => {
    orderUpdateCallbackRef.current = cb;
  };

  useEffect(() => {
    const connectSocket = (token: string) => {
      return new Promise<void>((resolve, reject) => {
        try {
          const wsUrl = `${WebSocket_Url}/user?token=${encodeURIComponent(token)}`;
          const ws = new WebSocket(wsUrl);
          let resolved = false;

          ws.onopen = () => {
            resolved = true;
            socketRef.current = ws;
            try {
              ws.send(JSON.stringify({ type: 'ping' }));
            } catch (_) { }
            resolve();
          };

          ws.onmessage = async (event: { data: string | Blob | ArrayBuffer }) => {
            let raw: string;
            const d = event.data;
            if (typeof d === 'string') raw = d;
            else if (d && typeof (d as Blob).text === 'function')
              raw = await (d as Blob).text();
            else raw = new TextDecoder().decode(d as ArrayBuffer);

            try {
              const data = JSON.parse(raw);
              if (data?.type === 'parcel_status_update') {
                successToast(data?.message || 'Parcels successfully');
                orderUpdateCallbackRef.current?.();
              }
              if (data?.type === 'counter_offer_accepted') {
                setCounterOfferAcceptedModal({
                  visible: true,
                  data: data as CounterOfferAcceptedPayload,
                });
              }
              if (data?.type === 'order_update' || data?.refreshOrders) {
                orderUpdateCallbackRef.current?.();
              }
            } catch (_) { }
          };

          ws.onerror = () => {
            if (!resolved) reject(new Error('WebSocket error'));
          };

          ws.onclose = () => {
            socketRef.current = null;
            if (!resolved) reject(new Error('Connection closed'));
          };
        } catch (e) {
          reject(e instanceof Error ? e : new Error(String(e)));
        }
      });
    };

    const init = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;
        await connectSocket(token);
      } catch (_) { }
    };

    init();
    return () => {
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, []);

  const value: DashboardContextType = {
    counterOfferAcceptedModal,
    setCounterOfferAcceptedModal,
    generalAlert,
    setGeneralAlert,
    registerOrderUpdateCallback,
    getParceldetailsApi,
    orderData,
    setOrderData,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext() {
  return useContext(DashboardContext);
}
