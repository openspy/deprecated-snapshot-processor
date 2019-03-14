var dbg_snapshot = require('./dbg_snapshot.json');
var SnapshotProcessor = require('./SnapshotProcessor');
var LeaderboardProcessor = require('./leaderboard');
var SnapshotModel = require('../../lib/SnapshotModel');
function BF2142Processor(DbCtx, database, options) {
    this.options = options;
    this.DbCtx = DbCtx;
    this.database = database;
    this.snapshotModel = new (SnapshotModel)(DbCtx, database);
    this.snapshotProcessor = new SnapshotProcessor(DbCtx, database, options);
    this.leaderboardProcessor = new LeaderboardProcessor(DbCtx, database, options);
}

BF2142Processor.prototype.calculateLeaderboard = function() {
    return this.leaderboardProcessor.calculateLeaderboard();    
}


BF2142Processor.prototype.performAllCalculations = function() {
    return new Promise(async function(resolve, reject) {
        let snapshots = await this.snapshotModel.getUnprocessedSnapshots({gameid: this.options.gameid})
        //let snapshots = [dbg_snapshot];
        await this.snapshotProcessor.processSnapshots(snapshots);
        await this.calculateLeaderboard();
        resolve();
    }.bind(this));
}

module.exports = BF2142Processor