import { Injectable } from '@angular/core';

@Injectable()

export class TemperatureMonitor {
    constructor() {}

    public recordTemperature = (value: number | string): boolean => {
      return (typeof value === 'number');
    }

    public getCurrentMedian = (temperatureRecords: number[]): number => {
      let median = 0;
      const records: number = temperatureRecords.length;
      temperatureRecords.sort();
      if ( records % 2 === 0) {
          median = (temperatureRecords[records / 2 - 1] + temperatureRecords[records / 2]) / 2;
      } else {
          median = temperatureRecords[(records - 1) / 2];
      }
      return median;
    }

    public getCelsiusTemperature = (temperature: number) => {
      return ((temperature - 32) * (5 / 9));
    }
}