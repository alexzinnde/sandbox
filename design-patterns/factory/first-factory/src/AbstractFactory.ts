import ILogger from './ILogger';
import ProductionLogger from './ProductionLogger';
import DevelopmentLogger from './DevelopmentLogger';

export default class LoggerFactory {
    public static createLogger(): ILogger {
        if (process.env.NODE_ENV === 'production') {
            return new ProductionLogger();
        } else {
            return new DevelopmentLogger();
        }
    }
}