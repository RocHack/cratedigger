
/*
 * couch.js
 * ----------------
 * helpful wrapping module for cradle.
 * shares a singleton db among files for each node instance.
 * loads db with specified design docs.
 */

var async = require('async'),
    config = require('./config'),
    cradle = require('cradle'),
    fs = require('fs'),
    log = require('./logging'),
    _ = require('underscore')._;
var couch_instance = null;

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

        var db = couch_instance = connection.database(dbname);

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
                            db.create();
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