var LoggerFactory = require('./logger.js').LoggerFactory;

var myLogger = LoggerFactory.createLogger(
    {
        levels: {
            info: 'green',
            warning: 'yellow',
            error: 'red',
            myLevel: 'magenta'
        },
        output: {
            console: '',
            file: 'myLog.log',
            html: 'myHtmlLog.html'
        }
    }
);

myLogger.log('info', 'This is my first message');
myLogger.log('myLevel', 'asd');