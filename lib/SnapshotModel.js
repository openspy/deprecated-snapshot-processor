function SnapshotModel (DbCtx, Database) {
    this.DbCtx = DbCtx;
    this.Database = Database;
    this.collection = Database.collection('snapshots');
}

SnapshotModel.prototype.getUnprocessedSnapshots = function(search_params) {
    return new Promise(function(resolve, reject) {
        var lookup_params = {processed: {$ne: true}};

        lookup_params = Object.assign(search_params, lookup_params);
        var snapshots = this.collection.find(lookup_params).toArray(function(err, results) {
            if(err) return reject(err);
            resolve(results);
        });
    }.bind(this));
}

SnapshotModel.prototype.markSnapshotsProcessed = function(snapshots) {
    return new Promise(function(resolve, reject) {
        var ids = [];
        for(var i of snapshots) {
            ids.push(i._id);
        }
        this.collection.findOneAndUpdate({_id: {$in:ids}}, {$set: {processed: true}}, function(err, result) {
            if(err) return reject(err);
            resolve(result);
        });
    }.bind(this));
}

module.exports = SnapshotModel;