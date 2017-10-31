import { RoutesModel, VehicleLocationModel } from './tramRoutesModel';

export interface ITramRoutes {
    getTramRoutes: () => angular.IPromise<RoutesModel[]>;
    getVehicleLocations: (routeTag: string, lastUpdatedTime: number) =>
         angular.IPromise<VehicleLocationModel[]>;
}

export class TramRoutes implements ITramRoutes {
    public static injectionName: string = 'tramRoutes';
    public static $inject: string[] = ['$http'];

    public webService: string = 'http://webservices.nextbus.com/service/publicJSONFeed';
    public agencyTag: string = 'sf-muni';

    constructor(private http: ng.IHttpService) {
    }

    public getTramRoutes = (): angular.IPromise<RoutesModel[]> => {
        return this.http.get(this.webService, <ng.IRequestShortcutConfig>{
            params: {
                command: 'routeConfig',
                a: this.agencyTag
            }
        }).then((routesResponse: any) => {
            //Unpacking the angular response to JSON response
            return routesResponse.data.route;
        });
    }

    public getVehicleLocations = (routeTag: string, lastUpdatedTime: number): angular.IPromise<VehicleLocationModel[]> => {
        return this.http.get(this.webService, <ng.IRequestShortcutConfig>{
            params: {
                command: 'vehicleLocations',
                a: this.agencyTag,
                r: routeTag,
                t: lastUpdatedTime
            }
        }).then((routesResponse: any) => {
            //Unpacking the angular response to JSON response
            return routesResponse.data.vehicle;                
        });
    }
}