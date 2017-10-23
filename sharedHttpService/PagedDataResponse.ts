export interface IPagedDataResponse<T> {
    ResultSet: Array<T>;
    _metadata: IPagedMetadata;
    _type: string;
}

export interface IPagedMetadata {
    Limit: number;
    Offset: number;
    TotalCount: number;
}