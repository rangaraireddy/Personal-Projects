class LatLng {
    public lon: string;
    public lat: string;
}

export class VehicleLocationModel {
    public heading: string;
    public lon: string;
    public lat: string;
    public routeTag: string;
}

export class RoutesModel {
    public color: string;
    public tag: string;
    public title: string;
    public path: RouthPathModel[];
}

export class RouthPathModel {
    public point: LatLng[];
}