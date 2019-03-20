var LeaderboardModel = require('../../../lib/LeaderboardModel');
function LeaderboardProcessor(DbCtx, database, options) {
    this.leaderboardModel = new LeaderboardModel(DbCtx, database);
    this.options = options;
    this.DbCtx = DbCtx;
    this.database = database;    
    this.player_progress_collection = database.collection('player_progress');
}

LeaderboardProcessor.prototype.calculateLeaderboard = function(server_data, player_record) {
   return new Promise(async function(resolve, reject) {
        var results = await this.calculateOverallScore();
        await this.updateLeaderboard("overallscore",results);
        results = await this.calculateCombatScore();
        await this.updateLeaderboard("combatscore",results);
        for(var i=0;i<this.options.NUM_WEAPONS;i++) {
            results = await this.calculateWeaponStats(i);
            await this.updateLeaderboard("weapon",results, i);
        }
        for(var i=0;i<this.options.NUM_VEHICLES;i++) {
            results = await this.calculateVehicleStats(i);
            await this.updateLeaderboard("vehicle",results, i);
        }

        results = await this.calculateCommanderScore();
        await this.updateLeaderboard("commanderscore",results);

        results = await this.calculateTeamWorkScore();
        await this.updateLeaderboard("teamworkscore",results);

        results = await this.calculateEfficiencyScore();
        await this.updateLeaderboard("efficiency",results);

        await this.setOptionsLeaderboard();
        resolve();
   }.bind(this));
}

LeaderboardProcessor.prototype.calculateOverallScore = function() {
    return new Promise(function(resolve, reject) {
        this.player_progress_collection.aggregate([{$match: {gameid: this.options.gameid, pageKey: "player_info"}}, {$project: {_id: 0, "pid": "$profileid", "nick": "$nick", "globalscore": "$data.gsco", "playerrank": "$data.rnk", "countrycode": "US", "Vet": "0"}}, {$sort: {globalscore: -1}}], function(err, cursor) {
            
            let results = [];
    
            cursor.on('data', function(data) {
                    results.push(data);
            });
    
            cursor.on('end', function() {
                resolve(results);
            })            
            
        }.bind(this));
    }.bind(this));
}

LeaderboardProcessor.prototype.calculateEfficiencyScore = function() {
    return new Promise(function(resolve, reject) {
        this.player_progress_collection.aggregate([{$match: {gameid: this.options.gameid, pageKey: "player_info"}}, {$project: {_id: 0, "rank": "0", "pos": "0", "pid": "$profileid", "nick": "$nick", 
        "Efficiency": "$data.spm",
        "countrycode": "US", "Vet": "0"}}, {$sort: {"Efficiency": -1}}], function(err, cursor) {
            
            let results = [];
    
            cursor.on('data', function(data) {
                    results.push(data);
            });
    
            cursor.on('end', function() {
                resolve(results);
            })            
            
        }.bind(this));
    }.bind(this));
}

LeaderboardProcessor.prototype.calculateCommanderScore = function() {
    return new Promise(function(resolve, reject) {
        this.player_progress_collection.aggregate([{$match: {gameid: this.options.gameid, pageKey: "player_info"}}, {$project: {_id: 0, "rank": "0", "pos": "0", "pid": "$profileid", "nick": "$nick", 
        "coscore": "$data.cs",
        "countrycode": "US", "Vet": "0"}}, {$sort: {"coscore": -1}}], function(err, cursor) {
            
            let results = [];
    
            cursor.on('data', function(data) {
                    results.push(data);
            });
    
            cursor.on('end', function() {
                resolve(results);
            })            
            
        }.bind(this));
    }.bind(this));
}
LeaderboardProcessor.prototype.calculateTeamWorkScore = function() {
    return new Promise(function(resolve, reject) {
        this.player_progress_collection.aggregate([{$match: {gameid: this.options.gameid, pageKey: "player_info"}}, {$project: {_id: 0, "rank": "0", "pos": "0", "pid": "$profileid", "nick": "$nick", 
        "teamworkscore": "$data.twsc",
        "countrycode": "US", "Vet": "0"}}, {$sort: {"teamworkscore": -1}}], function(err, cursor) {
            
            let results = [];
    
            cursor.on('data', function(data) {
                    results.push(data);
            });
    
            cursor.on('end', function() {
                resolve(results);
            })            
            
        }.bind(this));
    }.bind(this));
}

