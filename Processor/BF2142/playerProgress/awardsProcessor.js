function AwardProcessor(DbCtx, database, options) {
    this.options = options;
    this.DbCtx = DbCtx;
    this.database = database;    
}

AwardProcessor.prototype.processRecord = function(server_data, player_record) {
}

module.exports = AwardProcessor;