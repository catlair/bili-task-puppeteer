const loggerLevelENV = process.env.LOGGER_LEVEL?.toUpperCase();
const levels = [
  'ALL',
  'MARK',
  'TRACE',
  'DEBUG',
  'INFO',
  'WRAN',
  'ERROR',
  'FATAL',
  'OFF',
];

const loggerLevel = levels.includes(loggerLevelENV) ? loggerLevelENV : 'INFO';

const options = {
  appenders: {
    console: {
      type: 'logLevelFilter',
      level: loggerLevel,
      appender: 'consoleCurrent',
    },
    consoleCurrent: {
      type: 'console',
    },
    everything: {
      type: 'file',
      filename: 'logs/detail.log',
    },
    errorFile: {
      type: 'file',
      filename: 'logs/errors.log',
    },
    errors: {
      type: 'logLevelFilter',
      level: 'WARN',
      appender: 'errorFile',
    },
    infoFile: {
      type: 'file',
      filename: 'logs/runInfo.log',
    },
    runInfo: {
      type: 'logLevelFilter',
      level: loggerLevel,
      appender: 'infoFile',
    },
  },
  categories: {
    default: {
      appenders: ['errors', 'runInfo', 'everything', 'console'],
      level: 'ALL',
    },
  },
};

export default options;
