var PlayerRecordProcessor = require('./PlayerRecordProcessor');
var LeaderboardProcessor = require('./LeaderboardProcessor');
var SnapshotModel = require('../lib/SnapshotModel');
function THPSProcessor(DbCtx, database, options) {
    //console.log("THPSProcessor options", options);
    this.options = options;
    this.DbCtx = DbCtx;
    this.database = database;
    this.snapshotModel = new (SnapshotModel)(ctx, database);
    this.playerRecordProcessor = new PlayerRecordProcessor(DbCtx, database,options);
    this.leaderBoardProcessor = new LeaderboardProcessor(DbCtx, database, options);
}

THPSProcessor.prototype.calculateLeaderboard = function() {
    var promises = [];
    for(var i of this.options.map_crcs) {
        promises.push(this.leaderBoardProcessor.calculateAllTimeHighScoreForLevel(i));
        promises.push(this.leaderBoardProcessor.calculateAllTimeBestComboForLevel(i));
    }
    return Promise.all(promises).then(function(res) { this.leaderBoardProcessor.setLeaderboard(res); }.bind(this));
    
}
THPSProcessor.prototype.processSnapshots = function(snapshots) {
    var promises = [];
    for(var i of snapshots) {
        promises.push(this.processSnapshot(i));
    }

    return Promise.all(promises);
};

THPSProcessor.prototype.processSnapshot = function(snapshot) {
    return new Promise(async function(resolve, reject) {
        if(!snapshot || !snapshot.updates || snapshot.updates.length != 1) {
            return reject({message: "invalid snapshot data"});
        }
        var game_data = snapshot.updates[0].data;

        var game_length = parseInt(game_data.timelimit);

        if(game_length > 120) { //skip matches > 2 mins
            return resolve();
        }

        var max_players = parseInt(game_data.maxplayers);
        for(var i=0;i<max_players;i++) {
            var player_record = {};
            if(game_data["pid_"+i] === undefined) continue;
            player_record.name = game_data["player_"+i];
            player_record.pid = parseInt(game_data["pid_"+i]);            
            player_record.combo = parseInt(game_data["combo_"+i]);
            player_record.score = parseInt(game_data["score_"+i]);
            await this.playerRecordProcessor.processRecord(game_data, player_record);
        }
        resolve();
    }.bind(this));
};

THPSProcessor.prototype.calculatePlayerRankings = function() {
    return new Promise(function(resolve, reject) {
        resolve();
    });
}

THPSProcessor.prototype.performAllCalculations = function() {
    return new Promise(async function(resolve, reject) {
        var snapshots = await this.snapshotModel.getUnprocessedSnapshots({gameid: this.options.gameid})
        await this.processSnapshots(snapshots);
        await this.snapshotModel.markSnapshotsProcessed(snapshots);
        await this.calculatePlayerRankings();
        await this.calculateLeaderboard();
    }.bind(this));
}

module.exports = THPSProcessor