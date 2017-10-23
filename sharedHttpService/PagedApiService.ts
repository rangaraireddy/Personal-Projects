import {IPagedDataResponse, IPagedMetadata} from "./PagedDataResponse";
import {IRawDataConverter} from "./IRawDataConverter";

const DEFAULT_SKIP = 0;
const DEFAULT_PAGE = 0;
const DEFAULT_PAGE_SIZE = 100;

export interface IPagedApiService {
    getPageS<T extends IRawDataConverter>(returnType: new () => T, url: string, params: Object, pageSize?: number, skip?: number): ng.IPromise<T[]>;
    getPageN<T extends IRawDataConverter>(returnType: new () => T, url: string, params: Object, pageSize?: number, pageNumber?: number): ng.IPromise<T[]>;
    getCount(url: string, params: Object): ng.IPromise<number>;

    getAll<T extends IRawDataConverter>(returnType: new () => T, url: string, params: Object, pageSize?: number): ng.IPromise<T[]>;
    getSingle<T extends IRawDataConverter>(returnType: new () => T, url: string, params: Object): ng.IPromise<T>;
    getSingleOrNull<T extends IRawDataConverter>(returnType: new () => T, url: string, params: Object): ng.IPromise<T>;

    postSingle<T extends IRawDataConverter>(returnType: new () => T, url: string, data: T): ng.IPromise<T>;
    postMultiple<T extends IRawDataConverter>(returnType: new () => T, url: string, data: T[]): ng.IPromise<T[]>;

    putSingle<T extends IRawDataConverter>(returnType: new () => T, url: string, data: T): ng.IPromise<T>;
    putMultiple<T extends IRawDataConverter>(returnType: new () => T, url: string, data: T[]): ng.IPromise<T[]>;

    deleteSingle<T extends IRawDataConverter>(returnType: new () => T, url: string): ng.IPromise<T>;
    deleteMultiple<T extends IRawDataConverter>(returnType: new () => T, urls: string[]): ng.IPromise<T[]>;
}

/**
 * Utility class which wraps angular's $http service to handle pagination and data packing/unpacking
 */
export class PagedApiService implements IPagedApiService {

    private MAX_ALLOWED_PAGES = 500;

    static $inject: string[] = ["$q", "$http"];
    constructor(private _q: ng.IQService, private _http: ng.IHttpService) { }
    
    // PUBLIC METHODS -----------------------------------------------------------------------------------------------------------------

    /**
     * Gets a single page of results given a page size and a number of records to skip.
     * @param url The string url to fetch, without query string parameters
     * @param pageSize The number of items returned for this 'page'
     * @param skip The number of records to skip
     * @param params An object representing any additional query string parameters to be passed to $http.get
     * @param returnType Optional (temporarily) parameter specifying the constructor of the target type for mapping purposes.
     * @returns {} A promise containing a single page of matching records
     */
    public getPageS<T extends IRawDataConverter>(returnType: new () => T, url: string, params: Object, pageSize: number = DEFAULT_PAGE_SIZE, skip: number = DEFAULT_SKIP): ng.IPromise<T[]> {
        let parameters: Object = angular.extend({ limit: pageSize, offset: skip }, params);

        return this.validateRequestParameters(parameters)
            .then(() => this._http.get(url, { params: parameters, withCredentials: true }))
            .then((result) => this.validateApiResult(result))
            .then((response) => this.createMappedResultSet<T>(response.ResultSet, returnType))
            .catch((error) => this._q.reject(this.emitPagedApiError(error, "getPageS", url)));
    }
    
    /**
     * Gets a single page of results given a page size and specific page number to fetch.
     * @param url The string url to fetch, without query string parameters
     * @param pageSize The number of items returned for this 'page'
     * @param pageNumber The (zero-indexed) page number; alternatively, the number of pages to skip
     * @param params An object representing any additional query string parameters to be passed to $http.get
     * @param returnType Optional (temporarily) parameter specifying the constructor of the target type for mapping purposes.
     * @returns {} A promise containing a single page of matching records
     */
    public getPageN<T extends IRawDataConverter>(returnType: new () => T, url: string, params: Object, pageSize: number = DEFAULT_PAGE_SIZE, pageNumber: number = DEFAULT_PAGE): ng.IPromise<T[]> {
        let parameters: Object = angular.extend({ limit: pageSize, offset: pageSize * pageNumber }, params);

        return this.validateRequestParameters(parameters)
            .then(() => this._http.get(url, { params: parameters, withCredentials: true }))
            .then((result) => this.validateApiResult(result))
            .then((response) => this.createMappedResultSet<T>(response.ResultSet, returnType))
            .catch((error) => this._q.reject(this.emitPagedApiError(error, "getPageN", url)));
    }

