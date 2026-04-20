declare module 'cookie-session' {
  interface CookieSessionObject {
    user?: {
      email: string;
      name: string;
    };
  }
}
