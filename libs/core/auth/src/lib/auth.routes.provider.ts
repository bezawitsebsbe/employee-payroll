import { provideRouter, Routes } from '@angular/router';
import { AUTH_ROUTES } from './auth.routes';

export function provideAuthRoutes(): Routes {
  return AUTH_ROUTES;
}

// Simpler export
export const authRoutes = AUTH_ROUTES;
