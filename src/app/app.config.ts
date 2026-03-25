import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withRouterConfig, RouteReuseStrategy } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http'; 
import { authInterceptor } from './core/interceptors/auth-interceptor';
import { routes } from './app.routes';
import { ActivatedRouteSnapshot, DetachedRouteHandle } from '@angular/router';

// Never reuse any route — forces ngOnInit to re-run on every navigation
class NoReuseStrategy implements RouteReuseStrategy {
  shouldDetach(): boolean { return false; }
  store(): void {}
  shouldAttach(): boolean { return false; }
  retrieve(): DetachedRouteHandle | null { return null; }
  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return false;
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withRouterConfig({ onSameUrlNavigation: 'reload' })),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: RouteReuseStrategy, useClass: NoReuseStrategy }
  ]
};
