import { MapRouteController } from './map-route.controller';
import * as template from './map-route.tmpl.html';

export class MapRouteComponent implements ng.IComponentOptions {
    public static injectionName: string = 'mapRoute';
    public restrict: string = 'E';    
    public controller: ng.Injectable<ng.IControllerConstructor> = MapRouteController;
    public controllerAs: string = 'vm';
    public template: any = template;
    public bindings: { [boundProperty: string]: string } = {
    };
}