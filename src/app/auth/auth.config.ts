import {PassedInitialConfig} from 'angular-auth-oidc-client';

export const authConfig: PassedInitialConfig = {
  config: {
    redirectUrl: "/callback",
    postLogoutRedirectUri: window.location.origin + window.location.pathname,
    scope: 'openid profile email offline_access', // 'openid profile offline_access ' + your scopes
    responseType: 'code',
    silentRenew: true,
    useRefreshToken: true,
    renewTimeBeforeTokenExpiresInSeconds: 30,
    historyCleanupOff: false,
    secureRoutes: [],
    postLoginRoute: "/",
    // customParamsEndSessionRequest: [{
    //   "id_token_hint": "test"
    // }]
  }
}
