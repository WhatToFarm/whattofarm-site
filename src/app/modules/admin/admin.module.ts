import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './pages/admin/admin.component';
import { TagsComponent } from './components/tags/tags.component';
import { BannerComponent } from './components/banner/banner.component';
import { UsersComponent } from './components/users/users.component';
import { DragulaModule } from 'ng2-dragula';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MonitorComponent } from './components/monitor/monitor.component';


@NgModule({
  declarations: [
    TagsComponent,
    BannerComponent,
    UsersComponent,
    MonitorComponent,
    AdminComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AdminRoutingModule,
    NgbModule,
    DragulaModule,
    FontAwesomeModule,
    FormsModule
  ]
})
export class AdminModule { }
