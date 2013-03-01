
/*
 * couch.spec.js
 * ----------------
 * testing my couch module
 */

var config = require('../config'),
    couch = require('../couch'),
    log = require('../logging'),
    fs = require('fs'),
    url = require('url');

describe("CouchDb module", function() {
    it("should have all the configuration parameters", function() {
        var connection_url = url.parse(couch.connection.host),
            config_url = url.parse(config.couch.host);
        expect("https://" + url.format(connection_url) + '/').toBe(url.format(config_url));
        expect(couch.connection.port).toBe(config.couch.port);
        expect(couch.name).toBe(encodeURIComponent(config.couch.name));
    });

    it("should return an existent database", function() {
        var error = null, flag = null;

        runs(function() {
            couch.exists(function(err, exists) {
                error = err;
                flag = exists;
            });
        });

        waitsFor(function() {
            return flag != null;
        }, "CouchDb to return existence status", 1000);

        runs(function() {
            expect(error).toBeFalsy();
            expect(flag).toBe(true);
        });
    });

    it("should hoist design documents", function() {
        var ddoc = null;

        runs(function() {
            couch.get('_design/test', function(err, doc) {
                log.info("got doc: " + JSON.stringify(doc));
                ddoc = doc;
            });
        });

        waitsFor(function() {
            return ddoc != null;
        }, "CouchDb to return ddoc or ddoc status", 1000);

        runs(function() {
            expect(ddoc).not.toBeNull();
            fs.readFileSync("db/design_doc/test.json", "utf8", function(err, data) {
                var rdoc = JSON.parse(data);
                expect(ddoc._id).toEqual(rdoc._id);
                expect(ddoc.language).toEqual(rdoc.language);
                expect(ddoc.views).toEqual(rdoc.views);
                expect(ddoc.shows).toEqual(rdoc.shows);
            });
        });
    });

    it("should perform rollback", function() {
        
    });
});