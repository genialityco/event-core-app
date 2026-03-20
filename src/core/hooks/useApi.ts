import { useState, useCallback, useRef } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends ApiState<T> {
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

/**
 * Hook para llamadas a la API con manejo automático de loading y error.
 *
 * @example
 * const { data, loading, error, execute } = useApi(travelerService.getInfo);
 * useEffect(() => { execute(); }, []);
 */
export function useApi<T>(
  fn: (...args: any[]) => Promise<T>,
): UseApiReturn<T> {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  // Previene actualizar estado si el componente se desmontó
  const mounted = useRef(true);

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const result = await fn(...args);
        if (mounted.current) {
          setState({ data: result, loading: false, error: null });
        }
        return result;
      } catch (err: any) {
        if (mounted.current) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: err.message ?? 'Error desconocido',
          }));
        }
        return null;
      }
    },
    [fn],
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}
