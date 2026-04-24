import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { FundsPageComponent } from './components/funds-page.component';

const routes: Routes = [{ path: '', component: FundsPageComponent }];

@NgModule({
  declarations: [FundsPageComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class FundsModule {}
