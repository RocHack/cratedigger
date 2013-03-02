
/*
 * couch.js
 * ----------------
 * helpful wrapping module for cradle.
 * shares a singleton db among files for each node instance.
 * loads db with specified design docs.
 */

var Args = require("vargs").Constructor,
    async = require('async'),
    config = require('./config'),
    cradle = require('cradle'),
    fs = require('fs'),
    log = require('./logging'),
    _ = require('underscore')._;
var couch_instance = null;

/*
 * extensions: additional methods for convenience and testing purposes
 */
var couch_extensions = {
    /*
     * commit: mark current update sequence for rollbacks
     */
    "commit": function() {
        // TODO: write it
    },

    /*
     * rollback: undo all changes since a certain commit
     */
    "rollback": function() {
        // TODO: write it
    },

    /*
     * hoist: upload local documents to couch.
     *     NOTE - will overwrite an existing copy of document.
     */
    "hoist": function() {
        // TODO: write it
    }
};

(function() {
    var api_methods = [
            "exists", "replicate", "info", "create",
            "destroy", "get", "put", "post", "save",
            "merge", "update", "remove", "all", "view",
            "temporaryView", "list", "changes",
            "getAttachment", "removeAttachment",
            "saveAttachment"
        ],
        middle_methods = {};
    /*
     * eat_error: helper for middleware
     */
    var eat_error = function(err) {
        if(err) {
            log.error(JSON.stringify(err));
            return err;
        }
        return null;
    };

    /*
     * safe_middleware: middleware function for standard cradle API methods.
     *     this is for reducing boilerplate mostly. because fuck copy and paste.
     *
     *     "safe": logs errors and peaces out
     */
    var safe_middleware = function(partial, callback) {
        partial(function(err, res) {
            // safe mode
            var bail = eat_error(err);
            if(bail)
                return;
            callback(err, res);
        });
    };

    // wrap all api methods
    _.each(api_methods, function(method) {
        middle_methods[method + "Safe"] = function(/* [whatevs, ...] */) {
            var args = new (Args)(arguments);
            var callback = args.callback;
            var that = this;
            var partial = _.bind(this[method], that);
            _.each(args.all, function(arg) {
                partial = _.bind(partial, that, arg);
            });
            return safe_middleware(partial, callback);
        };
    });

    // add middle methods to couch extensions
    _.extend(couch_extensions, middle_methods);
})();

module.exports = (function() {
    if(!couch_instance) {
        var host = config.couch.host,
            port = config.couch.port,
            dbname = config.couch.name,
            ddoc_dir = config.ddoc_dir;
        var connection = new(cradle.Connection)(host, port, {
            cache: true,
            raw: false
        });

        _.extend(cradle.Database.prototype, couch_extensions);
        var db = couch_instance = connection.database(dbname);
        /*_.each(couch_extensions, function(method, name) {
            _.extend(db, { name: _.bind(method, db) });
        });*/

        async.series([
            // create db if it doesn't exist
            function(callback) {
                db.exists(function(err, exists) {
                    if(err != null) {
                        log.error("Error on database existence check.");
                        callback(err, null);
                    } else {
                        // create db if necessary
                        if(!exists)
                            db.create(function(err, result) {
                                if(err)
                                    callback(err, null);
                                else
                                    callback(null, null);
                            });
                        else
                            callback(null, null);
                    }
                });
            },

            // add any updates to the design docs
            function(callback) {
                // add any updates to the design docs
                fs.readdir(ddoc_dir, function(err, files) {
                    if(err) {
                        log.error("Error on readdir of db/design_doc");
                        callback(err, []);
                    } else {
                        // read each ddoc as json
                        var ddocs = [];
                        _.each(files, function(file) {
                            fs.readFile(ddoc_dir + "/" + file, "utf8", function(err, data) {
                                if(err) {
                                    log.error("Error on readdir of db/design_doc", err);
                                    callback(err, null);
                                } else {
                                    ddocs.push(JSON.parse(data));
                                }
                                // fire callback on final file read
                                // ...dangerous?!?!
                                if(ddocs.length >= files.length) {
                                    callback(null, ddocs);
                                }
                            });
                        });
                    }
                });
            }
        ],

        // write ddocs to database
        function(err, results) {
            if(err) {
                log.error("" + JSON.stringify(err));
                return;
            }
            // check if ddoc already exists & we need to sync it
            var ddocs = results[1];
            _.each(ddocs, function(ddoc) {
                db.get(ddoc._id, function(err, doc) {
                    if(!doc) {
                        log.error("Error on get \"" + ddoc._id + "\", trying to save ddoc...");
                        log.error("Precise error: " + JSON.stringify(err));
                        db.save(ddoc._id, ddoc, function(err, res) {
                            if(err)
                                log.error("Error on \"" + ddoc._id + "\" save (new ddoc).", err);
                            else
                                log.info("Successfully saved \"" + ddoc._id + "\" to database.");
                        });
                    } else {
                        // (we will always overwrite for now)
                        // update with current revision
                        ddoc.rev = doc.rev;
                        db.save(ddoc._id, ddoc, function(err, res) {
                            if(err)
                                log.error("Error on \"" + ddoc._id + "\" save (existing ddoc).", err);
                            else
                                log.info("Successfully saved \"" + ddoc._id + "\" to database.");
                        });
                    }
                });
            });
        });
    }

    return couch_instance;
})(); 