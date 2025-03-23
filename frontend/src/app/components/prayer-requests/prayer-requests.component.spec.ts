import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrayerRequestsComponent } from './prayer-requests.component';

describe('PrayerRequestsComponent', () => {
  let component: PrayerRequestsComponent;
  let fixture: ComponentFixture<PrayerRequestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrayerRequestsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrayerRequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
