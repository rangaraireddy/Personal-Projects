import { MapService, IMapService } from './map-route.service';
import { forEach } from 'angular';
import { RoutesModel, VehicleLocationModel } from '../SFMapsData/tramRoutesModel';

export class MapRouteController implements ng.IComponentController {
    public static injectionName: string = 'MapRouteController';
    public static $inject: string[] = ['$interval', '$mdSidenav', MapService.injectionName];
    public tramRoutes: RoutesModel[];
    public allActiveRoutes: RoutesModel[] = [];
    constructor(private interval: ng.IIntervalService, private mdSidenav: ng.material.ISidenavService, private mapService: IMapService) { }

    public $onInit = (): void => {
        this.initializeMap();
    }   

    public toggleRoutesMenu = () => {
        this.mdSidenav('routesMenu').toggle();
    }

    public checkedRoute = (item: RoutesModel) => {
        if ( this.allActiveRoutes.indexOf(item) >= 0 ) {
            this.allActiveRoutes = this.allActiveRoutes.filter(activeRoute => { return activeRoute !== item; });
        } else {
            this.allActiveRoutes.push(item);
        }        
        console.log(this.allActiveRoutes);
        this.mapService.changeOpacity(this.allActiveRoutes, this.tramRoutes);
    }

    private initializeMap = () => {
        this.mapService.drawMapSVG(); 
        this.mapService.getTramRoutes().then((routes: RoutesModel[]) => {
            this.tramRoutes = routes;
            console.log(routes);
            this.vehicleLocations(routes);
            this.interval(() => { 
                this.vehicleLocations(routes);
             } , 15000);
            this.mapService.drawRouteLines(routes);
        });
    }

    private vehicleLocations = (routes: RoutesModel[]) => {
        this.mapService.vehicleLocationCallStack(routes).then((data: VehicleLocationModel[][]) => {
            forEach(data, (vehicle) => {
                this.createVehicleFeatures(vehicle); 
            });
        });
    }

    private createVehicleFeatures = (vehicleLocation: any) => {
        if (vehicleLocation.length > 0) {
            this.mapService.appendVehicleLocation(vehicleLocation);
        } else {
            this.mapService.appendVehicleLocation([vehicleLocation]);
        }        
    }
}