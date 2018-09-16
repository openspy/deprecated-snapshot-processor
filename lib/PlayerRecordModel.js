function PlayerProgressModel (DbCtx, Database) {
    this.DbCtx = DbCtx;
    this.Database = Database;
    this.collection = Database.collection('player_progress');
}

PlayerProgressModel.prototype.fetch = function(search_params) {
    return new Promise(function(resolve, reject) {

        var lookup_params = {};
        lookup_params = Object.apply(search_params, lookup_params);
        var snapshots = this.collection.findOne(lookup_params, function(err, results) {
            if(err) return reject(err);
            resolve(results || {});
        });
    }.bind(this));
}

PlayerProgressModel.prototype.insertOrUpdate = function(update_data) {
    return new Promise(function(resolve, reject) {
        if(!update_data._id) {
            this.collection.insertOne(update_data, function(err, result) {
                if(err) return reject(err);

                resolve();
            });
        } else {
            this.collection.findOneAndUpdate({_id: update_data._id}, {$set: update_data}, function(err, result) {
                if(err) return reject(err);

                resolve();
            });
        }
    }.bind(this));
};

module.exports = PlayerProgressModel;