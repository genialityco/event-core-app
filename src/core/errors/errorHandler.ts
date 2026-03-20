import { Alert } from 'react-native';

/**
 * Manejo centralizado de errores de la app.
 * Todos los módulos usan esto en vez de Alert.alert directo.
 */

export type AppError = {
  message: string;
  code?: string;
  context?: string;
};

/** Muestra un error al usuario y lo registra en consola */
export const handleError = (error: unknown, context?: string): AppError => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'Ha ocurrido un error inesperado';

  const appError: AppError = { message, context };

  console.error(`[${context ?? 'App'}]`, message, error);

  Alert.alert('Error', message);

  return appError;
};

/** Solo registra el error sin mostrar al usuario (para errores silenciosos) */
export const logError = (error: unknown, context?: string): void => {
  console.error(`[${context ?? 'App'}]`, error);
};
