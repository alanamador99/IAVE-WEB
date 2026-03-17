import React, { createContext, useEffect, useState } from "react";
import { userManager, IDP_CONFIG } from "../auth/authConfig";
import { User } from "oidc-client-ts";

export const AuthContext = createContext({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  role: null,
  login: () => {},
  // loginWithPassword: async () => {}, // Deshabilitado
  logout: () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper para decodificar JWT manualmente (si no se carga directo de oidc-client)
  const parseJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error("Error parseando JWT", e);
      return {};
    }
  };

  // --- FUNCIÓN DE LOGIN MANUAL (Username/Password) ---
  const loginWithPassword = async (username, password) => {
    // 1. Construir la petición al token endpoint de IDP_CONFIG
    // ... (lógica movida arriba, pero asegurando userManager.storeUser)
    
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('client_id', IDP_CONFIG.client_id);
    if (IDP_CONFIG.client_secret) params.append('client_secret', IDP_CONFIG.client_secret);
    params.append('username', username);
    params.append('password', password);
    params.append('scope', IDP_CONFIG.scope || "openid");

    try {
      const response = await fetch(IDP_CONFIG.token_endpoint, {
         method: 'POST',
         headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
         body: params
      });

      if (!response.ok) {
         const err = await response.text();
         throw new Error(`Error ${response.status}: ${err}`);
      }

      const data = await response.json();
      
      // CREAR OBJETO USER COMPATIBLE CON OIDC-CLIENT-TS
      // Esto es crucial: oidc-client espera un objeto 'User' con profile decodificado
      const profile = parseJwt(data.id_token || data.access_token); // id_token preferible
      const userObj = new User({
          id_token: data.id_token,
          session_state: data.session_state,
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          token_type: data.token_type,
          scope: data.scope,
          profile: profile,
          expires_at: Math.floor(Date.now() / 1000) + data.expires_in
      });

      // Guardar en almacenamiento persistente (localStorage)
      await userManager.storeUser(userObj);
      
      // Actualizar estado React
      setUser(userObj);
      return userObj;
    } catch (e) {
      console.error("Login password failed", e);
      throw e;
    }
  };


  useEffect(() => {
    // --- BYPASS DE AUTH PARA DESARROLLO ---
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("Test") === "1") {
      console.log("Modo Test activado: Saltando autenticación OAUTH");
      const mockUser = {
        profile: {
          sub: "test-user-id",
          name: "Alan",
          role: "admin", // Asumimos rol de admin para el test
          preferred_username: "test@example.com",
          roles: ["admin"] // Por si acaso usa 'roles'
        },
        access_token: "mock-access-token",
        expired: false,
        expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hora
      };
      setUser(mockUser);
      setIsLoading(false);
      return; 
    }
    // --------------------------------------

    // Intentar cargar usuario existente al iniciar
    userManager.getUser().then((loadedUser) => {
      if (loadedUser && !loadedUser.expired) {
        setUser(loadedUser);
      }
      setIsLoading(false);
    });

    // Suscribirse a eventos de OIDC
    const onUserLoaded = (loadedUser) => setUser(loadedUser);
    const onUserUnloaded = () => setUser(null);
    const onAccessTokenExpiring = () => console.log("Token expirando...");
    const onAccessTokenExpired = () => console.log("Token expirado");
    const onUserSignedOut = () => {
      console.log("Usuario cerró sesión en el proveedor");
      setUser(null);
    };

    userManager.events.addUserLoaded(onUserLoaded);
    userManager.events.addUserUnloaded(onUserUnloaded);
    userManager.events.addAccessTokenExpiring(onAccessTokenExpiring);
    userManager.events.addAccessTokenExpired(onAccessTokenExpired);
    userManager.events.addUserSignedOut(onUserSignedOut);

    return () => {
      userManager.events.removeUserLoaded(onUserLoaded);
      userManager.events.removeUserUnloaded(onUserUnloaded);
      userManager.events.removeAccessTokenExpiring(onAccessTokenExpiring);
      userManager.events.removeAccessTokenExpired(onAccessTokenExpired);
      userManager.events.removeUserSignedOut(onUserSignedOut);
    };
  }, []);

  const login = () => userManager.signinRedirect();
  const logout = () => userManager.signoutRedirect();

  // Función auxiliar para extraer el rol del token (depende de tu proveedor)
  // Ajusta 'role', 'roles', 'realm_access.roles', etc. según tu token
  const getRole = () => {
    if (!user || user.expired) return "invitado";
    // OJO: Revisar nombre exacto de campo rol en tu JWT
    const profile = user.profile || {};
    return profile.role || profile.roles || profile.realm_access?.roles || "admin"; // Ajuste temporal
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user && !user.expired,
    role: getRole(), 
    authError: null,
    login: () => userManager.signinRedirect(), // Login redirect standard
    // loginWithPassword, // COMENTADO: Servidor no soporta grant type password
    logout: () => userManager.signoutRedirect(), // Logout completo (redirige al servidor)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