    /**
     * Get a total count of records available at a particular url by fetching a single item page and reading the metadata.
     * @param url The string url to fetch a count for, without query string parameters
     * @param params An object representing any additional query string parameters to be passed to $http.get
     * @returns {} A promise containing a count of all matching records
     */
    public getCount(url: string, params: Object): ng.IPromise<number> {
        let parameters: Object = angular.extend({ limit: 1, offset: 0 }, params);

        return this.validateRequestParameters(parameters)
            .then(() => this._http.get(url, { params: parameters, withCredentials: true }))
            .then((result) => this.validateApiResult(result))
            .then((response: IPagedDataResponse<{}>) => response._metadata.TotalCount)
            .catch((error) => this._q.reject(this.emitPagedApiError(error, "getCount", url)));
    }

    /**
     * Makes a series of http get requests to retrieve all items of a given type which match a given query filter object
     * @param url The string url to fetch, without query string parameters
     * @param pageSize The number of items returned per 'page'
     * @param params An object representing any additional query string parameters to be passed to $http.get
     * @param returnType Optional (temporarily) parameter specifying the constructor of the target type for mapping purposes.
     * @returns {} A promise containing a list of all matching records
     */
    public getAll<T extends IRawDataConverter>(returnType: new () => T, url: string, params: Object, pageSize: number = DEFAULT_PAGE_SIZE): ng.IPromise<T[]> {
        var output = new Array<T>();
        var deferred: ng.IDeferred<T[]> = this._q.defer();

        //Get the first page
        var parameters: Object = angular.extend({ limit: pageSize, offset: 0 }, params);
        this.validateRequestParameters(parameters)
            .then(() => this._http.get(url, { params: parameters, withCredentials: true }))
            .then((result) => this.validateApiResult(result))
            .then((response) => {
                //First page of data/first notification
                output = this.createMappedResultSet<T>(response.ResultSet, returnType);
                deferred.notify(output);

                //Get the remaining pages as an array of promises (notifying partial results at each completion)
                var promises: ng.IPromise<T[]>[] = [];
                var pageCount = response._metadata.TotalCount / response._metadata.Limit;

                //Safeguard against excessive requests
                if (pageCount > this.MAX_ALLOWED_PAGES) {
                    let message = "Attempting to initiate too many page requests (" + pageCount + "). The maximum per call is " + this.MAX_ALLOWED_PAGES + ". Did you forget a query string parameter? \nEndpoint: " + url;
                    deferred.reject(message);
                    console.error(message);
                    return this._q.reject(message);
                }

                //Fire off the requests
                for (var i = 1; i < pageCount; i++) {
                    promises[i] = this.getPageN<T>(returnType, url, params, pageSize, i)
                        .then((data: T[]) => {
                            deferred.notify(data);
                            return data;
                        });
                }

                //Await all promises
                return this._q.all(promises);

            }).then((results: T[][]) => {
                //Concatenate all results
                angular.forEach(results, (result) => {
                    output = output.concat(result);
                });
                deferred.resolve(output);

            }).catch((error) => {
                deferred.reject(error);
            });

        return deferred.promise
            .catch((error) => this._q.reject(this.emitPagedApiError(error, "getAll", url)));
    }

    /**
     * Wraps a get call to a filtered, paged API where a single record is expected to be returned. Promise is rejected 
     * if zero or more than one record is returned.
     * @param url The string url to fetch, without query string parameters
     * @param params  An object representing any additional query string parameters to be passed to $http.get
     * @param returnType Optional (temporarily) parameter specifying the constructor of the target type for mapping purposes.
     * @returns {} A promise containing the single, unpacked record returned by the API
     */
    public getSingle<T extends IRawDataConverter>(returnType: new () => T, url: string, params: Object): ng.IPromise<T> {
        return this.validateRequestParameters(params)
            .then(() => this._http.get(url, { params: params, withCredentials: true }))
            .then((response) => this.unpackSingleDatum(response, returnType))
            .catch((error) => this._q.reject(this.emitPagedApiError(error, "getSingle", url)));
    }

