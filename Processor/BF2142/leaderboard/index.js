var LeaderboardModel = require('../../../lib/LeaderboardModel');
function LeaderboardProcessor(DbCtx, database, options) {
    this.leaderboardModel = new LeaderboardModel(DbCtx, database);
    this.options = options;
    this.DbCtx = DbCtx;
    this.database = database;    
    this.ITEMS_PER_PAGE = 17;
    this.MAX_ITEMS = 1000;
    this.player_progress_collection = database.collection('player_progress');
}

LeaderboardProcessor.prototype.calculateLeaderboard = function(server_data, player_record) {
   return new Promise(async function(resolve, reject) {
        var results = await this.calculateOverallScore();
        await this.updateLeaderboard("overallscore",results);
        results = await this.calculateCombatScore();
        await this.updateLeaderboard("combatscore",results);
        await this.setOptionsLeaderboard();
        resolve();
   }.bind(this));
}

LeaderboardProcessor.prototype.calculateOverallScore = function() {
    return new Promise(function(resolve, reject) {
        this.player_progress_collection.aggregate([{$match: {gameid: this.options.gameid}}, {$project: {_id: 0, "pid": "$profileid", "nick": "$nick", "globalscore": "$data.gsco", "playerrank": "$data.rnk", "countrycode": "US", "Vet": "0"}}, {$sort: {globalscore: -1}}], function(err, cursor) {
            
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
        this.player_progress_collection.aggregate([{$match: {gameid: this.options.gameid}}, {$project: {_id: 0, "rank": "0", "pos": "0", "pid": "$profileid", "nick": "$nick", 
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
LeaderboardProcessor.prototype.updateLeaderboard = async function(baseKey, data) {
    var total_players = data.length;
    var current_offset = 1;
    var current_page = {pageKey: baseKey + "_" + current_offset, gameid: this.options.gameid, data: [], baseKey: baseKey};
    await this.leaderboardModel.deleteMany({baseKey, gameid: this.options.gameid});
    for(var i =0;i<total_players;i++) {
        data[i].rank = i+1;
        current_page.data.push(data[i]);
        if(current_page.data.length > this.ITEMS_PER_PAGE) {
            await this.leaderboardModel.insertOrUpdate(current_page);
            current_offset += this.ITEMS_PER_PAGE;
            current_page = {pageKey: baseKey + "_" + current_offset, gameid: this.options.gameid, data: [], baseKey: baseKey};
            
        }
    }
    if(current_page.data.length > 0) {
        await this.leaderboardModel.insertOrUpdate(current_page);
    }
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