LeaderboardProcessor.prototype.calculateCombatScore = function() {
    return new Promise(function(resolve, reject) {
        this.player_progress_collection.aggregate([{$match: {gameid: this.options.gameid, pageKey: "player_info"}}, {$project: {_id: 0, "rank": "0", "pos": "0", "pid": "$profileid", "nick": "$nick", 
        "Kills": "$data.klls", "Deaths": "$data.dths", "Accuracy": "$data.ovaccu", "playerrank": "$data.rnk", "kdr": "$data.kdr",
        "countrycode": "US", "Vet": "0"}}, {$sort: {kdr: -1}}], function(err, cursor) {
            
            let results = [];
    
            cursor.on('data', function(data) {
                    results.push(data);
            });
    
            cursor.on('end', function() {
                resolve(results);
            })            
            
        }.bind(this));
    }.bind(this));
}
LeaderboardProcessor.prototype.calculateWeaponStats = function(weapon_index) {
    return new Promise(function(resolve, reject) {
        var kdr_search = "data.wkdr-" + weapon_index;
        var kills_key = "$data.wkls-" + weapon_index;
        var deaths_key = "$data.wdths-" + weapon_index;
        var accuracy_key = "$data.waccu-" + weapon_index;
        var kdr_key = "$data.wkdr-" + weapon_index;
        var projection = {_id: 0, "rank": "0", "pos": "0", "pid": "$profileid", "nick": "$nick", 
        "Kills": kills_key, "Deaths": deaths_key, "Accuracy": accuracy_key, "playerrank": "$data.rnk", "kdr": kdr_key,
        "countrycode": "US", "Vet": "0"};
        var matchOptions = {gameid: this.options.gameid, pageKey: "player_info"};
        matchOptions[kdr_search] = {"$exists": true};
        this.player_progress_collection.aggregate([{$match: matchOptions}, {$project: projection}, {$sort: {"kdr": -1, "Accuracy": -1, "Kills": -1, "Deaths": 1}}], function(err, cursor) {
            
            let results = [];
    
            cursor.on('data', function(data) {
                    results.push(data);
            });
    
            cursor.on('end', function() {
                resolve(results);
            })            
            
        }.bind(this));
    }.bind(this));
}
LeaderboardProcessor.prototype.calculateVehicleStats = function(vehicle_index) {
    return new Promise(function(resolve, reject) {
        var kills_key = "$data.vkls-" + vehicle_index;
        var deaths_key = "$data.vdths-" + vehicle_index;
        var kdr_key = "$data.vkdr-" + vehicle_index;
        var roadkills_kill = "$data.vrkls-" + vehicle_index;

        var kills_search = "data.vkls-" + vehicle_index;
        var deaths_search = "data.vdths-" + vehicle_index;

        var projection = {_id: 0, "rank": "0", "pos": "0", "pid": "$profileid", "nick": "$nick", 
        "Kills": kills_key, "Deaths": deaths_key, "Roadkills": roadkills_kill, "playerrank": "$data.rnk", "kdr": kdr_key,
        "countrycode": "US", "Vet": "0"};
        var matchOptions = {gameid: this.options.gameid, pageKey: "player_info"};
        matchOptions[kills_search] = {"$gt": 0};
        matchOptions[deaths_search] = {"$gt": 0};
        this.player_progress_collection.aggregate([{$match: matchOptions}, {$project: projection}, {$sort: {"Kdr": -1, "Kills": -1, "Deaths": 1}}], function(err, cursor) {
            
            let results = [];
    
            cursor.on('data', function(data) {
                    results.push(data);
            });
    
            cursor.on('end', function() {
                resolve(results);
            })            
            
        }.bind(this));
    }.bind(this));
}
LeaderboardProcessor.prototype.updateLeaderboard = async function(baseKey, data, id_key) {
    var total_players = data.length;
    if(id_key !== undefined)
        baseKey += ("_" + id_key);
    var current_page = {gameid: this.options.gameid, data: [], baseKey: baseKey};
    await this.leaderboardModel.deleteMany({baseKey, gameid: this.options.gameid});
    for(var i =0;i<total_players;i++) {
        data[i].rank = i+1;
        current_page.data.push(data[i]);
        if(current_page.data.length > this.ITEMS_PER_PAGE) {
            current_page = {gameid: this.options.gameid, data: [], baseKey: baseKey};
        }
    }
    await this.leaderboardModel.insertOrUpdate(current_page);
}

LeaderboardProcessor.prototype.setOptionsLeaderboard = function() {
    return new Promise(async function(resolve, reject) {
        let leaderboard_data = await this.leaderboardModel.fetch({gameid: this.options.gameid, baseKey: "settings"});

        leaderboard_data.baseKey = "settings";
        leaderboard_data.pageKey = "settings";
        leaderboard_data.data  = {};
        leaderboard_data.data.scores = this.options.scoreSettings;
        leaderboard_data.data.awards = this.options.awardSettings;

        await this.leaderboardModel.insertOrUpdate(leaderboard_data);
        resolve();
    }.bind(this));
};
module.exports = LeaderboardProcessor;