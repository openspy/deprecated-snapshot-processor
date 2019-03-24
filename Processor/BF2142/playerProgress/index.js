var PlayerInfoProcessor = require('./playerInfoProcessor');
var PlayerProgressProcessor = require('./playerProgressProcessor');
function PlayerRecordProcessor(DbCtx, database, options) {
    this.options = options;
    this.DbCtx = DbCtx;
    this.database = database;    
    this.playerInfoProcessor = new PlayerInfoProcessor(DbCtx, database, options);
    this.playerProgressProcessor = new PlayerProgressProcessor(DbCtx, database, options);
    this.player_progress_collection = database.collection('player_snapshots');
}

PlayerRecordProcessor.prototype.processRecord = function(server_data, player_record) {
    var promises = [];
    if(isNaN(player_record.pid)) return;
    promises.push(this.playerInfoProcessor.processPlayerInfo(server_data, player_record));
    promises.push(this.playerProgressProcessor.processSnapshot(server_data, player_record));
    promises.push(this.saveSnapshot(server_data, player_record));
    return Promise.all(promises);
}
PlayerRecordProcessor.prototype.saveSnapshot = function(server_data, player_record) {
    return new Promise(function(resolve, reject) {
        var calculated_data = this.options.handleCalculatedVariables(server_data, player_record, player_record);
        var player_data = Object.assign({}, calculated_data);
        var keys = Object.keys(player_data);
        for(var i=0;i<keys.length;i++) {
            var key_data = player_data[keys[i]];
            var dbl = parseFloat(key_data);
            var integer = parseInt(key_data);
            if(dbl == key_data) {
                player_data[keys[i]] = dbl;
            } else if(integer == key_data) {
                player_data[keys[i]] = integer;
            }
        }
        var insert_data = {server_data, player_data: player_data, gameid: this.options.gameid, profileid: player_record.pid};
        this.player_progress_collection.insertOne(insert_data, function(err, result) {
            if(err) {
                return reject(err);
            }
            return resolve();
        });
    }.bind(this));
}


module.exports = PlayerRecordProcessor;