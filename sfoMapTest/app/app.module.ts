import * as angular from 'angular';
import 'angular-material';
import 'd3';

import 'material_css';
import './styleImports';
import {
    SfoBaseMapComponent,
    MapRouteComponent,
    MapService,
    TramRoutes
} from '.';

const app: angular.IModule = angular.module('sfoBaseMapModule', ['ngMaterial']);
app.component(SfoBaseMapComponent.injectionName, new SfoBaseMapComponent());
app.component(MapRouteComponent.injectionName, new MapRouteComponent());

app.service(MapService.injectionName, MapService);
app.service(TramRoutes.injectionName, TramRoutes);

export { app };