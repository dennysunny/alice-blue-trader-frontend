import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { OrdersPageComponent } from './components/orders-page.component';

const routes: Routes = [{ path: '', component: OrdersPageComponent }];

@NgModule({
  declarations: [OrdersPageComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class OrdersModule {}
