import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { RouteSegment } from '../../../../core/enums/app.enums';
import { NavLink } from '../../../../core/models/navigation.model';

const PRIMARY_LINKS: NavLink[] = [
  { label: 'Dashboard', icon: '⊞', route: RouteSegment.DASHBOARD },
  { label: 'Watchlist', icon: '★', route: RouteSegment.WATCHLIST },
  { label: 'Orders', icon: '↕', route: RouteSegment.ORDERS },
  { label: 'Positions', icon: '◈', route: RouteSegment.POSITIONS },
];

const MORE_LINKS: NavLink[] = [
  { label: 'Portfolio', icon: '◉', route: RouteSegment.PORTFOLIO },
  { label: 'Funds', icon: '₹', route: RouteSegment.FUNDS },
  { label: 'Option Chain', icon: '☰', route: RouteSegment.OPTION_CHAIN },
];

@Component({
  standalone: true,
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  imports: [RouterLink, RouterLinkActive],
})
export class SidebarComponent {
  @Input() open = true;

  @Output() toggleSidebar = new EventEmitter<void>();

  readonly primaryLinks = PRIMARY_LINKS;
  readonly moreLinks = MORE_LINKS;

  isMoreOpen = false;

  toggleMore() {
    this.isMoreOpen = !this.isMoreOpen;
  }

  closeMore() {
    this.isMoreOpen = false;
  }
}
