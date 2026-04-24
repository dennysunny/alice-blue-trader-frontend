import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { PortfolioPageComponent } from './components/portfolio-page.component';

const routes: Routes = [{ path: '', component: PortfolioPageComponent }];

@NgModule({
  declarations: [PortfolioPageComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class PortfolioModule {}
