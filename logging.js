
/*
 * logging.js
 * ----------------
 * helpful wrapping module for winston.
 * shares a singleton logger among files for each node instance.
 * will write to a .log file named after the .js file being run.
 */

var winston = require('winston');
var logger_instance = null;

module.exports = (function() {
    if(!logger_instance) {
        var filename = module.parent.filename.split(".")[0];
        logger_instance = new (winston.Logger)({
            transports: [
                new (winston.transports.Console)({ level: 'error' }),
                new (winston.transports.File)({ filename: filename + '.log' })
            ]
        });
    }

    return logger_instance;
})();