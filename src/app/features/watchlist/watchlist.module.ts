import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { WatchlistPageComponent } from './components/watchlist-page.component';
import { OrderFormComponent } from './components/order-form.component';

const routes: Routes = [{ path: '', component: WatchlistPageComponent }];

@NgModule({
  declarations: [WatchlistPageComponent, OrderFormComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class WatchlistModule {}
