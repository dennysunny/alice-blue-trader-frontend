import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouteSegment } from '../../../../core/enums/app.enums';

interface NavLink {
  label: string;
  icon: string;
  route: string;
}

const NAV_LINKS: NavLink[] = [
  { label: 'Dashboard',  icon: '⊞', route: RouteSegment.DASHBOARD },
  { label: 'Watchlist',  icon: '★', route: RouteSegment.WATCHLIST },
  { label: 'Orders',     icon: '↕', route: RouteSegment.ORDERS },
  { label: 'Positions',  icon: '◈', route: RouteSegment.POSITIONS },
  { label: 'Portfolio',  icon: '◉', route: RouteSegment.PORTFOLIO },
  { label: 'Funds',      icon: '₹', route: RouteSegment.FUNDS },
];

@Component({
  standalone: false,
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  @Input() open = true;
  @Output() toggleSidebar = new EventEmitter<void>();

  readonly navLinks = NAV_LINKS;
}
