var dbg_snapshot = require('./dbg_snapshot.json');
var SnapshotProcessor = require('./SnapshotProcessor');
var LeaderboardProcessor = require('./leaderboard');
var SnapshotModel = require('../../lib/SnapshotModel');
var PlayerRecordModel = require('../../lib/PlayerRecordModel');
var AwardProcessor = require('./awards');

function BF2142Processor(DbCtx, database, options) {
    options.handleCalculatedVariables = handleCalculatedVariables.bind(this);
    this.options = options;
    this.DbCtx = DbCtx;
    this.database = database;
    this.snapshotModel = new (SnapshotModel)(DbCtx, database);
    this.snapshotProcessor = new SnapshotProcessor(DbCtx, database, options);
    this.leaderboardProcessor = new LeaderboardProcessor(DbCtx, database, options);
    this.playerRecordModel = new PlayerRecordModel(DbCtx, database, options);
    this.awardProcessor = new AwardProcessor(DbCtx, database, options);
}
BF2142Processor.prototype.getRankFromScore = function(score) {
    score = parseInt(score);
    var highest_score = 0;
    for(var i = 0;i < this.options.scoreSettings.length;i++) {
        var setting = this.options.scoreSettings[i];
        if(setting != null && setting.minScore > 0) {
            if(score >= setting.minScore) {
                highest_score = setting.rank;
            }
        }
    }
    return highest_score;
}
var handleCalculatedVariables = function(server_data, player_snapshot_data, current_progress) {
    //kill death ratio, time as titan, etc

    var rank = parseInt(current_progress.rnk || "0");
    current_progress.rnk = this.getRankFromScore(current_progress.crpt);
    if(current_progress.rnk != rank) {
        console.log(current_progress.pid, "rank was", rank, "now", current_progress.rnk);
        current_progress.rnkcg = "1";
    }

    var kills_diff = current_progress.klls - current_progress.dths;
    if(current_progress.dths > 0) {
        if(kills_diff > 0) {
            current_progress.kdr = current_progress.klls / current_progress.dths;
        } else {
            current_progress.kdr = -(current_progress.dths / current_progress.klls);
        }
    }

    var start_time = parseFloat(server_data["mapstart"]);
    var end_time = parseFloat(server_data["mapend"]);

    current_progress.lgdt = Math.floor(end_time);
    current_progress.ttp = Math.floor(end_time-start_time);

    var gamemode = parseInt(server_data["gm"]);
    var cs = parseInt(player_snapshot_data["cs"]);
    var tac = parseInt(player_snapshot_data["tac"]);

    if(current_progress["trp"] == null) {
        current_progress["trp"] = 0;
    }

    //command score (per gamemode), time as commander
    switch(gamemode) {
        case 0: //conquest
        if(current_progress["csgpm-0"] == null)
            current_progress["ctgpm-0"] = 0;
            if(current_progress["ctgpm-0"] == null)
            current_progress["csgpm-0"] = 0;
        current_progress["csgpm-0"] += cs;
        current_progress["ctgpm-0"] += tac;
        break;
        case 1: //titan
        if(current_progress["csgpm-1"] == null)
            current_progress["csgpm-1"] = 0;
            if(current_progress["ctgpm-1"] == null)
            current_progress["ctgpm-1"] = 0;
        current_progress["csgpm-1"] += cs;
        current_progress["ctgpm-1"] += tac;
        current_progress["trp"]++;
        break;
    }

    var gsco = parseInt(current_progress.gsco);

    //score per min
    current_progress.spm = (gsco / current_progress.ttp) / 60;

    var toth = parseInt(current_progress["toth"]);
    var tots = parseInt(current_progress["tots"]);
    current_progress.ovaccu = toth / tots;

    var winning_team = parseInt(server_data["win"]);
    var team = parseInt(player_snapshot_data["t"]);

    if(current_progress.win == null) {
        current_progress.win = 0;
    }
    if(current_progress.los == null) {
        current_progress.los = 0;
    }
    if(current_progress["attp-0"] == null) {
        current_progress["attp-0"] = 0;
    }
    if(current_progress["attp-1"] == null) {
        current_progress["attp-1"] = 0;
    }

    var player_won = winning_team == team;

    switch(team) {
        case 1: //PAC
           current_progress["attp-1"] = player_won ? current_progress["attp-1"]+1 : current_progress["attp-1"]-1;
           break;
        case 2: //EU
            current_progress["attp-0"] = player_won ? current_progress["attp-0"]+1 : current_progress["attp-0"]-1;
           break;   
    }

    if(player_won) {
        current_progress.win++;
    } else {
        current_progress.los++;
    }

    if(current_progress.win > 0 && current_progress.los > 0)
        current_progress.wlr = current_progress.win / current_progress.los;
    
    //best round score
    var brs = current_progress.brs || 0;
    if(gsco > brs) {
        brs = gsco;
    }

    if(current_progress["acdt"] == undefined) {
        current_progress.acdt = Math.floor(start_time); ///XXX: pull create time from db
    }

    
    //fgm - fav gamemode
    ///fm - fav map
    //fv - fav vehicle
    //fw - fav weapon
    //fe - fav equipment
    //fk - fav kit
    //etp-3 time cloaked

    return current_progress;
}

BF2142Processor.prototype.calculateLeaderboard = function() {
    return this.leaderboardProcessor.calculateLeaderboard();    
}


BF2142Processor.prototype.performAllCalculations = function() {
    return new Promise(async function(resolve, reject) {
        while(true) {
            let snapshots = await this.snapshotModel.getUnprocessedSnapshots({gameid: this.options.gameid}, 50);
            if(snapshots == null || snapshots.length == 0) break;
            await this.snapshotProcessor.processSnapshots(snapshots);
            await this.snapshotModel.markSnapshotsProcessed(snapshots);
        }
        await this.snapshotProcessor.saveCatigorizedPlayerInfoData();
        await this.calculateLeaderboard();
        await this.awardProcessor.processAwards();
        resolve();
    }.bind(this));
}

module.exports = BF2142Processor