import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { PositionsPageComponent } from './components/positions-page.component';

const routes: Routes = [{ path: '', component: PositionsPageComponent }];

@NgModule({
  declarations: [PositionsPageComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class PositionsModule {}
