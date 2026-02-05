import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettlementDetailComponent } from './settlement-detail.component';

describe('SettlementDetailComponent', () => {
  let component: SettlementDetailComponent;
  let fixture: ComponentFixture<SettlementDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SettlementDetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SettlementDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
