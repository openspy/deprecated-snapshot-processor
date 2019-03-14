/*
Read snapshot, search for player progress record from same day for each recorded option
  - career points  
  - score
  - time played
  - kills and death
  - score per minute
  - time as role
  - capture stats
  - accuracy
  - wins and losses
  - teamwork
  - support action

  "data": {
    "scores": {
        "aggregated": {
         "score": 111
        },
        "rawData": [
            {"score": 100},
            {"score": 111},
        ]
    }
  }
*/
var moment = require('moment');
var PlayerRecordModel = require('../../../lib/PlayerRecordModel');
function PlayerProgressProcessor(DbCtx, database, options) {
    this.options = options;
    this.DbCtx = DbCtx;
    this.database = database;    
    this.playerRecordModel = new PlayerRecordModel(DbCtx, database, options);    
    this.pageKey = "player_progress";
    this.player_progress_collection = database.collection('player_progress');
}
PlayerProgressProcessor.prototype.processSnapshot = function(server_data, player_snapshot_data) {
    return new Promise(async function(resolve, reject) {
        await this.ProcessScore(server_data, player_snapshot_data);
        resolve();
    }.bind(this));
};
PlayerProgressProcessor.prototype.CreateProgressKey = function(profileid, key) {
    return new Promise(function(resolve, reject) {
        this.playerRecordModel.fetch({pageKey: this.pageKey, gameid: this.options.gameid, profileid: profileid}).then(function(progress) {
            if(!progress) {
                progress = {};
            }
            progress.gameid = this.options.gameid;
            progress.profileid = profileid;
            progress.pageKey = this.pageKey;
            if(!progress.data) {
                progress.data = {};
            }
            if(!progress.data[key]) {
                progress.data[key] = [];
            }
            this.playerRecordModel.insertOrUpdate(progress).then(resolve, reject);
        }.bind(this));
    }.bind(this));

}
PlayerProgressProcessor.prototype.ProcessScore = function(server_data, player_snapshot_data) {
    return new Promise(async function(resolve, reject) {
        
        var profileid = parseInt(player_snapshot_data.pid);
        //var latest = await this.getMostRecentProgressData(profileid, "scores");
        var mapTime = Math.floor(parseFloat(server_data.mapend));
        var mTime = moment.unix(mapTime).startOf('day').unix();

        var key = "score";
        await this.CreateProgressKey(profileid, key);

        var gsco = parseInt(player_snapshot_data.gsco);
        if(isNaN(gsco)) return resolve();
        var nearest = await this.getLatestProgressBeforeDateRange(profileid, key, mapTime);
        if(nearest && nearest.date == mTime) {
            //update date
            //profileid, key, date, set_data
            nearest.score += gsco;
            await this.updateProgressByDate(profileid, key, nearest.date, nearest);
            
        } else {
            //insert new date, with old score to increment off of
            var score  = 0;
            if(nearest && nearest.score) {
                score = nearest.score;
            }
            score += gsco;
            var data = {date: mTime, score: score};
            await this.setNewProgressEntry(profileid, key, data)
        }
        await this.reduceProgressEntries(profileid, key, 35);
        resolve();
    }.bind(this));
}
PlayerProgressProcessor.prototype.getMostRecentProgressData = function(profileid, key) {
    return new Promise(function(resolve, reject) {
        var array_key = "$data." + key;
        this.player_progress_collection.aggregate([{$match: {"gameid": this.options.gameid, "profileid": profileid, "pageKey": this.pageKey}},{"$project": { latest: {"$arrayElemAt": [array_key, { "$indexOfArray": [ array_key+".date", {"$max": array_key+".date"}]} ] } }}], function(err, cursor) {
            let last_latest = {};
        
            cursor.on('data', function(data) {
                last_latest = data;
            });
    
            cursor.on('end', function() {
                if(!last_latest || !last_latest.latest) {
                    return resolve({});
                }
                resolve(last_latest.latest);
            })    
        });
    }.bind(this));
}
PlayerProgressProcessor.prototype.getLatestProgressWithinDateRange = function(profileid, key, minDate, maxDate) {
    return new Promise(function(resolve, reject) {
        var array_key = "$data." + key;
        this.player_progress_collection.aggregate([{$match: {"gameid": this.options.gameid, "profileid": profileid, "pageKey": this.pageKey}}, {$project: {"progressData": { $filter: { input: array_key, as: "item", cond: { $and: [{$lte: [ "$$item.date", maxDate ]},{$gte: [ "$$item.date", minDate ]},]} } }}}, {"$project": {_id: 0, latest: {"$arrayElemAt": ["$progressData", { "$indexOfArray": [ array_key, {"$max": array_key+".date"}]} ] } }}], function(err, cursor) {
            let last_latest = {};
        
            cursor.on('data', function(data) {
                last_latest = data;
            });
    
            cursor.on('end', function() {
                if(!last_latest || !last_latest.latest) {
                    return resolve({});
                }
                resolve(last_latest.latest);
            })    
        });
    }.bind(this));
}

