import api from './api';

/**
 * Login directo por correo — retorna Firebase custom token sin código OTP.
 * Backend: POST /auth/otp/login
 */
export const loginDirect = async (email: string): Promise<{ token: string }> => {
  const response = await api.post('/auth/otp/login', { email });
  return response.data;
};

/**
 * Solicita al backend que envíe un código OTP al correo indicado.
 * Backend: POST /auth/otp/send
 */
export const sendOtpCode = async (email: string): Promise<void> => {
  await api.post('/auth/otp/send', { email });
};

/**
 * Verifica el código OTP y retorna un Firebase custom token.
 * Backend: POST /auth/otp/verify
 */
export const verifyOtpCode = async (
  email: string,
  code: string
): Promise<{ token: string }> => {
  const response = await api.post('/auth/otp/verify', { email, code });
  return response.data;
};

/**
 * Registra un usuario nuevo vía OTP (sin contraseña).
 * Backend: POST /auth/otp/register
 */
export const registerWithEmail = async (
  email: string,
  name: string,
  organizationId: string
): Promise<void> => {
  await api.post('/auth/otp/register', { email, name, organizationId });
};
