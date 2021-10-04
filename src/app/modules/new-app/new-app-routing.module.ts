import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NewAppComponent } from './pages/new-app/new-app.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: NewAppComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NewAppRoutingModule { }
