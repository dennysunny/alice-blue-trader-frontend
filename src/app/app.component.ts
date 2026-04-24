import { Component, OnInit } from '@angular/core';
import { ThemeService } from './core/services/theme.service';

@Component({
  standalone: false,
  selector: 'app-root',
  template: `<router-outlet></router-outlet>`,
})
export class AppComponent implements OnInit {
  constructor(private themeService: ThemeService) {}
  ngOnInit(): void {
    // ThemeService constructor already applies the saved theme — no-op here but
    // keeping for future global init logic.
  }
}
