/**
 * Hook centralizado de autenticación para uso dentro de módulos.
 * Abstrae el AuthContext — los módulos no importan AuthContext directamente.
 */
import { useAuth as useAuthContext } from '@/context/AuthContext';

export const useAuth = useAuthContext;
