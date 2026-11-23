import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

export function useApi<T>(fn: () => Promise<T>) {
  const [resultado, setResultado] = useState<{
    consulta: () => Promise<T>;
    version: number;
    data: T | null;
    error: string | null;
  }>();
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useFocusEffect(useCallback(() => {
    let vigente = true;
    Promise.resolve().then(fn).then(
      (data) => {
        if (vigente) setResultado({ consulta: fn, version, data, error: null });
      },
      (error: unknown) => {
        if (vigente) setResultado({
          consulta: fn, version, data: null,
          error: error instanceof Error ? error.message : 'No se pudo cargar la información.',
        });
      },
    );
    return () => { vigente = false; };
  }, [fn, version]));

  const actual = resultado?.consulta === fn && resultado.version === version ? resultado : undefined;
  return { data: actual?.data ?? null, error: actual?.error ?? null, reload };
}
