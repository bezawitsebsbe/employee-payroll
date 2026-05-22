import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AuthFacade } from '@employee-payroll/core';
import {NavItem} from './nav.resolver';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  navItems: NavItem[] = [];

  constructor(
    private route: ActivatedRoute, 
    private router: Router,
    private authFacade: AuthFacade
  ) {
    this.route.data.subscribe(data => {
      this.navItems = data['navItems'] || [];
    });
  }

  logout() {
    this.authFacade.logout();
    window.location.href = '/auth/signin';
  }

  // Get user display name using AuthFacade
  getUserName(): string {
    return this.authFacade.getUserDisplayName();
  }

  // Get user initials using AuthFacade
  getUserInitials(): string {
    return this.authFacade.getUserAvatar() || 'U';
  }

  // Check if current route is active
  isActive(path: string): boolean {
    return this.router.url.includes(path);
  }
}
