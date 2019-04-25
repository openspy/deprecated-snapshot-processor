var PlayerRecordModel = require('../../../lib/PlayerRecordModel');
function AwardProcessor(DbCtx, database, options) {
    this.options = options;
    this.DbCtx = DbCtx;
    this.database = database;    
    this.player_progress_collection = database.collection('player_progress');
    this.player_snapshots_collection = database.collection('player_snapshots');
    this.playerRecordModel = new PlayerRecordModel(DbCtx, database, options);    
    this.pageKey = "awards";
}

AwardProcessor.prototype.processAwards = function() {
    return new Promise(async function(resolve, reject) {
        await this.processAllTimeAwards();
        resolve();
    }.bind(this));
}
AwardProcessor.prototype.GetBestRoundData = function(profileid) {
    return new Promise(function(resolve, reject) {
        this.player_snapshots_collection.aggregate([{$match: {profileid}}, {$project: {profileid: 1, data: {$objectToArray: "$player_data"}}}, {$unwind: "$data"}, {$group: { _id:  "$data.k", "v": { $max: "$data.v" }, "profileid": {$max:"$profileid"}}}, { $group: { _id: "$profileid", "data": { $push: { "k": "$_id", "v" : "$v"}}}}, { $project: { _id: 1, "data": { $arrayToObject: "$data"}}}], function(err, cursor) {
            let last_result = null;

            cursor.on('data', function(data) {
                last_result = data;
            });
            cursor.on('end', function() {
                resolve(last_result);
            });
            
        });
        
    }.bind(this));
}

AwardProcessor.prototype.processAllTimeAwards = function() {
    return new Promise(function(resolve, reject) {
        this.player_progress_collection.aggregate([{$match: {gameid: this.options.gameid, pageKey: "player_info"}}], function(err, cursor) {
            let results = [];

            cursor.on('data', function(data) {
                    results.push(data);
            });
    
            cursor.on('end', function() {
                var promises = [];
                for(var i=0;i<results.length;i++) {
                    promises.push(this.ProcessPlayerAward(results[i]));
                }
                return Promise.all(promises).then(function() {
                    return resolve();
                });
            }.bind(this))     
        }.bind(this));
    }.bind(this));
}

AwardProcessor.prototype.ProcessPlayerAward = function(player_info) {
    return new Promise(async function(resolve, reject) {
        var player_best_rounds = await this.GetBestRoundData(player_info.profileid);
        for(var i=0;i<this.options.awardSettings.length;i++) {
            var award = this.options.awardSettings[i];
            await this.CheckPlayerAward(player_info, player_best_rounds, award);
        }
        return resolve();
    }.bind(this));
}
AwardProcessor.prototype.CheckPlayerAward = function(player_info, player_best_rounds, award) {
    return new Promise(async function(resolve, reject) {
        var mapping = this.options.awardVariableMapping;
        if(player_info == null || player_best_rounds == null) return resolve();
        var player_data = player_info.data;
        var best_rounds_data = player_best_rounds.data;
        if(player_info.data == null || player_best_rounds.data == null) return resolve();
        var rule_matches = [];
        var full_match = true;
        var allow_multiple = true;
        for(var i=0;i<award.rules.length;i++) {
            var rule = award.rules[i];
            var rules = rule.split(',');
            var map_item = mapping[rules[1]];
            var type = parseInt(rules[0]);
            var required_accum = parseFloat(rules[3].trim());
            var accum = 0.0;

            if(map_item == null) {
                console.error("missing map data for award", award.awardKey);
                return resolve();
            }
    
            var use_player_info = true;
            switch(type) {
                case 1://all time
                case 9://hours
                case 10://minutes
                case 11: //hours
                case 5:
                case 7:
                use_player_info = true;
                allow_multiple = false;
                break;
                case 6://in a round
                use_player_info = false;
                break;
            }
            if(map_item.type == "score_variable") {    
                for(var x=0;x<map_item.variables.length;x++) {
                    var val = use_player_info ? player_data[map_item.variables[x]] : best_rounds_data[map_item.variables[x]];
                    accum += val;
                }
                rule_matches.push(accum >= required_accum);
            } else if(map_item.type == "has_award") {
                allow_multiple = false;
                var existing_award_index = await this.CheckPlayerHasAward(null, map_item.award_name, player_info.profileid);
                rule_matches.push(existing_award_index != null);
            }

            for(var x=0;x<rule_matches.length;x++) {
                if(!rule_matches[i])
                    full_match = false;
            }
        }
        if(full_match)
            this.UnlockAward(player_info.profileid, award.awardKey, allow_multiple).then(resolve, reject);
        else {
            return resolve();
        }
    }.bind(this));
}
AwardProcessor.prototype.UnlockAward = function(profileid, awardname, allow_multiple) {
    return new Promise(function(resolve, reject) {
        var now = Math.floor(Date.now() / 1000);
        var default_entry = {award: awardname, level: 1, when: now, first: now};
        
        this.playerRecordModel.fetch({pageKey: this.pageKey, gameid: this.options.gameid, profileid: profileid}).then(async function(progress) {
            progress.gameid = this.options.gameid;
            progress.pageKey = this.pageKey;
            progress.profileid = profileid;
            if(progress.data == undefined) {
                progress.data = [];
            }
            var existing_award_index = await this.CheckPlayerHasAward(progress.data, awardname, profileid);
            if(existing_award_index == null) {
                progress.data.push(default_entry);
            } else if(allow_multiple) {
                var entry = progress.data[existing_award_index];
                entry.when = now;
                entry.level++;
                progress.data[existing_award_index] = entry;
            } else {
                return resolve();
            }
            this.playerRecordModel.insertOrUpdate(progress).then(resolve, reject);
        }.bind(this));
    }.bind(this));
}
AwardProcessor.prototype.CheckPlayerHasAward = function(awardData, awardname, profileid) {
    return new Promise(function(resolve, reject) {
        if(awardData == null) {
            return this.playerRecordModel.fetch({pageKey: this.pageKey, gameid: this.options.gameid, profileid: profileid}).then(async function(progress) {
                if(progress == null || progress.data == null || progress.data.length == 0) {
                    return resolve(null);
                } else {
                    this.CheckPlayerHasAward(progress.data, awardname, profileid).then(resolve, reject);
                }
            }.bind(this));
        } else {
            for(var i=0;i<awardData.length;i++) {
                if(awardData[i].award === awardname) {
                    return resolve(i);
                }
            }
            return resolve(null);
        }
    }.bind(this));
}
module.exports = AwardProcessor;