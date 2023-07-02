import ILogger from './ILogger';

export default class DevelopmentLogger implements ILogger {
    info(message: string): void {
        console.log(message);
    }
    warn(message: string): void {
        console.warn(message);
    }
    debug(message: string): void {
        console.debug(message);
    }
    error(message: string): void {
        console.error(message);
    }
}