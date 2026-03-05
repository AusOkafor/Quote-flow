import { useState, useEffect, useCallback } from 'react';
import { paymentsApi } from '@/services/api';
import type { PaymentAccount, PaymentProcessor } from '@/types';

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

  const connectStripe = async () => {
    const { url } = await paymentsApi.connectStripe();
    window.location.href = url;
  };

  const connectPayPal = async () => {
    const { url } = await paymentsApi.connectPayPal();
    window.open(url, '_blank');
  };

  const connectWiPay = async (data: { account_number: string; api_key: string }) => {
    await paymentsApi.connectWiPay(data);
    await load();
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
    connectStripe,
    connectPayPal,
    connectWiPay,
    disconnect,
    isConnected,
    refresh: load,
  };
}
