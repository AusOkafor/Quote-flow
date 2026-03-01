import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

const DataRefreshContext = createContext<{
  refreshTrigger: number;
  invalidate: () => void;
} | null>(null);

export function DataRefreshProvider({ children }: { children: ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const invalidate = useCallback(() => {
    setRefreshTrigger((n) => n + 1);
  }, []);
  return (
    <DataRefreshContext.Provider value={{ refreshTrigger, invalidate }}>
      {children}
    </DataRefreshContext.Provider>
  );
}

export function useDataRefresh() {
  const ctx = useContext(DataRefreshContext);
  return ctx;
}
