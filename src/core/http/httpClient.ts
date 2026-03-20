/**
 * Cliente HTTP base para todos los módulos.
 * Centraliza el manejo de errores, headers y base URL.
 * Los módulos NO importan axios directamente — importan esto.
 */
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { clientConfig } from '@/clients';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '@/services/firebaseConfig';

const httpClient = axios.create({
  baseURL: clientConfig.apiUrl,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Inyectar token Firebase + org en cada request
httpClient.interceptors.request.use(async (config) => {
  const token = await auth.currentUser?.getIdToken();
  const orgId = await AsyncStorage.getItem('x-organization-id');

  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (orgId) config.headers['x-organization-id'] = orgId;
  config.headers['x-bundle-id'] = clientConfig.bundleId;

  return config;
});

// Extraer data de la respuesta de forma consistente
httpClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Error de conexión';
    return Promise.reject(new Error(message));
  },
);

/** Wrapper tipado para GET */
export const get = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const res = await httpClient.get<{ data: T }>(url, config);
  return res.data?.data ?? (res.data as any);
};

/** Wrapper tipado para POST */
export const post = async <T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> => {
  const res = await httpClient.post<{ data: T }>(url, body, config);
  return res.data?.data ?? (res.data as any);
};

/** Wrapper tipado para PUT */
export const put = async <T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> => {
  const res = await httpClient.put<{ data: T }>(url, body, config);
  return res.data?.data ?? (res.data as any);
};

/** Wrapper tipado para DELETE */
export const del = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const res = await httpClient.delete<{ data: T }>(url, config);
  return res.data?.data ?? (res.data as any);
};

export default httpClient;
