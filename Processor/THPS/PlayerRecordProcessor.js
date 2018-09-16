var PlayerRecordModel = require('../../lib/PlayerRecordModel');
function PlayerRecordProcessor(DbCtx, database, options) {
    this.options = options;
    this.DbCtx = DbCtx;
    this.database = database;    
    this.playerRecordModel = new PlayerRecordModel(DbCtx, database, options);
}

PlayerRecordProcessor.prototype.processRecord = function(game_data, player_record) {
    this.playerRecordModel.fetch({gameid: this.options.gameid, profileid: player_record.profileid}).then(function(progress) {
        var record = {profileid: player_record.profileid, highscore: parseInt(player_record.score), highcombo: parseInt(player_record.combo)};
        if(!progress.data) {
            progress.data = {gametype_scores: {}, map_scores: {}, highscore: 0, highcombo: 0, num_games: 0};
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

        if(progress.data.highscore > progress.data.map_scores[map_key].highscore) {
            progress.data.map_scores[map_key].highscore = progress.data.highscore;
        }
        if(progress.data.highcombo > progress.data.map_scores[map_key].highcombo) {
            progress.data.map_scores[map_key].highcombo = progress.data.highcombo;
        }
        
        if(progress.data.highscore > progress.data.gametype_scores[game_key].highscore) {
            progress.data.gametype_scores[game_key].highscore = progress.data.highscore;
        }
        if(progress.data.highcombo > progress.data.gametype_scores[game_key].highcombo) {
            progress.data.gametype_scores[game_key].highcombo = progress.data.highcombo;
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


        progress.last_name = player_record.name;
        progress.profileid = player_record.pid;
        progress.gameid = this.options.gameid;
        progress.modified = Date.now();

        console.log("progress now", progress);

        return this.playerRecordModel.insertOrUpdate(progress);
    }.bind(this));
    return Promise.resolve();
}

module.exports = PlayerRecordProcessor;