import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './pages/admin/admin.component';
import { TagsComponent } from './components/tags/tags.component';
import { BannerComponent } from './components/banner/banner.component';
import { UsersComponent } from './components/users/users.component';
import { MonitorComponent } from './components/monitor/monitor.component';

const routes: Routes = [
  {
    path: '',
    component: AdminComponent,
    children: [
      {
        path: '',
        redirectTo: 'tags'
      },
      {
        path: 'tags',
        component: TagsComponent
      },
      {
        path: 'banner',
        component: BannerComponent
      },
      {
        path: 'users',
        component: UsersComponent
      },
      {
        path: 'monitor',
        component: MonitorComponent
      }
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
