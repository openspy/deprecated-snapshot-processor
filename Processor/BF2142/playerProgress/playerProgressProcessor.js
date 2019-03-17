/*
- capture stats
- accuracy
- wins and losses
- teamwork
- support actions
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
        await this.ProcessScoresPerMin(server_data, player_snapshot_data);
        await this.ProcessRoles(server_data, player_snapshot_data);
        await this.ProcessFlags(server_data, player_snapshot_data);
        await this.ProcessAccuracy(server_data, player_snapshot_data); //waccu
        await this.ProcessWinLosses(server_data, player_snapshot_data); //wl
        await this.ProcessTeamworkScore(server_data, player_snapshot_data); //twsc teamwork
        await this.ProcessSupport(server_data, player_snapshot_data); //sup support
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

        let ttp = parseFloat(player_snapshot_data.tt);

        if(isNaN(ttp)) return resolve();
        let nearest = await this.getLatestProgressBeforeDateRange(profileid, key, mTime);
        if(nearest && nearest.date == mTime) {
            //update date
            //profileid, key, date, set_data
            var reduce = false;
            if(nearest.ttp != 0)
                reduce = true;
            nearest.ttp += ttp;

            if(reduce)
                nearest.ttp /= 2;
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

        let kills = parseFloat(player_snapshot_data.klls);
        let deaths = parseFloat(player_snapshot_data.dths);

        var diff_mins = (mapTime - Math.floor(parseInt(server_data.mapstart))) / 60;
        if(isNaN(kills) || isNaN(deaths)) return resolve();

        kills /= diff_mins;
        deaths /= diff_mins;
        let nearest = await this.getLatestProgressBeforeDateRange(profileid, key, mTime);
        var reduce_value_kpm = false, reduce_value_dpm = false;
        if(nearest && nearest.date == mTime) {
            //update date
            //profileid, key, date, set_data
            if(nearest.kpm != 0)
            reduce_value_kpm = true;
            if(nearest.dpm != 0)
            reduce_value_dpm = true;
            nearest.kpm += kills;
            nearest.dpm += deaths;
            if(reduce_value_kpm)
                nearest.kpm /= 2;
            if(reduce_value_dpm)
                nearest.dpm /= 2;
            await this.updateProgressByDate(profileid, key, nearest.date, nearest);
            
        } else {
            //insert new date, with old score to increment off of
            let data = {date: mTime, kpm: 0, dpm: 0};
            if(nearest && !isNaN(nearest.kpm)) {
                data = nearest;
            }
            data.date = mTime;
            data.kpm = kills;
            data.dpm = deaths;
            
            await this.setNewProgressEntry(profileid, key, data)
        }
        await this.reduceProgressEntries(profileid, key, 35);
        resolve();
    }.bind(this));
}
PlayerProgressProcessor.prototype.ProcessScoresPerMin = function(server_data, player_snapshot_data) {
    return new Promise(async function(resolve, reject) {
        
        let profileid = parseInt(player_snapshot_data.pid);
        let mapTime = Math.floor(parseFloat(server_data.mapend));
        let mTime = moment.unix(mapTime).startOf('day').unix();

        let key = "spm";
        await this.CreateProgressKey(profileid, key);

        let gsco = parseInt(player_snapshot_data.gsco);
        let ttp = parseFloat(player_snapshot_data.tt);
        let spm = (gsco / (ttp / 60));

        var reduce_value = false;

        if(isNaN(spm)) return resolve();

        let nearest = await this.getLatestProgressBeforeDateRange(profileid, key, mTime);
        if(nearest && nearest.date == mTime) {
            //update date
            //profileid, key, date, set_data
            if(nearest.spm != 0)
                reduce_value = true;
            nearest.spm += spm;
            if(reduce_value)
                nearest.spm /= 2;
            await this.updateProgressByDate(profileid, key, nearest.date, nearest);
            
        } else {
            //insert new date, with old score to increment off of
            let data = {date: mTime, spm: 0};
            if(nearest && !isNaN(nearest.spm)) {
                data = nearest;
            }
            data.date = mTime;
            data.spm = spm;
            
            await this.setNewProgressEntry(profileid, key, data)
        }
        await this.reduceProgressEntries(profileid, key, 35);
        resolve();
    }.bind(this));
}
PlayerProgressProcessor.prototype.ProcessRoles = function(server_data, player_snapshot_data) {
    return new Promise(async function(resolve, reject) {
        
        let profileid = parseInt(player_snapshot_data.pid);
        let mapTime = Math.floor(parseFloat(server_data.mapend));
        let mTime = moment.unix(mapTime).startOf('day').unix();

        let key = "role";
        await this.CreateProgressKey(profileid, key);

        let cotime = parseFloat(player_snapshot_data.tac);
        let sltime = parseFloat(player_snapshot_data.tasl);
        let lwtime = parseFloat(player_snapshot_data.talw);
        let smtime = parseFloat(player_snapshot_data.tasm);
        let ttp = parseFloat(player_snapshot_data.tt);

        var reduce = {cotime: false, sltime: false, lwtime: false};
        let nearest = await this.getLatestProgressBeforeDateRange(profileid, key, mTime);
        if(nearest && nearest.date == mTime) {
            if(nearest.cotime != 0)
                reduce.cotime = true;
            if(nearest.sltime != 0)
                reduce.sltime = true;
            if(nearest.lwtime != 0)
                reduce.lwtime = true;
            if(nearest.smtime != 0)
                reduce.smtime = true;

            nearest.cotime += cotime;
            nearest.sltime += sltime;
            nearest.lwtime += lwtime;
            nearest.smtime += smtime;
            nearest.ttp += ttp;

            if(reduce.cotime)
                nearest.cotime /= 2;
            if(reduce.sltime)
                nearest.sltime /= 2;
            if(reduce.lwtime)
                nearest.lwtime /= 2;
            if(reduce.smtime)
                nearest.smtime /= 2;
                
            await this.updateProgressByDate(profileid, key, nearest.date, nearest);
            
        } else {
            //insert new date, with old score to increment off of
            let data = {date: mTime, cotime: 0, smtime: 0, sltime: 0, lwtime: 0, ttp: 0};
            if(nearest && !isNaN(nearest.spm)) {
                data = nearest;
            }
            data.date = mTime;
            if(nearest.cotime != 0)
                reduce.cotime = true;
            if(nearest.sltime != 0)
                reduce.sltime = true;
            if(nearest.lwtime != 0)
                reduce.lwtime = true;

            data.cotime = cotime;
            data.sltime = sltime;
            data.lwtime = lwtime;
            data.smtime = smtime;
            data.ttp = ttp;

            
            if(reduce.cotime)
                data.cotime /= 2;
            if(reduce.sltime)
                data.sltime /= 2;
            if(reduce.smtime)
                data.smtime /= 2;
            if(reduce.lwtime)
                data.lwtime /= 2;
            
            await this.setNewProgressEntry(profileid, key, data)
        }
        await this.reduceProgressEntries(profileid, key, 35);
        resolve();
    }.bind(this));
}
PlayerProgressProcessor.prototype.ProcessFlags = function(server_data, player_snapshot_data) {
    return new Promise(async function(resolve, reject) {
        
        let profileid = parseInt(player_snapshot_data.pid);
        let mapTime = Math.floor(parseFloat(server_data.mapend));
        let mTime = moment.unix(mapTime).startOf('day').unix();

        let key = "flag";
        await this.CreateProgressKey(profileid, key);

        let captures = parseFloat(player_snapshot_data.cpt);
        let assist = parseFloat(player_snapshot_data.capa);
        let defend = parseFloat(player_snapshot_data.dcpt);

        var reduce = {captures: false, assist: false, defend: false};
        let nearest = await this.getLatestProgressBeforeDateRange(profileid, key, mTime);
        if(nearest && nearest.date == mTime) {
            //update date
            //profileid, key, date, set_data
            //if(nearest.cotime != 0 || nearest.sltime != 0 || nearest.lwtime != 0 || nearest.tpp != 0)
            if(nearest.captures != 0)
                reduce.captures = true;
            if(nearest.assist != 0)
                reduce.assist = true;
            if(nearest.defend != 0)
                reduce.defend = true;

            nearest.captures += captures;
            nearest.assist += assist;
            nearest.defend += defend;

            if(reduce.captures)
                nearest.captures /= 2;
            if(reduce.assist)
                nearest.assist /= 2;
            if(reduce.defend)
                nearest.defend /= 2;
                
            await this.updateProgressByDate(profileid, key, nearest.date, nearest);
            
        } else {
            //insert new date, with old score to increment off of
            let data = {date: mTime, captures: 0, assist: 0, defend: 0};
            if(nearest && !isNaN(nearest.spm)) {
                data = nearest;
            }
            data.date = mTime;
            if(nearest.captures != 0)
                reduce.captures = true;
            if(nearest.assist != 0)
                reduce.assist = true;
            if(nearest.defend != 0)
                reduce.defend = true;
            data.captures = captures;
            data.assist = assist;
            data.defend = defend;
            
            if(reduce.captures)
                data.captures /= 2;
            if(reduce.assist)
                data.assist /= 2;
            if(reduce.defend)
                data.defend /= 2;
            
            await this.setNewProgressEntry(profileid, key, data)
        }
        await this.reduceProgressEntries(profileid, key, 35);
        resolve();
    }.bind(this));
}
PlayerProgressProcessor.prototype.ProcessAccuracy = function(server_data, player_snapshot_data) {
    return new Promise(async function(resolve, reject) {
        
        let profileid = parseInt(player_snapshot_data.pid);
        let mapTime = Math.floor(parseFloat(server_data.mapend));
        let mTime = moment.unix(mapTime).startOf('day').unix();

        let key = "waccu";
        await this.CreateProgressKey(profileid, key);

        var toth = parseInt(player_snapshot_data.toth);
        var tots = parseInt(player_snapshot_data.tots);
        
        let nearest = await this.getLatestProgressBeforeDateRange(profileid, key, mTime);
        if(nearest && nearest.date == mTime) {
            
            nearest.toth += toth;
            nearest.tots += tots;
            if(toth > 0 && tots > 0)
                nearest.ovaccu = toth / tots;

            await this.updateProgressByDate(profileid, key, nearest.date, nearest);
            
        } else {
            //insert new date, with old score to increment off of
            let data = {date: mTime, toth: 0, tots: 0, ovaccu: 0};
            if(nearest && !isNaN(nearest.toth) && !isNaN(nearest.tots) && ! isNaN(nearest.ovaccu)) {
                data = nearest;
            }
            data.toth = toth;
            data.tots = tots;
            if(toth > 0 && tots > 0)
                data.ovaccu = toth / tots;
            data.date = mTime;

            await this.setNewProgressEntry(profileid, key, data)
        }
        await this.reduceProgressEntries(profileid, key, 35);
        resolve();
    }.bind(this));
}
PlayerProgressProcessor.prototype.ProcessWinLosses = function(server_data, player_snapshot_data) {
    return new Promise(async function(resolve, reject) {
        
        let profileid = parseInt(player_snapshot_data.pid);
        let mapTime = Math.floor(parseFloat(server_data.mapend));
        let mTime = moment.unix(mapTime).startOf('day').unix();

        let key = "wl";
        await this.CreateProgressKey(profileid, key);

        
        var win_team = parseInt(server_data.win);
        var player_team = parseInt(player_snapshot_data.t);
        var is_win = win_team == player_team;
        let nearest = await this.getLatestProgressBeforeDateRange(profileid, key, mTime);
        if(nearest && nearest.date == mTime) {
            
            if(is_win) {
                nearest.wins++
            } else {
                nearest.losses++
            }

            await this.updateProgressByDate(profileid, key, nearest.date, nearest);
            
        } else {
            //insert new date, with old score to increment off of
            let data = {date: mTime, wins: 0, losses: 0};
            if(nearest && !isNaN(nearest.wins) && !isNaN(nearest.losses)) {
                data = nearest;
            }
            if(is_win) {
                data.wins++;
            } else {
                data.losses++;
            }
            data.date = mTime;

            await this.setNewProgressEntry(profileid, key, data)
        }
        await this.reduceProgressEntries(profileid, key, 35);
        resolve();
    }.bind(this));
}

PlayerProgressProcessor.prototype.ProcessTeamworkScore = function(server_data, player_snapshot_data) {
    return new Promise(async function(resolve, reject) {
        
        let profileid = parseInt(player_snapshot_data.pid);
        let mapTime = Math.floor(parseFloat(server_data.mapend));
        let mTime = moment.unix(mapTime).startOf('day').unix();

        let key = "twsc";
        await this.CreateProgressKey(profileid, key);

        let twsc = parseInt(player_snapshot_data.twsc);
        var reduce_value = false;

        let nearest = await this.getLatestProgressBeforeDateRange(profileid, key, mTime);
        if(nearest && nearest.date == mTime) {
            //update date
            //profileid, key, date, set_data
            if(nearest.twsc != 0)
                reduce_value = true;
            nearest.twsc += twsc;
            if(reduce_value)
                nearest.twsc /= 2;
            await this.updateProgressByDate(profileid, key, nearest.date, nearest);
            
        } else {
            //insert new date, with old score to increment off of
            let data = {date: mTime, twsc: 0};
            if(nearest && !isNaN(nearest.twsc)) {
                data = nearest;
            }
            data.date = mTime;
            data.twsc = twsc;
            
            await this.setNewProgressEntry(profileid, key, data)
        }
        await this.reduceProgressEntries(profileid, key, 35);
        resolve();
    }.bind(this));
}

PlayerProgressProcessor.prototype.ProcessSupport = function(server_data, player_snapshot_data) {
    return new Promise(async function(resolve, reject) {
        
        let profileid = parseInt(player_snapshot_data.pid);
        let mapTime = Math.floor(parseFloat(server_data.mapend));
        let mTime = moment.unix(mapTime).startOf('day').unix();

        let key = "sup";
        await this.CreateProgressKey(profileid, key);
        var hls = parseInt(player_snapshot_data.hls);
        var rps = parseInt(player_snapshot_data.rps);
        var rvs = parseInt(player_snapshot_data.rvs);
        var resp = parseInt(player_snapshot_data.resp);

        var reduce = {hls: false, rps: false, rvs: false, resp: false};
        let nearest = await this.getLatestProgressBeforeDateRange(profileid, key, mTime);
        if(nearest && nearest.date == mTime) {
            if(nearest.hls != 0)
                reduce.hls = true;
            if(nearest.rps != 0)
                reduce.rps = true;
            if(nearest.rvs != 0)
                reduce.rvs = true;
            if(nearest.resp != 0)
                reduce.resp = true;
            nearest.hls += hls;
            nearest.rps += rps;
            nearest.rvs += rvs;
            nearest.resp += resp;
            if(reduce.hls)
                nearest.hls /= 2;
            if(reduce.rps)
                nearest.rps /= 2;
             if(reduce.rvs)
                nearest.rvs /= 2;
            if(reduce.resp)
                nearest.resp /= 2;
            await this.updateProgressByDate(profileid, key, nearest.date, nearest);
            
        } else {
            //insert new date, with old score to increment off of
            let data = {date: mTime, hls: 0, rps: 0, rvs: 0, resp: 0};
            if(nearest && !isNaN(nearest.hls) && !isNaN(nearest.rps) && !isNaN(nearest.rvs) && !isNaN(nearest.resp)) {
                data = nearest;
            }
            data.date = mTime;
            data.hls = hls;
            data.rps = rps;
            data.rvs = rvs;
            data.resp = resp;
            
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