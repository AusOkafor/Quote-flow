import { useState, useEffect, useCallback } from 'react';
import { paymentsApi } from '@/services/api';
import type { PaymentAccount, ConnectWiPayRequest, PaymentProcessor } from '@/types';

export function usePayments() {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await paymentsApi.listAccounts();
      setAccounts(data ?? []);
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const connectWiPay = async (body: ConnectWiPayRequest) => {
    await paymentsApi.connectWiPay(body);
    const updated = await paymentsApi.listAccounts();
    setAccounts(updated ?? []);
  };

  const connectStripe = async () => {
    const { url } = await paymentsApi.connectStripe();
    window.location.href = url;
  };

  const connectPayPal = async () => {
    const { url } = await paymentsApi.connectPayPal();
    window.open(url, '_blank');
  };

  const disconnect = async (processor: PaymentProcessor) => {
    await paymentsApi.disconnect(processor);
    setAccounts((prev) => prev.filter((a) => a.processor !== processor));
  };

  const isConnected = (processor: PaymentProcessor) =>
    accounts.some((a) => a.processor === processor && a.is_active);

  return {
    accounts,
    loading,
    connectWiPay,
    connectStripe,
    connectPayPal,
    disconnect,
    isConnected,
    refresh: load,
  };
}
