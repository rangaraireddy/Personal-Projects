import { Component } from '@angular/core';
import { TemperatureMonitor } from './app.component.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [TemperatureMonitor]
})
export class AppComponent {
  public model: number;
  public disableAddButton: boolean = true;
  public entryError: boolean = false;
  public fahrenheitTemperature: number;
  public celsiusTemperature: number;
  public showMedian: boolean = false;
  public temperatureRecords: number[] = [];

  constructor(private temperatureMonitor: TemperatureMonitor) { }

  public validate(value: string): void  {
    let numberVal: number = 0;
    if (value) {
      numberVal = Number(value);
      if (numberVal || numberVal === 0) {
        this.disableAddButton = false;
        this.entryError = false;
        this.model = numberVal;
      } else {
        if (value.indexOf('.') >= 0) {
          this.entryError = true;
          this.disableAddButton = true;
        }
      }
    } else {
      this.disable();
    }
  }

  public addTemperature = (temperature: number): void => {
    if (this.temperatureMonitor.recordTemperature(temperature)) {
      this.temperatureRecords.push(temperature);
    }
    this.disable();
    this.showMedian = false;
  }

  public getMedianTemperature = () => {
    this.fahrenheitTemperature = this.temperatureMonitor.getCurrentMedian(this.temperatureRecords);
    this.celsiusTemperature = this.temperatureMonitor.getCelsiusTemperature(this.fahrenheitTemperature);
    this.showMedian = true;
  }

  public colorPercentage = () => {
    return ((100 * this.temperatureRecords.length) / 8) + '%';
  }

  private disable = (): void => {
    this.disableAddButton = true;
    this.model = null;
  }
}
