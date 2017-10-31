import { SfoBaseMapController } from './app.controller';
import * as template from './app.tmpl.html';

export class SfoBaseMapComponent implements ng.IComponentOptions {
    public static injectionName: string = 'sfoBaseMap';
    public restrict: string = 'E';    
    public controller: ng.Injectable<ng.IControllerConstructor> = SfoBaseMapController;
    public controllerAs: string = 'vm';
    public template: any = template;
    public bindings: { [boundProperty: string]: string } = {
    };
}