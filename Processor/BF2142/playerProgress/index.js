var PlayerInfoProcessor = require('./playerInfoProcessor');
var PlayerProgressProcessor = require('./playerProgressProcessor');
function PlayerRecordProcessor(DbCtx, database, options) {
    this.options = options;
    this.DbCtx = DbCtx;
    this.database = database;    
    this.playerInfoProcessor = new PlayerInfoProcessor(DbCtx, database, options);
    this.playerProgressProcessor = new PlayerProgressProcessor(DbCtx, database, options);
}

PlayerRecordProcessor.prototype.processRecord = function(server_data, player_record) {
    var promises = [];
    promises.push(this.playerInfoProcessor.processPlayerInfo(server_data, player_record));
    promises.push(this.playerProgressProcessor.processSnapshot(server_data, player_record));
    return Promise.all(promises);
}


module.exports = PlayerRecordProcessor;