import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clientConfig } from "@/clients";
import { auth } from "@/services/firebaseConfig";

export interface Data<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}
export interface SearchData<T> {
  data: Data<T>;
}

const api = axios.create({
  baseURL: clientConfig.apiUrl,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor de solicitudes — inyecta token Firebase, x-bundle-id y x-organization-id
api.interceptors.request.use(
  async (config) => {
    // 1. Firebase Auth token
    const user = auth.currentUser;
    if (user) {
      try {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch {
        // Token refresh failed — request continues without auth header
      }
    }

    // 2. Bundle ID — UX hint for tenant resolution (NOT security mechanism)
    config.headers["x-bundle-id"] = clientConfig.bundleId;

    // 3. Organization ID — for explicit multi-org context switching
    const orgId = await AsyncStorage.getItem("x-organization-id");
    if (orgId) {
      config.headers["x-organization-id"] = orgId;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Interceptor de respuestas
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Error en la respuesta:", error);
    return Promise.reject(error);
  },
);

export default api;
