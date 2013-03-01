
/*
 * couch.js
 * ----------------
 * helpful wrapping module for cradle.
 * shares a singleton db among files for each node instance.
 * loads db with specified design docs.
 */

var config = require('./config'),
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

        // create db if it doesn't exist
        db.exists(function(err, exists) {
            if(err != null) {
                log.error("Error on database existence check.\n" + JSON.stringify(err));
                return;
            }

            // create db if necessary
            if(!exists)
                db.create();
            // add any updates to the design docs
            fs.readdir(ddoc_dir, function(err, files) {
                if(err)
                    log.error("Error on readdir of db/design_doc", err);
                // read each ddoc as json
                _.each(files, function(file) {
                    var ddoc = null;
                    fs.readFile(ddoc_dir + "/" + file, "utf8", function(err, data) {
                        if(err)
                            log.error("Error on readdir of db/design_doc", err);
                        ddoc = JSON.parse(data);
                        // check if ddoc already exists & we need to sync it
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
            });
        });
    }

    return couch_instance;
})(); 