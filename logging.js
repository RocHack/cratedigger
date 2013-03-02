
/*
 * logging.js
 * ----------------
 * helpful wrapping module for winston.
 * shares a singleton logger among files for each node instance.
 * will write to a .log file named after the .js file being run.
 */

var path = require('path'),
    winston = require('winston');
var logger_instance = null;

module.exports = (function() {
    if(!logger_instance) {
        var filename = path.basename(module.parent.filename, path.extname(module.parent.filename));
        logger_instance = new (winston.Logger)({
            transports: [
                new (winston.transports.Console)({ level: 'error' }),
                new (winston.transports.File)({ filename: 'log/' + filename + '.log' })
            ]
        });
    }

    return logger_instance;
})();