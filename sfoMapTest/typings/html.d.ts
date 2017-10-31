
declare module "*.html" {
    const _: string;
    // Disable next line disabled here since it allows typescript to recognise
    // templates as strings when they are imported.
    // tslint:disable-next-line
    export default _;
}