PlayerProgressProcessor.prototype.getLatestProgressBeforeDateRange = function(profileid, key, maxDate) {
    return new Promise(function(resolve, reject) {
        var array_key = "$data." + key;
        this.player_progress_collection.aggregate(
            [{$match: {"gameid": this.options.gameid, "profileid": profileid, "pageKey": this.pageKey}}, 
            {$project: {"progressData": 
                { $filter: { input: array_key, as: "item", cond: { 
            $lte: [ "$$item.date", maxDate ]
                    } } }
                }}
                , {"$project": {_id: 0, latest: {"$arrayElemAt": ["$progressData", { "$indexOfArray": [ "$progressData.date", 
                {"$max":  array_key + ".date"}
                ]} ] } }}
                ]
            
            , function(err, cursor) {
            let last_latest = {};
        
            cursor.on('data', function(data) {
                last_latest = data;
            });
    
            cursor.on('end', function() {
                if(!last_latest || !last_latest.latest) {
                    return resolve({});
                }
                resolve(last_latest.latest);
            })
        });
    }.bind(this));
}
PlayerProgressProcessor.prototype.updateProgressByDate = function(profileid, key, date, set_data) {
    //db.getCollection('player_progress').update({gameid: 1324, profileid: 123, pageKey: "player_progress", "data.scores.date": 15000}, {$set: {"data.scores.$.score": 1, "data.scores.$.test": 666}})

    return new Promise(function(resolve, reject) {
        

        var element_key = "data." + key;
        var set_key = element_key + ".$";
        var raw_set_data = {};
        raw_set_data[set_key] = set_data;



        var search_key = element_key + ".date";
        var push_data = {};

        push_data[element_key] = set_data;
        var searchParams = {gameid: this.options.gameid, profileid: profileid, pageKey: this.pageKey};
        searchParams[search_key] = date;
        this.player_progress_collection.updateOne(searchParams,
        {$set: raw_set_data}, function(result, err) {
            resolve();
        });
    }.bind(this));

}
PlayerProgressProcessor.prototype.setNewProgressEntry = function(profileid, key, data) {
    
    return new Promise(function(resolve, reject) {
        var element_key = "data." + key;
        var push_data = {};
        push_data[element_key] = data;
        this.player_progress_collection.updateOne({gameid: this.options.gameid, profileid: profileid, pageKey: this.pageKey},
        {$push: push_data}, function(result, err) {
            resolve();
        });
    }.bind(this));
}
PlayerProgressProcessor.prototype.reduceProgressEntries = function(profileid, key, reduce_to) {
    //aggregate([{$match: {"_id" : ObjectId("5c885a618eb8f14df4a4863f")}}, {$project: { "items": {$slice: [ "$data.scores", -10] }}}])
    return new Promise(function(resolve, reject) {
        var element_key = "data." + key;
        var array_key = "$data." + key;
        this.player_progress_collection.aggregate([{$match: {"gameid": this.options.gameid, "profileid": profileid, "pageKey": this.pageKey}}, {$project: { "items": {$slice: [ array_key, -reduce_to] }}}], function(err, cursor) {
            var minimized_data = {};
            cursor.on('data', function(data) {
                minimized_data = data;
            });
    
            cursor.on('end', function() {
                if(!minimized_data) {
                    return reject();
                }
                var set_data = {};
                set_data[element_key] = minimized_data.items;
                this.player_progress_collection.updateOne({"gameid": this.options.gameid, "profileid": profileid, "pageKey": this.pageKey}, {$set: set_data}, function(err, results) {
                    resolve();
                });
            }.bind(this));
        }.bind(this));
    }.bind(this));
}
module.exports = PlayerProgressProcessor;