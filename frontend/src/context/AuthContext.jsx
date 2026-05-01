/**
 * Contexto de Autenticación
 * Refactorizado para usar SessionValidator centralizado
 */

import { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from "react";
import authService from "../utils/AuthService.js";
import sessionValidator from "../utils/SessionValidator.js";

const STORAGE_KEY = "authData";

const initialState = {
  user: null,
  token: null,
  loading: true,
  isValidating: false,
};

function sessionReducer(state, action) {
  switch (action.type) {
    case "RESTORE_SESSION":
    case "SET_USER":
      return { ...state, user: action.payload.user, token: action.payload.token || state.token, loading: false };

    case "CLEAR_SESSION":
      return { ...state, user: null, token: null, loading: false };

    case "START_VALIDATION":
      return { ...state, isValidating: true };

    case "FINISH_VALIDATION":
      return { ...state, isValidating: false };

    case "FINISH_LOADING":
      return { ...state, loading: false };

    default:
      return state;
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  /**
   * Inicializar sesión
   */
  useEffect(() => {
    const initializeSession = async () => {
      // Intentar restaurar sesión desde localStorage
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.user) {
            dispatch({ type: "RESTORE_SESSION", payload: { user: parsed.user, token: parsed.token } });
            return;
          }
        } catch (error) {
          console.warn("[AuthContext] Sesión corrupta", error);
          localStorage.removeItem(STORAGE_KEY);
        }
      }

      // Si no hay sesión almacenada, intentar obtener desde el servidor
      try {
        const user = await authService.getSessionInfo();
        if (user) {
          dispatch({ type: "RESTORE_SESSION", payload: { user } });
        }
      } catch (error) {
        console.debug("[AuthContext] No hay sesión activa");
      } finally {
        dispatch({ type: "FINISH_LOADING" });
      }
    };

    initializeSession();
  }, []);

  /**
   * Persistir sesión en localStorage y escuchar expiración
   */
  useEffect(() => {
    if (state.loading) {
      return undefined;
    }

    if (state.user) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          user: state.user,
          token: state.token,
          timestamp: Date.now(),
        })
      );

      // Escuchar evento de sesión expirada del ApiClient
      const handleExpired = () => {
        dispatch({ type: "CLEAR_SESSION" });
        localStorage.removeItem(STORAGE_KEY);
        window.location.href = "/login?session-expired=true";
      };
      window.addEventListener("condome:session-expired", handleExpired);

      // Iniciar validador de sesión cuando el usuario se autentica
      sessionValidator.onSessionExpired = () => {
        dispatch({ type: "CLEAR_SESSION" });
        localStorage.removeItem(STORAGE_KEY);
        window.location.href = "/login?session-expired=true";
      };
      sessionValidator.start();

      return () => {
        window.removeEventListener("condome:session-expired", handleExpired);
      };
    } else {
      localStorage.removeItem(STORAGE_KEY);
      sessionValidator.stop();
    }
  }, [state.loading, state.token, state.user]);

  /**
   * Login
   */
  const login = useCallback(async (credentials) => {
    dispatch({ type: "START_VALIDATION" });
    try {
      const response = await authService.login(credentials);
      dispatch({ type: "SET_USER", payload: { user: response.user, token: response.token } });
      return response.user;
    } finally {
      dispatch({ type: "FINISH_VALIDATION" });
    }
  }, []);

  /**
   * Refrescar sesión
   */
  const refreshSession = useCallback(async () => {
    dispatch({ type: "START_VALIDATION" });
    try {
      const user = await authService.getSessionInfo();
      if (user) {
        dispatch({ type: "SET_USER", payload: { user } });
      }
      return user;
    } finally {
      dispatch({ type: "FINISH_VALIDATION" });
    }
  }, []);

  /**
   * Registrar nuevo usuario
   * No autentica al usuario — espera verificación de email.
   * Guarda el token en localStorage para que verifyEmail pueda usarlo.
   */
  const register = useCallback(async (form) => {
    dispatch({ type: "START_VALIDATION" });
    try {
      const response = await authService.register(form);
      if (response?.user) {
        dispatch({ type: "SET_USER", payload: { user: response.user, token: response.token } });
      }
      return response;
    } finally {
      dispatch({ type: "FINISH_VALIDATION" });
    }
  }, []);

  /**
   * Logout
   */
  const logout = useCallback(async () => {
    dispatch({ type: "START_VALIDATION" });
    try {
      await authService.logout();
    } catch (error) {
      console.error("[AuthContext] Error durante logout", error);
    } finally {
      dispatch({ type: "CLEAR_SESSION" });
      dispatch({ type: "FINISH_VALIDATION" });
    }
  }, []);

  /**
   * Cambiar contraseña
   */
  const changePassword = useCallback(async (payload) => {
    const result = await authService.changePassword(payload);
    return result;
  }, []);

  /**
   * Actualizar perfil
   */
  const updateProfile = useCallback(async (payload) => {
    const result = await authService.updateProfile(payload);
    if (result?.user) {
      dispatch({ type: "SET_USER", payload: { user: result.user } });
    }
    return result;
  }, []);

  /**
   * Verificar email — autentica al usuario tras la verificación exitosa
   */
  const verifyEmail = useCallback(async (token) => {
    const result = await authService.verifyEmail(token);
    if (result?.user && result?.token) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          token: result.token,
          user: result.user,
          timestamp: Date.now(),
        })
      );
      dispatch({ type: "SET_USER", payload: { user: result.user, token: result.token } });
    }
    return result;
  }, []);

  /**
   * Completar onboarding
   */
  const completeOnboarding = useCallback(async () => {
    const result = await authService.completeOnboarding();
    if (result?.user) {
      dispatch({ type: "SET_USER", payload: { user: result.user } });
    }
    return result;
  }, []);

  const value = useMemo(
    () => ({
      user: state.user,
      token: state.token,
      isAuth: Boolean(state.user),
      loading: state.loading,
      isValidating: state.isValidating,
      login,
      refreshSession,
      register,
      logout,
      changePassword,
      updateProfile,
      verifyEmail,
      completeOnboarding,
    }),
    [state.user, state.token, state.loading, state.isValidating, login, refreshSession, register, logout, changePassword, updateProfile, verifyEmail, completeOnboarding]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return context;
}
