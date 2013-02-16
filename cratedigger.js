
var fs = require('fs'),
    util = require('util'),
    _ = require('underscore')._,
    Turntable = require('ttapi'),
    config = require('./config'),
    log = require('./logging');

// utility methods
_.mixin({
    // NOTE: add fields to these as necessary. the idea is to only cover the necessary fields.
    "verify_roomInfo": function(data) {
        // confirm expected fields
        if(!(_.has(data, "room") && _.has(data.room, "name") && _.has(data.room, "roomid") &&
                _.has(data.room, "metadata") && _.has(data.room.metadata, "current_song")))
            return false;
        return true;
    },

    "verify_update_votes": function(data) {
        // confirm expected fields
        if(!(_.has(data, "room") && _.has(data.room, "metadata") && _.has(data.room.metadata, "votelog")))
            return false;
        return true;
    }
});

var Model = module.exports.Model = (function() {
    var _cls = function(attr) {
        this.entries = [];
        this.users = [];

        // TODO: load from couchdb
    };

    // instance methods
    _.extend(_cls.prototype, {
        "has_user": function(user) {
            return _.has(this.users, user);
        },

        "update_users": function(user) {
            this.users = _.union(this.users, (_.isArray(user) ? user : [user]));
        },

        "update_votes": function(data) {
            var entry = _.findWhere(this.entries, { "room": data.room, "song": data.song });
            if(!entry) {
                entry = { "room": data.room, "song": data.song, "votes": data.votes };
                this.entries.push(entry);
            } else {
                entry.votes = _.union(entry.votes, data.votes);
            }
        }
    });

    return _cls;
})();

var events = module.exports.events = {
    /*
     * update_votes [handler]:
     *     update bot's model with upvotes as they roll in
     */
    "update_votes": function(model, data) {
        // confirm data integrity
        try {
            if(!_.verify_update_votes(data))
                throw new Exception("malformed update_votes data:\n" + JSON.stringify(data));

            // grab all upvotes
            var ups = [], votelog = data.room.metadata.votelog;
            _.each(data.room.metadata.votelog, function(vote) {
                var user = vote[0], thumb = vote[1];
                if(!model.has_user(user))
                    model.update_users(user);
                if(thumb == "up")
                    ups.push(user);
            });

            // grab current song from room info, update model upvotes
            var songname = "", artist = "";
            this.roomInfo(function(room_data) {
                if(!_.verify_roomInfo(room_data))
                    throw new Exception("malformed roomInfo data:\n" + JSON.stringify(data));

                model.update_votes({
                    "room": room_data.room.metadata.roomid,
                    "song": room_data.room.metadata.current_song,
                    "votes": ups
                });

                log.info(room_data.room.metadata.current_song);
                songname = room_data.room.metadata.current_song.metadata.song;
                artist = room_data.room.metadata.current_song.metadata.artist;

                // send acknowledgment
                if(data.room.metadata.votelog[0][1] == "up") {
                    var username = "";
                    this.getProfile(data.room.metadata.votelog[0][0], function(data) {
                        log.info(JSON.stringify(data));
                        username = data["name"];
                        this.speak("Hey " + username + " you lookin fiiiiine today.", function() {
                            this.speak("Oooooooh you like \"" + songname + "\" by " + artist + "?", function() {
                                this.speak("I like that you like that ;)");
                            });
                        });
                    });
                }
            });
        } catch(e) {
            log.error(e.message);
        }
    }
};

(function() {
    if(!module.parent) {
        // initialize bot
        var auth_token = config["auth_token"];
        var user_id = config["user_id"];
        var room_id = config["room_id"];
        var stats_dir = config["stats_dir"];
        var tt = new Turntable(auth_token, user_id, room_id);
        var model = new Model({ "stats": stats_dir });

        // add bot events
        _.each(events, function(callback, event_name) {
            this.on(event_name, _.bind(callback, this, model));
        }, tt);
    }
})();