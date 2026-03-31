import { Component, ViewChild } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { ToastComponent } from '../toast/toast.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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
export class LayoutComponent {
  @ViewChild('sidebarRef') sidebarRef!: SidebarComponent;

  getMainMargin(): number {
    if (!this.sidebarRef) return 240;
    if (window.innerWidth <= 768) return 0;
    return this.sidebarRef.collapsed ? 64 : 240;
  }
}
