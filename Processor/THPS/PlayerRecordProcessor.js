var PlayerRecordModel = require('../../lib/PlayerRecordModel');
var PersistantStorage = require('../../lib/PersistentStorage');
function PlayerRecordProcessor(DbCtx, database, options) {
    this.options = options;
    this.DbCtx = DbCtx;
    this.database = database;    
    this.playerRecordModel = new PlayerRecordModel(DbCtx, database, options);
    this.persistentStorage = new PersistantStorage();
}

PlayerRecordProcessor.prototype.processRecord = function(game_data, player_record) {
    return new Promise(function(resolve, reject) {
        this.playerRecordModel.fetch({gameid: this.options.gameid, profileid: player_record.pid}).then(function(progress) {
            var record = {profileid: player_record.pid, highscore: parseInt(player_record.score), highcombo: parseInt(player_record.combo)};
            if(!progress.data) {
                progress.data = {gametype_scores: {}, map_scores: {}, highscore: 0, highcombo: 0, num_games: 0, rating: 0};
            }
    
            var now = Date.now();
            var map_key = game_data.mapcrc;
            var game_key = game_data.gametypecrc;
            if(!progress.data.gametype_scores[game_key]) {
                progress.data.gametype_scores[game_key] = {highcombo: 0, highscore: 0, recent_highscore: 0, recent_highscore_time: now, recent_highcombo: 0, recent_highcombo_time: now};
            }
            if(!progress.data.map_scores[map_key]) {
                progress.data.map_scores[map_key] = {highcombo: 0, highscore: 0, recent_highscore: 0, recent_highscore_time: now, recent_highcombo: 0, recent_highcombo_time: now};
            }
    
            //all time scores
            if(record.highscore > progress.data.highscore) {
                progress.data.highscore = record.highscore;
            }
            if(record.highcombo > progress.data.highcombo) {
                progress.data.highcombo = record.highcombo;
            }
    
            if(record.highscore > progress.data.map_scores[map_key].highscore) {
                progress.data.map_scores[map_key].highscore = record.highscore;
            }
            if(record.highcombo > progress.data.map_scores[map_key].highcombo) {
                progress.data.map_scores[map_key].highcombo = record.highcombo;
            }
            
            if(record.highscore > progress.data.gametype_scores[game_key].highscore) {
                progress.data.gametype_scores[game_key].highscore = record.highscore;
            }
            if(record.highcombo > progress.data.gametype_scores[game_key].highcombo) {
                progress.data.gametype_scores[game_key].highcombo = record.highcombo;
            }
    
            //best timescores
            var recent_diff = this.options.recent_timerange;
            var min_time = now - recent_diff;
            if(record.highscore > progress.data.recent_highscore || (!progress.data.recent_highscore_time || progress.data.recent_highscore_time < min_time)) {
                progress.data.recent_highscore_time = now;
                progress.data.recent_highscore = record.highscore;
            }
            if(record.highcombo > progress.data.recent_highcombo || (!progress.data.recent_highcombo_time || progress.data.recent_highcombo_time < min_time)) {
                progress.data.recent_highcombo_time = now;
                progress.data.recent_highcombo = record.highcombo;
            }
    
    
            if(record.highscore > progress.data.gametype_scores[game_key].recent_highscore || (!progress.data.gametype_scores[game_key].recent_highscore_time || now - progress.data.gametype_scores[game_key].recent_highscore_time < min_time)) {
                progress.data.gametype_scores[game_key].recent_highscore_time = now;
                progress.data.gametype_scores[game_key].recent_highscore = record.highscore;
            }
            if(record.highcombo > progress.data.gametype_scores[game_key].recent_highcombo || (!progress.data.gametype_scores[game_key].recent_highcombo_time || now - progress.data.gametype_scores[game_key].recent_highcombo_time < min_time)) {
                progress.data.gametype_scores[game_key].recent_highcombo_time = now;
                progress.data.gametype_scores[game_key].recent_highcombo = record.highcombo;
            }
    
            if(record.highscore > progress.data.map_scores[map_key].recent_highscore || (!progress.data.map_scores[map_key].recent_highscore_time || now - progress.data.map_scores[map_key].recent_highscore_time < min_time)) {
                progress.data.map_scores[map_key].recent_highscore_time = now;
                progress.data.map_scores[map_key].recent_highscore = record.highscore;
            }
            if(record.highcombo > progress.data.map_scores[map_key].recent_highcombo || (!progress.data.map_scores[map_key].recent_highcombo_time || now - progress.data.map_scores[map_key].recent_highcombo_time < min_time)) {
                progress.data.map_scores[map_key].recent_highcombo_time = now;
                progress.data.map_scores[map_key].recent_highcombo = record.highcombo;
            }
    
            progress.data.num_games++;
    
    
            progress.last_name = player_record.name.replace(/\//g, "\\")
            progress.profileid = player_record.pid;
            progress.gameid = this.options.gameid;
            progress.modified = Date.now();
    
            this.playerRecordModel.insertOrUpdate(progress).then(resolve, reject);
        }.bind(this));
    }.bind(this));
}


PlayerRecordProcessor.prototype.calculatePlayerRanking = function(profileid) {
    return new Promise(async function(resolve, reject) {
        var player_progress = await this.playerRecordModel.fetch({gameid: this.options.gameid, profileid});
        var higher, lower;

        var doCalculations = function() {
            var total = higher + lower + 1;
            var index = total - higher;
            var pct = (index-0.5)/total;
            if(lower && !higher) pct = 1;
            else if(!lower && higher) pct = 0;
            resolve(pct);
        };

        var num_waiting = 2;
        this.playerRecordModel.collection.aggregate([{"$match": {gameid: this.options.gameid, "data.highscore": {$lte: player_progress.data.highscore}}}, {$group: {_id: null, count: {$sum: 1}}}], function(err, cursor) {
            var results = []; 
            cursor.on('data', function(data) {
                lower = data.count;
            });
            cursor.on('end', function() {
                num_waiting--;
                if(num_waiting == 0) doCalculations();
            })
        });

        this.playerRecordModel.collection.aggregate([{"$match": {gameid: this.options.gameid, "data.highscore": {$gt: player_progress.data.highscore}}}, {$group: {_id: null, count: {$sum: 1}}}], function(err, cursor) {
            var results = []; 
            cursor.on('data', function(data) {
                higher = data.count;
            });
            cursor.on('end', function() {
                num_waiting--;
                if(num_waiting == 0) doCalculations();
            })
        });
    }.bind(this));
};

PlayerRecordProcessor.prototype.getPlayerScores = function(profileid) {
    return new Promise(async function(resolve, reject) {
        var map_crcs = this.options.map_crcs;
        var player_progress = await this.playerRecordModel.fetch({gameid: this.options.gameid, profileid});
        var map_scores = player_progress.data.map_scores;
        var keys = Object.keys(map_scores);
        var scores = {highcombos: [], highscores: []};
        for(var x of map_crcs) {
            if(map_scores[x.toString()]) {
                scores.highscores.push(map_scores[x.toString()].highscore || 0);
                scores.highcombos.push(map_scores[x.toString()].highcombo || 0);
            } else {
                scores.highscores.push(0);
                scores.highcombos.push(0);
            }
        }        
        resolve(scores);
    }.bind(this));
}
PlayerRecordProcessor.prototype.updatePlayerRanking = function(profileid) {
    return new Promise(async function(resolve, reject) {
        var player_progress = await this.playerRecordModel.fetch({gameid: this.options.gameid, profileid});
        var percent = await this.calculatePlayerRanking(profileid);
        var ranking = percent * this.options.rating_bounds.max;
        var update_data = {};

        if(!ranking) ranking = 0;
        else ranking = Math.trunc(ranking);

        player_progress.data.rating = ranking;

        await this.playerRecordModel.insertOrUpdate(player_progress);

        update_data[this.options.persistStorageRatingKey] = ranking.toString();
        return this.persistentStorage.UpdatePlayerKVStorage(profileid, this.options.gameid, 2, 0, update_data).then(resolve, reject);
    }.bind(this));

};

PlayerRecordProcessor.prototype.updatePlayerPersistScore = async function(profileid) {
    var score_data = await this.getPlayerScores(profileid);
    var promises = [];
    for(var x=0;x<score_data.highscores.length;x++) {
        var update_data = {};
        update_data[this.options.persistStorageHighScoreKey] = score_data.highscores[x];
        update_data[this.options.persistStorageHighComboKey] = score_data.highcombos[x];
        this.persistentStorage.UpdatePlayerKVStorage(profileid, this.options.gameid, 2, x, update_data)
    }
    return Promise.all(promises);
}
/*
    Update all persistent storage stuff, rankings, high combo/scores, etc
*/
PlayerRecordProcessor.prototype.updatePlayerRankings = function() {
    return new Promise(async function(resolve, reject) {
        this.playerRecordModel.collection.aggregate([{$match: {gameid: this.options.gameid}}, {$group: {_id: null, profileids: {$addToSet: "$profileid"}}}], function(err, cursor) {
            var profileids = [];
            var doCalculations = function() {
                var promises = [];
                for(var i of profileids) {
                    promises.push(this.updatePlayerRanking(i));
                    promises.push(this.updatePlayerPersistScore(i));
                }
                Promise.all(promises).then(resolve);
            }.bind(this)
            cursor.on('data', function(data) {
                profileids = data.profileids;
            });
            cursor.on('end', function() {
                doCalculations();
            })
        }.bind(this));
    }.bind(this));
}

module.exports = PlayerRecordProcessor;