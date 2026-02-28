import React, { createContext, useContext } from 'react';
import ToastContainer from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';

const ToastCtx = createContext<ReturnType<typeof useToast>['toast']>(() => {});

export function useAppToast() {
  return useContext(ToastCtx);
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, toast, dismiss } = useToast();
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastCtx.Provider>
  );
}
