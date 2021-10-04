import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { MainRoutingModule } from './main-routing.module';
import { MainAppComponent } from './pages/main-app/main-app.component';
import { SharedModule } from '../../components/shared.module';

@NgModule({
  declarations: [
    MainAppComponent
  ],
  imports: [
    CommonModule,
    MainRoutingModule,
    FontAwesomeModule,
    NgbPaginationModule,
    FormsModule,
    SharedModule
  ]
})
export class MainModule { }
