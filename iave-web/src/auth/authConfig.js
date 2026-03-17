import { UserManager, WebStorageStateStore } from "oidc-client-ts";

// --- CONFIGURACIÓN DEL SERVIDOR DE IDENTIDAD ---
const AUTHORITY_URL = "https://192.168.1.250:8086";
const CLIENT_ID = "DevIAVE_ATM";
// NOTA: Para Resource Owner Password, a veces se requiere Client Secret si el cliente no es "public".
// Si te da error "invalid_client", se debe configurar el secreto o configurar el cliente como público.
const CLIENT_SECRET = ""; 

const METADATA = {
    issuer: AUTHORITY_URL,
    authorization_endpoint: "https://192.168.1.250:8086/oauth2/authorize", 
    token_endpoint: "https://192.168.1.250:8086/oauth2/token", // <--- Endpoint correcto
    userinfo_endpoint: "https://192.168.1.250:8086/userinfo", // <--- Endpoint correcto
    end_session_endpoint: "https://192.168.1.250:8086/connect/logout", // <--- Endpoint correcto
    jwks_uri: "https://192.168.1.250:8086/oauth2/jwks",
};

const oidcConfig = {
  authority: AUTHORITY_URL,
  client_id: CLIENT_ID,
  

  redirect_uri: "https://192.168.1.104:3000/callback", 
  post_logout_redirect_uri: "https://192.168.1.104:3000/",
  
  response_type: "code",
  scope: "openid", 
  
  metadata: METADATA,
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  automaticSilentRenew: true, 
};

export const userManager = new UserManager(oidcConfig);

// Exportamos configuración para uso manual en AuthContext
export const IDP_CONFIG = {
    token_endpoint: METADATA.token_endpoint,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    scope: oidcConfig.scope
};
