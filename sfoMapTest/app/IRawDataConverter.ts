export interface IRawDataConverter {
    fromRawData(rawModel: any): void; //convert the data from the API model to the typescript model
    toRawData(): {}; // convert the typescript model to API model
}