import { TestBed, async } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { TemperatureMonitor } from './app.component.service';
import { FormsModule } from '@angular/forms';

class MockAppService {
  constructor() {}
}

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [
        AppComponent
      ],
      providers: [{provide: TemperatureMonitor, useClass: MockAppService}]
    }).compileComponents();
  }));

  it('should create the app', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));

  it('should render title in a h1 tag', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('h1').textContent).toContain('Temperature Monitor');
  }));

  // Methods
  it('should have an empty records array on initial load', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.temperatureRecords.length).toEqual(0);
  }));

  it('should have a validate method that sets the main input model as number', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    app.validate('567');
    expect(app.model).toEqual(567);
    app.validate('-124');
    expect(app.model).toEqual(-124);
    app.validate('0');
    expect(app.model).toEqual(0);
  }));
});
