import { TestBed, inject } from '@angular/core/testing';
import { TemperatureMonitor } from './app.component.service';

describe('TemperatureMonitorService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TemperatureMonitor]
    });
  });

  it('should be created', inject([TemperatureMonitor], (service: TemperatureMonitor) => {
    expect(service).toBeTruthy();
  }));

  it('should have a recordTemperature method that only accepts a NUMBER', inject([TemperatureMonitor], (service: TemperatureMonitor) => {
    expect(service.recordTemperature('notANumber')).toBeFalsy();
    expect(service.recordTemperature(234)).toBeTruthy();
  }));

  it('should have a getMedianTemperature method that returns a MEDIAN', inject([TemperatureMonitor], (service: TemperatureMonitor) => {
    const testOddRecords = [1, 2, 3, 4, 6];
    expect(service.getCurrentMedian(testOddRecords)).toEqual(3);
    const testEvenRecords = [1, 2, 3, 4, 4, 6];
    expect(service.getCurrentMedian(testEvenRecords)).toEqual(3.5);
  }));

  it('should convert fahrenheit to celsius', inject([TemperatureMonitor], (service: TemperatureMonitor) => {
    expect(service.getCelsiusTemperature(32)).toEqual(0);
  }));
});