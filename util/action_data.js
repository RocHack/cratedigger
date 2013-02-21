
var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    _ = require('underscore')._,
    Turntable = require('ttapi'),
    config = require('../config'),
    log = require('../logging');

var actions = module.exports.actions = [
    "roomNow", "listRooms", "directoryGraph", "directoryRooms", "stalk",
    "getFavorites", "roomInfo", "userInfo", "getAvatarIds", "getFanOf",
    "getFans", "getProfile", "snag", "playlistAll", "getStickers"
];

(function() {
    if(!module.parent) {
        // initialize bot
        var auth_token = config["auth_token"];
        var user_id = config["user_id"];
        var room_id = config["room_id"];
        var stats_dir = config["stats_dir"];
        var tt = new Turntable(auth_token, user_id, room_id);

        tt.on("roomChanged", function() {
            // perform BASIC actions, get info
            // (these are ones for which no arguments need be supplied)
            _.each(actions, function(action) {
                log.info("On action \"" + action + "\"...");
                (tt[action])(function(data) {
                    var file_name = path.resolve(__dirname) + "/actions/" + action + ".json";
                    var write_method = fs.exists(file_name) ? "writeFile" : "appendFile";
                    fs[write_method](file_name, JSON.stringify(data, null, 4), function(err) {
                        if(err) {
                            log.error(err);
                        } else {
                            log.info("File actions/" + action + ".json saved.");
                        }
                    });
                });
            });
        });
    }
})();