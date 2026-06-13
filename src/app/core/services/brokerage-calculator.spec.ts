import { TestBed } from '@angular/core/testing';

import { BrokerageCalculator } from './brokerage-calculator';

describe('BrokerageCalculator', () => {
  let service: BrokerageCalculator;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BrokerageCalculator);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
