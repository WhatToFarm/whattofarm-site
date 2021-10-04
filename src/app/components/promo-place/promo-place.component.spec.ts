import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PromoPlaceComponent } from './promo-place.component';

describe('PromoPlaceComponent', () => {
  let component: PromoPlaceComponent;
  let fixture: ComponentFixture<PromoPlaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PromoPlaceComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PromoPlaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
