export interface IRawDataConverter {
    rawDataType: string; //The _type value expected from the API
    fromRawData(rawModel: any): any; //convert the data from the API model to strongly typed model
    toRawData(modelExtensions?: any): any; // convert the strongly typed model to API model
}