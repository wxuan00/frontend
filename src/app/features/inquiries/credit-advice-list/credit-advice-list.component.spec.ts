import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreditAdviceListComponent } from './credit-advice-list.component';

describe('CreditAdviceListComponent', () => {
  let component: CreditAdviceListComponent;
  let fixture: ComponentFixture<CreditAdviceListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreditAdviceListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreditAdviceListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