    /**
     * Wraps a get call to a filtered, paged API where a single record is expected to be returned.
     * Will return null if no records are received or reject the promise if multiple records are received.
     * @param url The string url to fetch, without query string parameters
     * @param params  An object representing any additional query string parameters to be passed to $http.get
     * @param returnType Optional (temporarily) parameter specifying the constructor of the target type for mapping purposes.
     * @returns {} A promise containing the single, unpacked record returned by the API or null if none exists
     */
    public getSingleOrNull<T extends IRawDataConverter>(returnType: new () => T, url: string, params: Object): ng.IPromise<T> {
        return this.validateRequestParameters(params)
            .then(() => this._http.get(url, { params: params, withCredentials: true }))
            .then((response) => this.unpackSingleDatumOrNull(response, returnType))
            .catch((error) => this._q.reject(this.emitPagedApiError(error, "getSingleOrNull", url)));
    }

    /**
     * Wraps an $http.post call saving a single entity, where the API is expected to return the payload entity. Promise is rejected 
     * if zero or more than one record is returned.
     * @param url The string url to POST to
     * @param data  An object representing the data payload to POST to the API
     * @param returnType Optional (temporarily) parameter specifying the constructor of the target type for mapping purposes.
     * @returns {} A promise containing the single, unpacked record returned by the API
     */
    public postSingle<T extends IRawDataConverter>(returnType: new () => T, url: string, data: T): ng.IPromise<T> {
        let payload = this.createRawDataPayload(data, returnType);

        return this._http.post(url, payload, { withCredentials: true })
            .then((response) => { return this.unpackSingleDatum(response, returnType); })
            .catch((error) => this._q.reject(this.emitPagedApiError(error, "postSingle", url)));
    }

    /**
     * Iterates through a list of raw data convertable objects, POSTing them to the server. Promise is rejected if no data is
     * provided.
     * @param url The string url to POST to
     * @param data  An array of objects to POST to the server
     * @param returnType Optional (temporarily) parameter specifying the constructor of the target type for mapping purposes.
     * @returns {} A promise containing an array of statuses (datatype TBD)
     */
    public postMultiple<T extends IRawDataConverter>(returnType: new () => T, url: string, data: T[]): ng.IPromise<T[]> {
        var output = new Array<T>();
        var totalItemCount = data.length;
        var processedItems = 0;
        var deferred: ng.IDeferred<T[]> = this._q.defer();

        if (!data || !data.length) {
            return this._q.reject("No models provided to POST");
        }

        for (let i = 0; i < totalItemCount; i++) {
            this.postSingle(returnType, url, data[i])
                .then((response: T) => {
                    output.push(response);
                    deferred.notify(response);
                })
                .finally(() => {
                    processedItems++;
                    if (processedItems === totalItemCount) {
                        deferred.resolve(output);
                    }
                });
        }

        return deferred.promise
            .catch((error) => this._q.reject(this.emitPagedApiError(error, "postMultiple", url)));
    }

    /**
     * Wraps an $http.put call saving a single entity, where the API is expected to return the payload entity. Promise is rejected 
     * if zero or more than one record is returned.
     * @param url The string url to PUT to
     * @param data  An object representing the data payload to PUT to the API
     * @param returnType Optional (temporarily) parameter specifying the constructor of the target type for mapping purposes.
     * @returns {} A promise containing the single, unpacked record returned by the API
     */
    public putSingle<T extends IRawDataConverter>(returnType: new () => T, url: string, data: T): ng.IPromise<T> {
        let payload = this.createRawDataPayload(data, returnType);

        return this._http.put(url, payload, { withCredentials: true })
            .then((response) => this.unpackSingleDatum(response, returnType))
            .catch((error) => this._q.reject(this.emitPagedApiError(error, "putSingle", url)));
    }

