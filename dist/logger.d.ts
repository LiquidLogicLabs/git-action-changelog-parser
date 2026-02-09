export declare class Logger {
    readonly verbose: boolean;
    readonly debugMode: boolean;
    constructor(verbose?: boolean, debugMode?: boolean);
    info(message: string): void;
    warning(message: string): void;
    error(message: string): void;
    verboseInfo(message: string): void;
    debug(message: string): void;
    isVerbose(): boolean;
    isDebug(): boolean;
}
