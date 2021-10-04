import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { NewAppRoutingModule } from './new-app-routing.module';
import { NewAppComponent } from './pages/new-app/new-app.component';
import { SharedModule } from '../../components/shared.module';

@NgModule({
  declarations: [
    NewAppComponent
  ],
  imports: [
    CommonModule,
    NewAppRoutingModule,
    FontAwesomeModule,
    NgbPaginationModule,
    FormsModule,
    NgbModule,
    SharedModule
  ]
})
export class NewAppModule { }
