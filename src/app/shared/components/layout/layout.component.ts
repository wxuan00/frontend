import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { ToastComponent } from '../toast/toast.component';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { RouteRefreshService } from '../../../core/services/route-refresh.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, HeaderComponent, FooterComponent, ToastComponent],
  template: `
    <div class="app-container">
      <app-sidebar #sidebarRef></app-sidebar>
      <div class="main-wrapper" [style.margin-left.px]="getMainMargin()" [style.width]="'calc(100% - ' + getMainMargin() + 'px)'">
        <app-header [sidebarRef]="sidebarRef"></app-header>
        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
        <app-footer></app-footer>
      </div>
    </div>
    <app-toast></app-toast>
  `,
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent implements OnInit, OnDestroy {
  @ViewChild('sidebarRef') sidebarRef!: SidebarComponent;
  private sub!: Subscription;

  constructor(private router: Router, private routeRefresh: RouteRefreshService) {}

  ngOnInit() {
    this.sub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => {
      this.routeRefresh.trigger();
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  getMainMargin(): number {
    if (!this.sidebarRef) return 240;
    if (window.innerWidth <= 768) return 0;
    return this.sidebarRef.collapsed ? 64 : 240;
  }
}
