
import * as angular from 'angular';
//import { app } from "../../app/app.module";
import 'angular';
import 'angular-mocks';
import IHttpBackendService = angular.IHttpBackendService;

const mockModule: angular.IModule = angular.module('mockModule', ['ngMockE2E']);

mockModule.run(['$httpBackend', ($httpBackend: IHttpBackendService): void => {
    const testAccount: { email: string } = {
        email: 'test@example.com'
    };
    $httpBackend.whenGET('/api/wherever').respond((): [number, string] => {
        return [200, testAccount.email];
    });

    $httpBackend.whenGET(/.html/).passThrough();
}]);

export { mockModule };
