import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/analytics-dashboard/analytics-dashboard.component';
import { MerchantListComponent } from './features/inquiries/merchant-list/merchant-list.component';
import { MerchantDetailComponent } from './features/inquiries/merchant-detail/merchant-detail.component';
import { authGuard } from './core/guards/auth-guard';
import { LayoutComponent } from './shared/components/layout/layout.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },

  { 
    path: '', 
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'users', component: DashboardComponent }, 
      { path: 'merchants', component: MerchantListComponent },
      { path: 'merchants/:id', component: MerchantDetailComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];