import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrayersForMeComponent } from './prayers-for-me.component';

describe('PrayersForMeComponent', () => {
  let component: PrayersForMeComponent;
  let fixture: ComponentFixture<PrayersForMeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrayersForMeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrayersForMeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
