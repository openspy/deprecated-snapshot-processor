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
        let pid = parseInt(player_snapshot_data.pid);
        if(isNaN(pid)) return resolve();
        await this.ProcessScore(server_data, player_snapshot_data);
        await this.ProcessPoint(server_data, player_snapshot_data);
        await this.ProcessKills(server_data, player_snapshot_data);
        await this.ProcessTotalTimePlayed(server_data, player_snapshot_data);
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
        
        let profileid = parseInt(player_snapshot_data.pid);
        //var latest = await this.getMostRecentProgressData(profileid, "scores");
        let mapTime = Math.floor(parseFloat(server_data.mapend));
        let mTime = moment.unix(mapTime).startOf('day').unix();

        let key = "score";
        await this.CreateProgressKey(profileid, key);

        let gsco = parseInt(player_snapshot_data.gsco);
        if(isNaN(gsco)) return resolve();
        let nearest = await this.getLatestProgressBeforeDateRange(profileid, key, mTime);
        if(nearest && nearest.date == mTime) {
            //update date
            //profileid, key, date, set_data
            nearest.score += gsco;
            await this.updateProgressByDate(profileid, key, mTime, nearest);
            
        } else {
            //insert new date, with old score to increment off of
            let score  = 0;
            if(nearest && nearest.score) {
                score = nearest.score;
            }
            score += gsco;
            let data = {date: mTime, score: score};
            await this.setNewProgressEntry(profileid, key, data)
        }
        await this.reduceProgressEntries(profileid, key, 35);
        resolve();
    }.bind(this));
}

PlayerProgressProcessor.prototype.ProcessPoint = function(server_data, player_snapshot_data) {
    return new Promise(async function(resolve, reject) {
        
        let profileid = parseInt(player_snapshot_data.pid);
        //var latest = await this.getMostRecentProgressData(profileid, "scores");
        let mapTime = Math.floor(parseFloat(server_data.mapend));
        let mTime = moment.unix(mapTime).startOf('day').unix();

        let key = "point";
        await this.CreateProgressKey(profileid, key);

        let gsco = parseInt(player_snapshot_data.gsco);
        let experiencepoints = parseInt(player_snapshot_data.crpt);
        if(isNaN(gsco)) return resolve();
        let nearest = await this.getLatestProgressBeforeDateRange(profileid, key, mTime);

        if(nearest && nearest.date == mTime) {
            //update date
            //profileid, key, date, set_data
            nearest.globalscore += gsco;
            nearest.points += (gsco + experiencepoints);
            nearest.experiencepoints += experiencepoints;
            await this.updateProgressByDate(profileid, key, mTime, nearest);
            
        } else {
            //insert new date, with old score to increment off of
            let data = {date: mTime, globalscore: 0, points: 0, experiencepoints: 0, awaybonus: 0};
            if(nearest && !isNaN(nearest.points)) {
                data = nearest;
            }
            data.date = mTime;
            data.globalscore += gsco;
            data.points += (gsco + experiencepoints);
            data.experiencepoints += experiencepoints;
            
            await this.setNewProgressEntry(profileid, key, data)
        }
        await this.reduceProgressEntries(profileid, key, 35);
        resolve();
    }.bind(this));
}

PlayerProgressProcessor.prototype.ProcessTotalTimePlayed = function(server_data, player_snapshot_data) {
    return new Promise(async function(resolve, reject) {
        
        let profileid = parseInt(player_snapshot_data.pid);
        let mapTime = Math.floor(parseFloat(server_data.mapend));
        let mTime = moment.unix(mapTime).startOf('day').unix();

        let key = "ttp";
        await this.CreateProgressKey(profileid, key);

        let start_time = parseFloat(server_data["mapstart"]);
        let end_time = parseFloat(server_data["mapend"]);

        let ttp = Math.floor(end_time-start_time);

        if(isNaN(ttp)) return resolve();
        let nearest = await this.getLatestProgressBeforeDateRange(profileid, key, mTime);
        if(nearest && nearest.date == mTime) {
            //update date
            //profileid, key, date, set_data
            nearest.ttp += ttp;
            await this.updateProgressByDate(profileid, key, nearest.date, nearest);
            
        } else {
            //insert new date, with old score to increment off of
            let data = {date: mTime, ttp: 0};
            if(nearest && !isNaN(nearest.ttp)) {
                data = nearest;
            }
            data.date = mTime;
            data.ttp = ttp;
            
            await this.setNewProgressEntry(profileid, key, data)
        }
        await this.reduceProgressEntries(profileid, key, 35);
        resolve();
    }.bind(this));
}
PlayerProgressProcessor.prototype.ProcessKills = function(server_data, player_snapshot_data) {
    return new Promise(async function(resolve, reject) {
        
        let profileid = parseInt(player_snapshot_data.pid);
        let mapTime = Math.floor(parseFloat(server_data.mapend));
        let mTime = moment.unix(mapTime).startOf('day').unix();

        let key = "kills";
        await this.CreateProgressKey(profileid, key);

        let kills = parseInt(player_snapshot_data.klls);
        let deaths = parseInt(player_snapshot_data.dths);
        if(isNaN(kills) || isNaN(deaths)) return resolve();
        let nearest = await this.getLatestProgressBeforeDateRange(profileid, key, mTime);
        if(nearest && nearest.date == mTime) {
            //update date
            //profileid, key, date, set_data
            nearest.kpm += kills;
            nearest.dpm += deaths;
            await this.updateProgressByDate(profileid, key, nearest.date, nearest);
            
        } else {
            //insert new date, with old score to increment off of
            let data = {date: mTime, kpm: 0, dpm: 0};
            if(nearest && !isNaN(nearest.kpm)) {
                data = nearest;
            }
            data.date = mTime;
            data.kpm += kills;
            data.dpm += deaths;
            
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
        let array_key = "$data." + key;
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
        

        let element_key = "data." + key;
        let set_key = element_key + ".$";
        let raw_set_data = {};
        raw_set_data[set_key] = set_data;



        let search_key = element_key + ".date";
        let push_data = {};

        push_data[element_key] = set_data;
        let searchParams = {gameid: this.options.gameid, profileid: profileid, pageKey: this.pageKey};
        searchParams[search_key] = date;
        this.player_progress_collection.updateOne(searchParams,
        {$set: raw_set_data}, function(result, err) {
            resolve();
        });
    }.bind(this));

}
PlayerProgressProcessor.prototype.setNewProgressEntry = function(profileid, key, data) {
    
    return new Promise(function(resolve, reject) {
        let element_key = "data." + key;
        let push_data = {};
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
                let set_data = {};
                set_data[element_key] = minimized_data.items;
                this.player_progress_collection.updateOne({"gameid": this.options.gameid, "profileid": profileid, "pageKey": this.pageKey}, {$set: set_data}, function(err, results) {
                    resolve();
                });
            }.bind(this));
        }.bind(this));
    }.bind(this));
}
module.exports = PlayerProgressProcessor;