import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { MfaComponent } from './features/auth/mfa/mfa.component';
import { DashboardComponent } from './features/dashboard/analytics-dashboard/analytics-dashboard.component';
import { UserListComponent } from './features/admin/user-list/user-list.component';
import { UserFormComponent } from './features/admin/user-form/user-form.component';
import { UserDetailComponent } from './features/admin/user-list/user-detail.component';
import { RoleListComponent } from './features/admin/role-list/role-list.component';
import { RoleFormComponent } from './features/admin/role-form/role-form.component';
import { RoleDetailComponent } from './features/admin/role-list/role-detail.component';
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
    runGuardsAndResolvers: 'always',
    children: [
      { path: 'dashboard', component: DashboardComponent, runGuardsAndResolvers: 'always' },

      // Admin-only routes: User management
      { path: 'users', component: UserListComponent, canActivate: [adminGuard], runGuardsAndResolvers: 'always' },
      { path: 'users/new', component: UserFormComponent, canActivate: [adminGuard], runGuardsAndResolvers: 'always' },
      { path: 'users/:id/edit', component: UserFormComponent, canActivate: [adminGuard], runGuardsAndResolvers: 'always' },
      { path: 'users/:id/view', component: UserDetailComponent, canActivate: [adminGuard], runGuardsAndResolvers: 'always' },
      
      // Admin-only routes: Role management
      { path: 'roles', component: RoleListComponent, canActivate: [adminGuard], runGuardsAndResolvers: 'always' },
      { path: 'roles/new', component: RoleFormComponent, canActivate: [adminGuard], runGuardsAndResolvers: 'always' },
      { path: 'roles/:id/edit', component: RoleFormComponent, canActivate: [adminGuard], runGuardsAndResolvers: 'always' },
      { path: 'roles/:id/view', component: RoleDetailComponent, canActivate: [adminGuard], runGuardsAndResolvers: 'always' },

      // Merchant inquiry - accessible by all (filtered by role in backend)
      { path: 'merchants', component: MerchantListComponent, runGuardsAndResolvers: 'always' },
      { path: 'merchants/new', component: MerchantFormComponent, canActivate: [adminGuard], runGuardsAndResolvers: 'always' },
      { path: 'merchants/:id/edit', component: MerchantFormComponent, canActivate: [adminGuard], runGuardsAndResolvers: 'always' },
      { path: 'merchants/:id', component: MerchantDetailComponent, runGuardsAndResolvers: 'always' },

      // Transaction inquiry - accessible by all (filtered by role in backend)
      { path: 'transactions', component: TransactionListComponent, runGuardsAndResolvers: 'always' },
      { path: 'transactions/:id', component: TransactionDetailComponent, runGuardsAndResolvers: 'always' },

      // Settlement inquiry - accessible by all (filtered by role in backend)
      { path: 'settlements', component: SettlementListComponent, runGuardsAndResolvers: 'always' },
      { path: 'settlements/:id', component: SettlementDetailComponent, runGuardsAndResolvers: 'always' },

      // Credit Advice inquiry - accessible by all (filtered by role in backend)
      { path: 'credit-advices', component: CreditAdviceListComponent, runGuardsAndResolvers: 'always' },
      { path: 'credit-advices/:id', component: CreditAdviceDetailComponent, runGuardsAndResolvers: 'always' },

      // Refund inquiry - accessible by all (filtered transactions of type REFUND)
      { path: 'refunds', component: RefundListComponent, runGuardsAndResolvers: 'always' },
      { path: 'refunds/:id', component: RefundDetailComponent, runGuardsAndResolvers: 'always' },

      // Reports - accessible by all authenticated users
      { path: 'reports', component: SummaryReportComponent, runGuardsAndResolvers: 'always' },

      // Profile management - accessible by all authenticated users
      { path: 'profile', component: ViewProfileComponent, runGuardsAndResolvers: 'always' },
      { path: 'profile/edit', component: EditProfileComponent, runGuardsAndResolvers: 'always' },
      { path: 'profile/change-password', component: ChangePasswordComponent, runGuardsAndResolvers: 'always' },

      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];