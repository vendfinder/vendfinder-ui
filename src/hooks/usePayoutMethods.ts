'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  fetchPayoutMethods,
  createPayoutMethod,
  updatePayoutMethod,
  setPrimaryPayoutMethod,
  deletePayoutMethod,
} from '@/lib/api-orders';
import type { PayoutMethod, PayoutMethodType } from '@/types';

interface UsePayoutMethodsReturn {
  methods: PayoutMethod[];
  loading: boolean;
  error: string | null;
  addMethod: (data: {
    method_type: PayoutMethodType;
    account_id: string;
    label?: string;
    account_name?: string;
    national_id?: string;
    date_of_birth?: string;
    address?: string;
  }) => Promise<void>;
  editMethod: (
    id: string,
    data: {
      label?: string;
      account_id?: string;
      account_name?: string;
      national_id?: string;
      date_of_birth?: string;
      address?: string;
    }
  ) => Promise<void>;
  setPrimary: (id: string) => Promise<void>;
  removeMethod: (id: string) => Promise<void>;
  refetch: () => void;
}

export function usePayoutMethods(): UsePayoutMethodsReturn {
  const { token, isAuthenticated } = useAuth();
  const [methods, setMethods] = useState<PayoutMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchCount, setFetchCount] = useState(0);

  const refetch = useCallback(() => setFetchCount((c) => c + 1), []);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPayoutMethods(token)
      .then((data) => {
        if (!cancelled) setMethods(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, token, fetchCount]);

  const addMethod = useCallback(
    async (data: {
      method_type: PayoutMethodType;
      account_id: string;
      label?: string;
      account_name?: string;
      national_id?: string;
      date_of_birth?: string;
      address?: string;
    }) => {
      if (!token) return;
      await createPayoutMethod(data, token);
      refetch();
    },
    [token, refetch]
  );

  const editMethod = useCallback(
    async (
      id: string,
      data: {
        label?: string;
        account_id?: string;
        account_name?: string;
        national_id?: string;
        date_of_birth?: string;
        address?: string;
      }
    ) => {
      if (!token) return;
      await updatePayoutMethod(id, data, token);
      refetch();
    },
    [token, refetch]
  );

  const setPrimary = useCallback(
    async (id: string) => {
      if (!token) return;
      await setPrimaryPayoutMethod(id, token);
      refetch();
    },
    [token, refetch]
  );

  const removeMethod = useCallback(
    async (id: string) => {
      if (!token) return;
      await deletePayoutMethod(id, token);
      refetch();
    },
    [token, refetch]
  );

  return {
    methods,
    loading,
    error,
    addMethod,
    editMethod,
    setPrimary,
    removeMethod,
    refetch,
  };
}
