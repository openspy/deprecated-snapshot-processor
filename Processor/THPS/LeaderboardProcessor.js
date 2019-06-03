//aggregate([{$match: {gameid: 706}}, {$sort: {"data.gametype_scores.818085795.highscore": -1}}, {$project: {_id: 0,"profileid": "$profileid", "nick": "$last_name", "highscore": "$data.gametype_scores.818085795.highscore", "highcombo": "$data.gametype_scores.818085795.highcombo", "gametypecrc": "818085795", "rating": 3500}}])

//saddly this module uses mongo directly!!!
//THPS specific leaderboard processing
var LeaderboardModel = require('../../lib/LeaderboardModel');
function LeaderboardProcessor(DbCtx, database, options) {
    this.leaderboardModel = new LeaderboardModel(DbCtx, database);
    this.options = options;
    this.player_progress_collection = database.collection('player_progress');
}
LeaderboardProcessor.prototype.calculateAllTimeHighScoreForLevel = function(level_crc) {
    return new Promise(function(resolve, reject) {
        var dataset_name = "data.map_scores." + level_crc.toString();

        var dataset_accessor_name = "$" + dataset_name;

        var highscore_key = dataset_name + ".highscore";
        var highscore_accessor_key = dataset_accessor_name + ".highscore";

        this.player_progress_collection.aggregate([{"$match": {gameid: this.options.gameid}}, {$sort: {highscore_key: -1}}, {"$project": {_id: 0,"profileid": "$profileid", "nick": "$last_name", "score": highscore_accessor_key, "rating": "$data.rating", "type": "$highscore"}}], function(err, cursor) {
            
            let results = [];
 
            cursor.on('data', function(data) {
                if(data.score)
                    results.push(data);
            });

            cursor.on('end', function() {
                resolve({results, level_crc, type: "highscore", "alltime": true});
            })
            
            
        })
        
    }.bind(this));
};

LeaderboardProcessor.prototype.calculateAllTimeBestComboForLevel = function(level_crc) {
    return new Promise(function(resolve, reject) {
        var dataset_name = "data.map_scores." + level_crc.toString();

        var dataset_accessor_name = "$" + dataset_name;

        var highcombo_key = dataset_name + ".highcombo";
        var highcombo_accessor_key = dataset_accessor_name + ".highcombo";

        this.player_progress_collection.aggregate([{"$match": {gameid: this.options.gameid}}, {$sort: {highcombo_key: -1}}, {$limit: this.options.leaderboard_limit}, {"$project": {_id: 0,"profileid": "$profileid", "nick": "$last_name", "score": highcombo_accessor_key, "rating": "$data.rating", "type": "$bestcombo"}}], function(err, cursor) {
            let results = [];
 
            cursor.on('data', function(data) {
                if(data.score)
                    results.push(data);
            });

            cursor.on('end', function() {
                resolve({results, level_crc, type: "highcombo", "alltime": true});
            })
        })
        
    }.bind(this));
};

LeaderboardProcessor.prototype.calculateRecentHighScoreForLevel = function(level_crc) {
    return new Promise(function(resolve, reject) {
        var dataset_name = "data.map_scores." + level_crc.toString();

        var dataset_accessor_name = "$" + dataset_name;

        var highscore_key = dataset_name + ".recent_highscore";
        var highscore_accessor_key = dataset_accessor_name + ".recent_highscore";
        var highscore_time_accessor_key = dataset_accessor_name + ".recent_highscore_time";

        this.player_progress_collection.aggregate([{"$match": {gameid: this.options.gameid}}, {$sort: {highscore_key: -1}}, {"$project": {_id: 0,"profileid": "$profileid", "nick": "$last_name", "score": highscore_accessor_key, "time": highscore_time_accessor_key, "rating": "$data.rating", "type": "$highscore"}}], function(err, cursor) {
            
            let results = [];
 
            cursor.on('data', function(data) {
                if(data.score)
                    results.push(data);
            });

            cursor.on('end', function() {
                resolve({results, level_crc, type: "highscore", "alltime": false, "recent": true});
            })
            
            
        })
        
    }.bind(this));
};

LeaderboardProcessor.prototype.calculateRecentBestComboForLevel = function(level_crc) {
    return new Promise(function(resolve, reject) {
        var dataset_name = "data.map_scores." + level_crc.toString();

        var dataset_accessor_name = "$" + dataset_name;

        var highscore_key = dataset_name + ".recent_highcombo";
        var highscore_accessor_key = dataset_accessor_name + ".recent_highcombo";
        var highscore_time_accessor_key = dataset_accessor_name + ".recent_highcombo_time";

        this.player_progress_collection.aggregate([{"$match": {gameid: this.options.gameid}}, {$sort: {highscore_key: -1}}, {"$project": {_id: 0,"profileid": "$profileid", "nick": "$last_name", "score": highscore_accessor_key, "time": highscore_time_accessor_key, "rating": "$data.rating", "type": "$highcombo"}}], function(err, cursor) {
            
            let results = [];
 
            cursor.on('data', function(data) {
                if(data.score)
                    results.push(data);
            });

            cursor.on('end', function() {
                resolve({results, level_crc, type: "highcombo", "alltime": false, "recent": true});
            })
            
            
        })
        
    }.bind(this));
};

LeaderboardProcessor.prototype.setLeaderboard = function(results) {
    
    return new Promise(async function(resolve, reject) {
        
        let now = Date.now();

        let entry_data = await this.leaderboardModel.fetch({gameid: this.options.gameid});
        var leaderboard_data = entry_data.data || {};

        if(!leaderboard_data.high_scores_alltime) {
            leaderboard_data.high_scores_alltime = {};
        }
        if(!leaderboard_data.best_combos_alltime) {
            leaderboard_data.best_combos_alltime = {};
        }
        if(!leaderboard_data.high_scores_recent) {
            leaderboard_data.high_scores_recent = {};
        }
        if(!leaderboard_data.best_combos_recent) {
            leaderboard_data.best_combos_recent = {};
        }
        
        for(var i of results) {
            let score_entries = [];
            for(var x of i.results) {
                let entry = {};
                entry.profileid = x.profileid;
                entry.nick = x.nick;
                entry.score = x.score;
                entry.rating = x.rating;
                if(x.time) {
                    let diff = now - new Date(x.time).getTime();
                    if(diff > this.options.recent_timerange) {
                        continue;
                    }
                }
                score_entries.push(entry);
            }
            score_entries.sort(function(a, b) {
                return a.score < b.score;
            });
            
            if(i.alltime) {
                if(i.type == 'highscore') {
                    leaderboard_data.high_scores_alltime[i.level_crc] = score_entries;
                } else if(i.type == 'highcombo') {
                    leaderboard_data.best_combos_alltime[i.level_crc] = score_entries;
                }
            } else {
                if(i.type == 'highscore') {
                    leaderboard_data.high_scores_recent[i.level_crc] = score_entries;
                } else if(i.type == 'highcombo') {
                    leaderboard_data.best_combos_recent[i.level_crc] = score_entries;
                }
                
            }
        }
        var _id = entry_data._id;
        entry_data = {data: leaderboard_data, modified: now, gameid: this.options.gameid};
        if(_id !== undefined)
            entry_data._id = _id;
        await this.leaderboardModel.insertOrUpdate(entry_data);
        resolve();
    }.bind(this));
}
module.exports = LeaderboardProcessor