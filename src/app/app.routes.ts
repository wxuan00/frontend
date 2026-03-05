import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { MfaComponent } from './features/auth/mfa/mfa.component';
import { DashboardComponent } from './features/dashboard/analytics-dashboard/analytics-dashboard.component';
import { UserListComponent } from './features/admin/user-list/user-list.component';
import { UserFormComponent } from './features/admin/user-form/user-form.component';
import { RoleListComponent } from './features/admin/role-list/role-list.component';
import { RoleFormComponent } from './features/admin/role-form/role-form.component';
import { MerchantListComponent } from './features/inquiries/merchant-list/merchant-list.component';
import { MerchantDetailComponent } from './features/inquiries/merchant-detail/merchant-detail.component';
import { MerchantFormComponent } from './features/inquiries/merchant-form/merchant-form.component';
import { TransactionListComponent } from './features/inquiries/transaction-list/transaction-list.component';
import { TransactionDetailComponent } from './features/inquiries/transaction-detail/transaction-detail.component';
import { SettlementListComponent } from './features/inquiries/settlement-list/settlement-list.component';
import { SettlementDetailComponent } from './features/inquiries/settlement-detail/settlement-detail.component';
import { CreditAdviceListComponent } from './features/inquiries/credit-advice-list/credit-advice-list.component';
import { CreditAdviceDetailComponent } from './features/inquiries/credit-advice-detail/credit-advice-detail.component';
import { RefundListComponent } from './features/inquiries/refund-list/refund-list.component';
import { RefundDetailComponent } from './features/inquiries/refund-detail/refund-detail.component';
import { ViewProfileComponent } from './features/profile/view-profile/view-profile.component';
import { EditProfileComponent } from './features/profile/edit-profile/edit-profile.component';
import { ChangePasswordComponent } from './features/profile/change-password/change-password.component';
import { SummaryReportComponent } from './features/reports/summary-report/summary-report.component';
import { AiAnalyticsComponent } from './features/analytics/ai-analytics/ai-analytics.component';
import { authGuard } from './core/guards/auth-guard';
import { adminGuard } from './core/guards/admin-guard';
import { LayoutComponent } from './shared/components/layout/layout.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'mfa', component: MfaComponent },

  { 
    path: '', 
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'analytics', component: AiAnalyticsComponent },

      // Admin-only routes: User management
      { path: 'users', component: UserListComponent, canActivate: [adminGuard] },
      { path: 'users/new', component: UserFormComponent, canActivate: [adminGuard] },
      { path: 'users/:id/edit', component: UserFormComponent, canActivate: [adminGuard] },
      
      // Admin-only routes: Role management
      { path: 'roles', component: RoleListComponent, canActivate: [adminGuard] },
      { path: 'roles/new', component: RoleFormComponent, canActivate: [adminGuard] },
      { path: 'roles/:id/edit', component: RoleFormComponent, canActivate: [adminGuard] },

      // Merchant inquiry - accessible by all (filtered by role in backend)
      { path: 'merchants', component: MerchantListComponent },
      { path: 'merchants/new', component: MerchantFormComponent, canActivate: [adminGuard] },
      { path: 'merchants/:id/edit', component: MerchantFormComponent, canActivate: [adminGuard] },
      { path: 'merchants/:id', component: MerchantDetailComponent },

      // Transaction inquiry - accessible by all (filtered by role in backend)
      { path: 'transactions', component: TransactionListComponent },
      { path: 'transactions/:id', component: TransactionDetailComponent },

      // Settlement inquiry - accessible by all (filtered by role in backend)
      { path: 'settlements', component: SettlementListComponent },
      { path: 'settlements/:id', component: SettlementDetailComponent },

      // Credit Advice inquiry - accessible by all (filtered by role in backend)
      { path: 'credit-advices', component: CreditAdviceListComponent },
      { path: 'credit-advices/:id', component: CreditAdviceDetailComponent },

      // Refund inquiry - accessible by all (filtered transactions of type REFUND)
      { path: 'refunds', component: RefundListComponent },
      { path: 'refunds/:id', component: RefundDetailComponent },

      // Reports - accessible by all authenticated users
      { path: 'reports', component: SummaryReportComponent },

      // Profile management - accessible by all authenticated users
      { path: 'profile', component: ViewProfileComponent },
      { path: 'profile/edit', component: EditProfileComponent },
      { path: 'profile/change-password', component: ChangePasswordComponent },

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];