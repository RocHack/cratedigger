
/*
 * couch.spec.js
 * ----------------
 * testing my couch module
 */

var async = require('async'),
    config = require('../config'),
    couch = require('../couch'),
    log = require('../logging'),
    fs = require('fs'),
    url = require('url'),
    _ = require('underscore')._;

describe("CouchDb module", function() {
    var standard_timeout;

    beforeEach(function() {
        standard_timeout = 5000;
    });

    it("should have all the configuration parameters", function() {
        var connection_url = url.parse(couch.connection.host),
            config_url = url.parse(config.couch.host);
        expect("https://" + url.format(connection_url) + '/').toBe(url.format(config_url));
        expect(couch.connection.port).toBe(config.couch.port);
        expect(couch.name).toBe(encodeURIComponent(config.couch.name));
    });

    it("should return an existent database", function() {
        var error = null,
            flag = null;

        waitsFor(function() {
            if(!flag)
                async.series([
                    function(callback) {
                        couch.exists(function(err, exists) {
                            callback(err, exists);
                        });
                    }
                ], function(err, results) {
                    if(err)
                        log.error(JSON.stringify(err));
                    error = err;
                    flag = results[0];
                });
            return flag;
        }, "CouchDb to return existence status", standard_timeout);

        runs(function() {
            expect(error).toBeFalsy();
            expect(flag).toBe(true);
        });
    });

    it("should hoist design documents", function() {
        var ddoc1 = null,
            ddoc2 = null,
            result = false;

        waitsFor(function() {
            async.series([
                function(callback) {
                    couch.get('_design/test', function(err, doc) {
                        if(doc) {
                            callback(null, doc);
                        }
                    });
                },
                function(callback) {
                    couch.get('_design/test2', function(err, doc) {
                        if(doc) {
                            callback(null, doc);
                        }
                    });
                }
            ], function(err, results) {
                ddoc1 = results[0];
                ddoc2 = results[1];
                result = (ddoc1 != null && ddoc2 != null);
            });
            return result;
        }, "CouchDb to return ddoc or ddoc status", standard_timeout);

        runs(function() {
            expect(ddoc1).not.toBeNull();
            expect(ddoc2).not.toBeNull();
            fs.readFileSync("db/design_doc/test.json", "utf8", function(err, data) {
                var rdoc = JSON.parse(data);
                expect(ddoc1._id).toEqual(rdoc._id);
                expect(ddoc1.language).toEqual(rdoc.language);
                expect(ddoc1.views).toEqual(rdoc.views);
                expect(ddoc1.shows).toEqual(rdoc.shows);
                expect(ddoc1._rev).toBeDefined();
                expect(rdoc._rev).not.toBeDefined();
            });
            fs.readFileSync("db/design_doc/test2.json", "utf8", function(err, data) {
                var rdoc = JSON.parse(data);
                expect(ddoc2._id).toEqual(rdoc._id);
                expect(ddoc2.language).toEqual(rdoc.language);
                expect(ddoc2.views).toEqual(rdoc.views);
                expect(ddoc2.shows).toEqual(rdoc.shows);
                expect(ddoc2._rev).toBeDefined();
                expect(rdoc._rev).not.toBeDefined();
            });
        });
    });

    it("should have rollback-related methods", function() {
        expect(couch.commit).toBeDefined();
        expect(couch.rollback).toBeDefined();
        expect(couch.hoist).toBeDefined();
    });

    it("should have 'safe' and 'sync' methods for all API methods", function() {
        var api_methods = [
            "exists", "replicate", "info", "create",
            "destroy", "get", "put", "post", "save",
            "merge", "update", "remove", "all", "view",
            "temporaryView", "list", "changes",
            "getAttachment", "removeAttachment",
            "saveAttachment"
        ];
        _.each(api_methods, function(method) {
            expect(couch[method + "Safe"]).toBeDefined();
        });
    });

    it("should output errors when using 'safe' methods", function() {
        couch.getSafe("derp", function(err, result) {
            expect(err).toBeDefined();
        });
        // just inspect the file cause I'm a lazy ass
    });
    
    // TODO: add timeouts to waits!!!
    xit("should perform a rollback", function() {
        var doc1 = { "_id": "doc001", "text": "garp" },
            doc2 = { "_id": "doc002", "text": "harp" },
            doc3 = { "_id": "doc003", "text": "narp" },
            res1 = null,
            res2 = null,
            res3 = null,
            issued = false,
            flags = [];

        // issue saves
        waitsFor(function() {
            if(!issued)
                async.series([
                    function(callback) {
                        couch.save(doc1._id, doc1, function(err, result) {
                            if(err) {
                                log.info(JSON.stringify(err));
                                callback(null, false);
                            } else {
                                res1 = result;
                                callback(null, true);
                            }
                        });
                    },
                    function(callback) {
                        couch.save(doc2._id, doc2, function(err, result) {
                            if(err) {
                                log.info(JSON.stringify(err));
                                callback(null, false);
                            } else {
                                res2 = result;
                                callback(null, true);
                            }
                        });
                    },
                    function(callback) {
                        couch.save(doc3._id, doc3, function(err, result) {
                            if(err) {
                                log.info(JSON.stringify(err));
                                callback(null, false);
                            } else {
                                res3 = result;
                                callback(null, true);
                            }
                        });
                    }
                ], function(err, results) {
                    flags = results;
                });
            issued = true;
            return _.reduce(flags, function(build, value) { return build && value; }, true);
        });
        
        // check that saves worked
        runs(function() {
            async.series([
                function(callback) {
                    couch.get(doc1._id, function(err, result) {
                        if(err) {
                            log.info(JSON.stringify(err));
                            callback(null, false);
                        } else {
                            res1 = result;
                            callback(null, true);
                        }
                    });
                },
                function(callback) {
                    couch.get(doc2._id, function(err, result) {
                        if(err) {
                            log.info(JSON.stringify(err));
                            callback(null, false);
                        } else {
                            res2 = result;
                            callback(null, true);
                        }
                    });
                },
                function(callback) {
                    couch.get(doc3._id, function(err, result) {
                        if(err) {
                            log.info(JSON.stringify(err));
                            callback(null, false);
                        } else {
                            res3 = result;
                            callback(null, true);
                        }
                    });
                }
            ], function(err, results) {
                expect(_.reduce(results, function(build, value) { return build && value; }, true)).toBe(true);
            });
        });

        // issue rollback
        issued = false;
        flags = [];
        waitsFor(function() {
            if(!issued)
                async.series([
                    function(callback) {
                        couch.rollback(function(err, results) {
                            if(err) {
                                log.info(JSON.stringify(err));
                                callback(null, false);
                            } else {
                                callback(null, true);
                            }
                        });
                    }
                ], function(err, results) {
                    flags = results;
                });
            issued = true;
            return _.reduce(flags, function(build, value) { return build && value; }, true);
        });

        // check that the rollback worked
        runs(function() {
            async.series([
                function(callback) {
                    couch.get(doc1._id, function(err, result) {
                        if(err && !result) {
                            callback(null, true);
                        } else {
                            log.info("why is there a result :(");
                            log.info(JSON.stringify(result));
                            callback(null, false);
                        }
                    });
                },
                function(callback) {
                    couch.get(doc2._id, function(err, result) {
                        if(err && !result) {
                            callback(null, true);
                        } else {
                            log.info("why is there a result :(");
                            log.info(JSON.stringify(result));
                            callback(null, false);
                        }
                    });
                },
                function(callback) {
                    couch.get(doc3._id, function(err, result) {
                        if(err && !result) {
                            callback(null, true);
                        } else {
                            log.info("why is there a result :(");
                            log.info(JSON.stringify(result));
                            callback(null, false);
                        }
                    });
                }
            ], function(err, results) {
                expect(_.reduce(results, function(build, value) { return build && value; }, true)).toBe(true);
            });
        });
    });

    xit("should be able to rollback to specific commits", function() {

    });

    xit("should invalidate subsequent commits after an update", function() {

    });
});