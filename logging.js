
var winston = require('winston');
var logger_instance = null;

module.exports = (function() {
    if(!logger_instance) {
        var fileparts = __filename.split("/");
        var filename = fileparts[fileparts.length - 1].split(".")[0];
        logger_instance = new (winston.Logger)({
            transports: [
                new (winston.transports.Console)({ level: 'error' }),
                new (winston.transports.File)({ filename: filename + '.log' })
            ]
        });
    }

    return logger_instance;
})();