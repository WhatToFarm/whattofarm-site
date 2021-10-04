import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { PromoPlaceComponent } from './promo-place/promo-place.component';
import { LoginComponent } from './login/login.component';

@NgModule({
  declarations: [
    PromoPlaceComponent,
    LoginComponent
  ],
  exports: [
    PromoPlaceComponent,
    LoginComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule
  ]
})
export class SharedModule { }
