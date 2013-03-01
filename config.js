
/*
 * config.js
 * ----------------
 * various common configuration details.
 */

module.exports = {
    // bot auth info
    // SUPER SECURE GUYS
    "bots": {
        "dj bookmarkz": {
            "auth_token": "ztQjjCKBdfHphBYJoSaalqWG",
            "user_id":    "5117fa7faaa5cd48cb7aad4d"
        },
        "cultOfLuna": {
            "auth_token": "wSYUqyBXRKJSBNWSGyEWFIDW",
            "user_id":    "512423fbeb35c10ad7707b38"
        },
        "entombed": {
            "auth_token": "CgCsZTdPgBCefWGeIVbdbFDu",
            "user_id":    "51242451eb35c10ad7707b3e"
        },
        "electricWizard": {
            "auth_token": "igwUlpgrjSnMfxHyXivzMLAy",
            "user_id":    "512424c7eb35c10ad7707b58"
        },
        "dfa1979": {
            "auth_token": "lvdYNdVDgXFhdRVHZipJPGdd",
            "user_id":    "5124261feb35c10ad7707b62"
        },
        "muxMool": {
            "auth_token": "lRfCwTHkcxFaUeDtFsnNJCAz",
            "user_id":    "51242759eb35c10ad7707b6e"
        },
        "massiveAttack": {
            "auth_token": "MUfLtgIcZWBKMcxODZVDlqAf",
            "user_id":    "51242855eb35c10ad7707b76"
        },
        "reverendBizarre": {
            "auth_token": "oCJHLHZxRlhgpIBJIkeZEdJv",
            "user_id":    "512428a4eb35c10ad7707b7b"
        },
        "skeletonwitch": {
            "auth_token": "NzmgLbBFSDhwybpsvQTljnPD",
            "user_id":    "51242969eb35c10ad7707b8e"
        },
        "tameImpala": {
            "auth_token": "DhrWRWIDRQRDFYuhBhnxTqSi",
            "user_id":    "51242a0aeb35c10ad7707b98"
        },
        "captainBeefheart": {
            "auth_token": "QBLsXuOFiSrDmzXphxaQCKQD",
            "user_id":    "51242b62eb35c10ad7707bb1"
        },
    },

    // database configuration info
    "couch": {
        "host": "https://app11774220.heroku:kJOtRsNBKTv2DRoeG7am6D2C@app11774220.heroku.cloudant.com",
        "port": 80, // FUCKING STUPID
        "name": "cratedigger"
    },

    // the default room to connect to
    "room_id":    "511ee036aaa5cd6932f6e443",
    // directory with couchdb design docs
    "ddoc_dir": "db/design_doc"
};