    /**
     * Iterates through a list of raw data convertable objects, PUTting them to the server. Promise is rejected if no data is
     * provided.
     * @param url The string url to PUT to
     * @param data  An array of objects to PUT to the server
     * @param returnType Optional (temporarily) parameter specifying the constructor of the target type for mapping purposes.
     * @returns {} A promise containing an array of statuses (datatype TBD)
     */
    public putMultiple<T extends IRawDataConverter>(returnType: new () => T, url: string, data: T[]): ng.IPromise<T[]> {
        var output = new Array<T>();
        var totalItemCount = data.length;
        var processedItems = 0;
        var deferred: ng.IDeferred<T[]> = this._q.defer();

        if (!data || !data.length) {
            return this._q.reject("No models provided to PUT");
        }

        for (let i = 0; i < totalItemCount; i++) {
            this.putSingle(returnType, url, data[i])
                .then((response: T) => {
                    output.push(response);
                    deferred.notify(response);
                })
                .finally(() => {
                    processedItems++;
                    if (processedItems === totalItemCount) {
                        deferred.resolve(output);
                    }
                });
        }

        return deferred.promise
            .catch((error) => this._q.reject(this.emitPagedApiError(error, "putMultiple", url)));
    }

    /**
     * Wraps an $http.delete call deleting a single entity, where the API is expected to return the deleted entity. Promise is rejected 
     * if zero or more than one record is returned.
     * @param url The string url to fetch, without query string parameters
     * @param returnType Optional (temporarily) parameter specifying the constructor of the target type for mapping purposes.
     * @returns {} A promise containing the single, unpacked record returned by the API
     */
    public deleteSingle<T extends IRawDataConverter>(returnType: new () => T, url: string): ng.IPromise<T> {
        return this._http.delete(url, { withCredentials: true })
            .then((response) => this.unpackSingleDatum(response, returnType))
            .catch((error) => this._q.reject(this.emitPagedApiError(error, "deleteSingle", url)));
    }    

    /**
     * Iterates through a list of urls, deleting the entities from the server. Promise is rejected if no urls are provided.
     * @param urls The array of string urls to DELETE
     * @param returnType Optional (temporarily) parameter specifying the constructor of the target type for mapping purposes.
     * @returns {} A promise containing an array of statuses (datatype TBD)
     */
    public deleteMultiple<T extends IRawDataConverter>(returnType: new () => T, urls: string[]): ng.IPromise<T[]> {
        var output = new Array<T>();
        var totalItemCount = urls.length;
        var processedItems = 0;
        var deferred: ng.IDeferred<T[]> = this._q.defer();

        if (!urls || !urls.length) {
            return this._q.reject("No URLs provided to delete");
        }

        for (let i = 0; i < totalItemCount; i++) {
            this.deleteSingle(returnType, urls[i])
                .then((response: T) => {
                    output.push(response);
                    deferred.notify(response);
                })
                .finally(() => {
                    processedItems++;
                    if (processedItems === totalItemCount) {
                        deferred.resolve(output);
                    }
                });
        }

        return deferred.promise
            .catch((error) => this._q.reject(this.emitPagedApiError(error, "deleteMultiple", `[${urls.length} urls]`)));
    }    


    // PRIVATE METHODS ------------------------------------------------------------------------------------------------------------------------

    /**
     * Disallow null-valued params - $httpParamSerializer removes them, leading to possible unfiltered queries and enormous counts
     * and/or return sets from the backend.
     */
    private validateRequestParameters = (params: Object): ng.IPromise<void> => {
        if (this.hasNullValuedProperties(params)) {
            return this._q.reject("Null-valued param.  Auto-rejecting request.");
        } else {
            return this._q.when();
        }
    }

    /**
     * Helper method to ensure that the API response conforms to the expected data-api format
     * @param response raw response 
     * @returns {} the raw response if it passes validation, otherwise the promise is rejected.
     */
    private validateApiResult = <T extends IRawDataConverter>(response: ng.IHttpPromiseCallbackArg<{}>): ng.IPromise<IPagedDataResponse<T>> => {
        var data = response.data as IPagedDataResponse<T>;
        if (data && data.ResultSet) {
            return this._q.when(data);
        } else {
            return this._q.reject("Unexpected or malformed data response");
        }
    }

    /**
     * Helper method to unpack a paged result set expected to contain a single response. 
     * Will reject the promise if no or multiple records are received.
     * @param response The response to unpack
     * @param returnType Optional (temporarily) parameter specifying the constructor of the target type for mapping purposes.
     * @returns {} A promise containing the single, unpacked record returned by the API
     */
    private unpackSingleDatum = <T extends IRawDataConverter>(rawResponse: ng.IHttpPromiseCallbackArg<{}>, returnType: new () => T): ng.IPromise<T> => {
        return this.validateApiResult(rawResponse)
            .then((response) => {
                if (response.ResultSet.length !== 1) {
                    return this._q.reject("Expecting a single record, received " + response.ResultSet.length);
                } else {
                    let mappedData = this.createMappedResultSet<T>(response.ResultSet, returnType);
                    return this._q.when(mappedData[0]);
                }
            });
    }

