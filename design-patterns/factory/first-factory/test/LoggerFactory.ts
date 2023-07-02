import  LoggerFactory from '../src/AbstractFactory';

const logger = LoggerFactory.createLogger();

logger.debug('This is a [debug] message');
logger.warn('This is a [warn] message');
logger.error('This is a [error] message');
logger.info('This is a [info] message');