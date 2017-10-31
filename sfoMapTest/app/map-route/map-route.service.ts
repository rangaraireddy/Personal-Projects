import * as d3 from 'd3';
import { forEach } from 'angular';
import { TramRoutes, ITramRoutes } from '../SFMapsData/tramRoutesAPI';
import { RoutesModel, VehicleLocationModel } from '../SFMapsData/tramRoutesModel';

export interface IMapService {
    getTramRoutes: () => angular.IPromise<RoutesModel[]>;
    vehicleLocationCallStack: (routes: RoutesModel[]) => angular.IPromise<VehicleLocationModel[][]>;
    drawMapSVG: () => void;
    drawRouteLines: (routes: RoutesModel[]) => void;
    appendVehicleLocation: (vehicleroutes: any) => void;
    changeOpacity: (activeRoutes: any[], initialRoutes: any[]) => void;
}

export class MapService implements IMapService {
    public static injectionName: string = 'mapService';
    public static $inject: string[] = ['$q', TramRoutes.injectionName];
   
    public parentSVG: any = d3.select('.sfo-map-draw').append('svg')
    .attr('width', '100%').attr('height', '100%');

    public projection: any;
    constructor(private q: ng.IQService, private tramRoutes: ITramRoutes) {
    }

    public getTramRoutes = () => {
        return this.tramRoutes.getTramRoutes();            
    }

    public vehicleLocationCallStack = (routes: RoutesModel[]): angular.IPromise<VehicleLocationModel[][]> => {
         // Caclulate last updated vehcle location time - 15 min back from now
        const lastUpdatedTime: number = new Date().getTime() - (15 * 60 * 1000);
        const promises: any[] = [];
        forEach(routes, (eachRoute) => {
            const promise: any = this.tramRoutes.getVehicleLocations(eachRoute.tag, lastUpdatedTime);
            promises.push(promise);
        });
        return this.q.all(promises).then((data: VehicleLocationModel[][]) => {
            return data.filter(eachData => { return eachData !== undefined; });
        });
    }

    public drawMapSVG = () => {
        d3.json('/app/SFMapsData/SFJsons/arteries.json', (arteriesMap) => {
            const arteriesCentroid: [number, number] = d3.geoPath().centroid(arteriesMap);
            d3.json('/app/SFMapsData/SFJsons/freeways.json', (freewaysMap) => {
                const freewaysCentroid: [number, number] = d3.geoPath().centroid(freewaysMap);
                d3.json('/app/SFMapsData/SFJsons/neighborhoods.json', (neighborhoodsMap) => {
                    const neighborhoodsCentroid: [number, number] = d3.geoPath().centroid(neighborhoodsMap);                    
                    d3.json('/app/SFMapsData/SFJsons/streets.json', (streetsMap) => {
                        const streetCentroid: [number, number] = d3.geoPath().centroid(streetsMap);

                        // Need to find a perfect way to point all geoJSONs to one centroid
                        const avgCentroid: [number, number] = [
                            (arteriesCentroid[0]  + freewaysCentroid[0] + neighborhoodsCentroid[0] + streetCentroid[0]) / 4,
                            (arteriesCentroid[1]  + freewaysCentroid[1] + neighborhoodsCentroid[1] + streetCentroid[1]) / 4
                        ];                        
                        this.createSvg(neighborhoodsMap, 'aerial neighborhoods', avgCentroid);
                        this.createSvg(freewaysMap, 'aerial freeways', avgCentroid);             
                        this.createSvg(arteriesMap, 'aerial arteries', avgCentroid);             
                        this.createSvg(streetsMap, 'aerial streets', avgCentroid);
                    });
                });
            });
        });
    }

    public drawRouteLines = (routes: RoutesModel[]) => {
        const lineFunction: any = d3.line().x((d: any) => { return this.projection([d.lon, d.lat])[0]; })
                                           .y((d: any) => { return this.projection([d.lon, d.lat])[1]; });    
        forEach(routes, (eachRoute) => {
            forEach(eachRoute.path, (eachPoint) => {
                this.parentSVG.append('path')
                .attr('d', lineFunction(eachPoint.point))
                .attr('class', 'routeTag tag-name-' + eachRoute.tag )
                .attr('stroke', '#' + eachRoute.color)
                .attr('stroke-width', '0.5px')
                .attr('stroke-opacity', 0.75)
                .attr('fill', 'none');
            });
        });
    }

    public appendVehicleLocation = (vehicleroutes: VehicleLocationModel[]) => {
        this.parentSVG.selectAll('.image')
        .data(vehicleroutes).enter()
        .append('image')        
        .attr('class', 'image')
        .attr('xlink:href', 'assets/train.jpg');

        this.parentSVG.selectAll('.image')
        .exit().remove();

         this.parentSVG.selectAll('.image')         
        .attr('x', (d: VehicleLocationModel) => { return this.projection([d.lon, d.lat])[0]; }).attr('y', (d: any) => { return this.projection([d.lon, d.lat])[1]; })
        .attr('width', '30')
        .attr('height', '30')
        .append('svg:title')
        .text((d: VehicleLocationModel) => { 
            return d.routeTag;
        });   
    }

    public changeOpacity = (activeRoutes: RoutesModel[], initialRoutes: RoutesModel[]) => {
        if (activeRoutes.length > 0) {
            d3.selectAll('.routeTag')
            .attr('stroke-opacity', 0.3)
            .attr('stroke', '#F1F1F1')
            .attr('stroke-width', '0.5px');
            d3.selectAll('.aerial')
            .attr('stroke-opacity', 0.3);

            forEach(activeRoutes, (eachRoute) => {
                console.log(eachRoute);
                d3.selectAll('.tag-name-' + eachRoute.tag)
                .attr('stroke-opacity', 0.75)
                .attr('stroke', '#' + eachRoute.color)
                .attr('stroke-width', '2px');
            });
        } else {
            this.drawRouteLines(initialRoutes);
            d3.selectAll('.aerial')
            .attr('stroke-opacity', 0.75);
        }
    }

    private createSvg = (mapJSONData: any, className: string, centroid: [number, number]) => {
        const scale: number = 300000;
        const center: [number, number] = centroid;
        this.projection = d3.geoMercator().scale(scale).center(center);        

        const path: any = d3.geoPath().projection(this.projection);
        this.parentSVG.append('path').datum(mapJSONData).attr('class', className).attr('d', path).attr('stroke-opacity', 0.75);     
                 
        ////////
        //          Not working with neighborhood JSON. Investigate. TO DO.
        /////////

        // const projection: any = d3.geoMercator().scale(1).translate([0, 0]).precision(0);  
        
        // const path: any = d3.geoPath().projection(projection);                       

        // const bounds: [[number, number], [number, number]] = path.bounds(map);

        // const scale: number = .95 / Math.max((bounds[1][0] - bounds[0][0]) / this.width,
        //     (bounds[1][1] - bounds[0][1]) / this.height);
        // const transl: [number, number] = [(this.width - scale * (bounds[1][0] + bounds[0][0])) / 2,
        //     (this.height - scale * (bounds[1][1] + bounds[0][1])) / 2];
        // projection.scale(scale).translate(transl);
        
        // this.parentSVG.append('path')
        //     .datum(map)        
        //     .attr('d', path)
        //     .attr('class', className)
        //     .style('fill', 'none');         
   }
}