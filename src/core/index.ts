// Componentes
export { BaseScreen } from './components/BaseScreen';
export { AppHeader } from './components/AppHeader';

// Hooks
export { useApi } from './hooks/useApi';
export { useAuth } from './hooks/useAuth';

// Errores
export { handleError, logError } from './errors/errorHandler';
export type { AppError } from './errors/errorHandler';

// HTTP
export { get, post, put, del } from './http/httpClient';

// Settings (pantalla de sistema, siempre disponible)
export { SettingsScreen } from './settings';
