export interface ICancellationToken {
    cancellationRequested: boolean;

    cancel: () => void;
}

export class CancellationToken implements ICancellationToken {
    public cancellationRequested: boolean = false;

    public cancel = () => {
        this.cancellationRequested = true;
    }
}