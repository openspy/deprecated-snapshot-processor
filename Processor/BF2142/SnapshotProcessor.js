var PlayerRecordProcessor = require('./playerProgress');
function SnapshotProcessor(DbCtx, database, options) {
    this.playerRecordProcessor = new PlayerRecordProcessor(DbCtx, database, options);
}
SnapshotProcessor.prototype.processSnapshots = function(snapshots) {
    return new Promise(async function(resolve, reject) {
        for(let i of snapshots) {
            try {
                await this.processSnapshot(i);
            } catch(e) {
                console.error(e);
            }
        }    
        resolve();
    }.bind(this));
};

SnapshotProcessor.prototype.processSnapshot = function(snapshot) {
    return new Promise(async function(resolve, reject) {
        if(!snapshot || !snapshot.updates || snapshot.updates.length != 1) {
            return reject({message: "invalid snapshot data"});
        }
        let game_data = snapshot.updates[0].data;

        var num_players = 0;
        var player_profileid = 0;
        do {
            var pid_key = "pid_" + (num_players++);
            player_profileid = game_data[pid_key];
        } while(player_profileid !== undefined);

        let player_variables = [];
        for(let i=0;i<num_players;i++) {
            player_variables[i] = {};
        }
        let server_variables = {};
        let obj_keys = Object.keys(game_data);
        for(let i =0;i<obj_keys.length;i++) {
            let match = obj_keys[i].match(/_\d+$/);
            if(match == null) {
                server_variables[obj_keys[i]] = game_data[obj_keys[i]];
                continue;
            }
            let player_index = parseInt(match[0].substring(1));
            let variable_name = obj_keys[i].substring(0, obj_keys[i].length - match[0].length);
            player_variables[player_index][variable_name] = game_data[obj_keys[i]];

        }

        let player_progress_promises = [];
        for(let i=0;i<num_players;i++) {
            player_variables[i].pid = parseInt(player_variables[i].pid);
            player_progress_promises.push(this.playerRecordProcessor.processRecord(server_variables, player_variables[i]));
        }
        return Promise.all(player_progress_promises).then(function(results) {
            resolve();
        });
        
    }.bind(this));
};

module.exports = SnapshotProcessor;