    /**
     * Helper method to unpack a paged result set expected to contain a single response. 
     * Will return null if no records are received or reject the promise if multiple records are received.
     * @param response The response to unpack
     * @param returnType Optional (temporarily) parameter specifying the constructor of the target type for mapping purposes.
     * @returns {} A promise containing the single, unpacked record returned by the API or null if the result set is empty.
     */
    private unpackSingleDatumOrNull = <T extends IRawDataConverter>(rawResponse: ng.IHttpPromiseCallbackArg<{}>, returnType: new () => T): ng.IPromise<T> => {
        return this.validateApiResult(rawResponse)
            .then((response) => {
                if (response.ResultSet.length === 0) {
                    return this._q.when(null);
                }
                else if (response.ResultSet.length > 1) {
                    return this._q.reject("Expecting a single record or null, received multiple: " + response.ResultSet.length);
                } else {
                    let mappedData = this.createMappedResultSet<T>(response.ResultSet, returnType);
                    return this._q.when(mappedData[0]);
                }
            });       
    }

    /**
     * Creates a mapping from a raw data type to the desired return type by invoking the object's .fromRawData method. 
     * @param rawResults Results coming directly from the target API
     * @param returnType Constructor function (class) to call 
     * @returns {} New array of constructed type T if returnType is specified; returns rawResults unchanged otherwise
     */
    private createMappedResultSet = <T extends IRawDataConverter>(rawResults: Object[], returnType: new () => T): T[] => {
        if (!returnType) {
            return rawResults as T[];
        }

        let mappedResults: T[] = [];

        for (let i = 0; i < rawResults.length; i++) {
            let mappedResult = new returnType();
            mappedResult.fromRawData(rawResults[i]);
            mappedResults.push(mappedResult);
        }

        return mappedResults;
    }

    /**
     * Wraps a post or put payload object in it's container item compatible with the API
     * @param data data to convert to payload
     * @param returnType type which supplies the toRawData method
     * @returns {} packaged payload
     */
    private createRawDataPayload = <T extends IRawDataConverter>(data: T, returnType: new () => T): Object => {
        let payload: { [apiDataType: string]: Object } = {};
        payload[data.rawDataType] = data.toRawData();
        return payload;
    }

    /**
     * Checks for null-valued params that would be auto-stripped by the $httpParamSerializer
     * @param params Object, containing the params to be serialized onto the request querystring
     * @returns boolean True if a null-valued param exists
     */
    private hasNullValuedProperties = (params: Object): boolean => {
        //Workaround for type checker, treating object as key:value pairs of properties
        let iteredParams = params as { [key: string]: {} };

        if (!params) {
            return false;  // it's okay if there are no params, just not a param with no value
        }

        for (var key in iteredParams) {
            if (iteredParams.hasOwnProperty(key)) {
                if (iteredParams[key] === null || angular.isUndefined(iteredParams[key])) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Generate an error message and report it to the console.
     * @param error Object containing either a string message or a non-sucess $http response object
     * @param method string to print the source of the error (more specific than the HTTP method)
     * @param url string to print for ease in debugging
     * @returns string string message
     */
    private emitPagedApiError = (error: Object, method: string, url: string): ng.IHttpPromiseCallbackArg<{}> => {
        let errorResponse: ng.IHttpPromiseCallbackArg<{}> = {};

        let message = `PagedAPI Error at ${method} for endpoint: ${url}. \n`;
        let status = 200;
        
        //Messages originating from PagedAPI, log to console
        if (typeof (error) === "string") {
            errorResponse.config = null;
            errorResponse.headers = null;
            errorResponse.status = 200;
            errorResponse.statusText = "OK";

            errorResponse.data = message + error;
            window.console.warn(errorResponse.data);

        //Messages originating from unsucessful $http call. Don't log to console because the browser already does that for us.
        } else {
            errorResponse = <ng.IHttpPromiseCallbackArg<{}>>error;
        }
        
        return errorResponse;
    }
}