
/*
 * config.js
 * ----------------
 * various common configuration details.
 */

module.exports = {
    /* bot auth info
     * format:
     * {
     *     "botName": {
     *         "auth_token": <string> "...",
     *         "user_id":    <string> "..."
     *     },
     *     ...
     * }
     */
    "bots": require("./auth/accounts.auth"),

    /* database configuration info
     * format:
     * {
     *     "host": <string> "...",
     *     "port": <int> ...,
     *     // name of the database this app will use
     *     "name": <string> "..."
     * }
     */
    "couch": require("./auth/couch.auth"),

    // the default room to connect to
    "room_id":    "511ee036aaa5cd6932f6e443",
    // directory with couchdb design docs
    "ddoc_dir": "db/design_doc"
};