
var fs = require('fs'),
    util = require('util'),
    _ = require('underscore')._,
    Turntable = require('ttapi'),
    config = require('../config'),
    log = require('../logging'),
    winston = require('winston');

(function() {
    var bots = {};

    // initialize bots
    _.each(config.bots, function(bot, name) {
        var auth_token = bot.auth_token;
        var user_id = bot.user_id;
        var tt = bots[name] = new Turntable(auth_token, user_id);
        log.warn("Created bot " + name + "!");

        // bot events
        tt.on('roomChanged', function(data) {
            log.info("" + data);
            log.warn("[" + name + "] successfully connected.");
            tt.speak("Waddup mothafuckazzzz");
        });
    });

    // make bots connect
    _.each(bots, function(bot, name) {
        bot.roomRegister(config.room_id);
    });

    // cleanup event
    process.on('SIGINT', function() {
        var leave_count = 0;
        _.each(bots, function(bot, name) {
            log.info("[" + name + "] leaving the room.");
            bot.speak("word to ya motha");
            var left = leave_count = leave_count + 1;
            bot.roomDeregister(function() {
                if(left >= _.size(bots))
                    process.exit(0); 
            });
        });
    });
})();