var PlayerRecordModel = require('../../../lib/PlayerRecordModel');
var ProfileLookup = new (require('../../../lib/ProfileLookup'))();
function PlayerInfoProcessor(DbCtx, database, options) {
    this.options = options;
    this.DbCtx = DbCtx;
    this.database = database;    
    this.playerRecordModel = new PlayerRecordModel(DbCtx, database, options);    

    this.playerProgressGreaterKeys = [
        //"rnk", //maybe remove
        "dstrk", //#> => Worst Death Streak
        "klstrk" //#> => Kills Streak
    ]
    this.playerProgressIncKeys = [
		"capa",     //+ => Capture Assists
		"cpt",      //+ => Captured CPs
		"crpt",     //+ => Career Points
		"cs",       //+ => Commander Score
		"dass",     //+ => Driver Assists
        "dcpt",     //+ => Defended Control Points			
        "dmst",     //+ => Defended Missle Silos
		"dths",     //+ => Deaths
		"gsco",     //+ => Global Score
		"hls",      //+ => Heals
		"kick",     //+ => total kicks from servers
		"klla",     //+ => Kill Assists
        "klls",     //+ => Kills			
        "klse",     //+ => Kills With Explosion?
		"kluav",    //+ => Kills With Gun Drone
        "ncpt",     //+ => Neutralized CPs
        "nmst",     //+ => Neutralized Missle Silos
		//"pdt",      //+ => Unique Dog Tags Collected
		//"pdtc",     //+ => Dog Tags Collected
		"resp",     //+ => Re-supplies
		"rps",      //+ => Repairs
		"rvs",      //+ => Revives
		"slbspn",   //+ => Spawns On Squad Beacons
        "sluav",    //+ => Spawn Dron Deployed
        "slpts",    //+ => Points from SLS Beacon ??
		"suic",     //+ => Suicides
		"tac",      //+ => Time As Commander
		"talw",     //+ => Time As Lone Wolf
		"tas",      //+ => Titan Attack Score
		"tasl",     //+ => Time As Squad Leader
		"tasm",     //+ => Time As Squad Member
		"tcd",      //+ => Titan Components Destroyed
		"tcrd",     //+ => Titan Cores Destroyed
		"tdmg",     //+ => Team Damage
		"tdrps",    //+ => Titan Drops
		"tds",      //+ => Titan Defend Score
		"tgd",      //+ => Titan Guns Destroyed
		"tgr",      //+ => Titan Guns Repaired
		"tkls",     //+ => Team Kills
		"toth",     //+ => Total Hits
		"tots",     //+ => Total Fired
		"tt",       //+ => Time Played
		"tvdmg",    //+ => Team Vehicle Damage
        "twsc",     //+ => Teamwork Score
        
        "kdths-0",  //+ => deads as Recon
        "kdths-1",  //+ => deads as Assault
        "kdths-2",  //+ => deads as Engineer
        "kdths-3",  //+ => deads as Support
        "kkls-0",  //+ => Kills As Recon
        "kkls-1",  //+ => Kills As Assault
        "kkls-2",  //+ => Kills As Engineer
        "kkls-3",  //+ => Kills As Support
        "ktt-0",   //+ => Time As Recon
        "ktt-1",   //+ => Time As Assault
        "ktt-2",   //+ => Time As Engineer
        "ktt-3",   //+ => Time As Support
        "etp-3", //+ => Time cloaked
    ]
}
PlayerInfoProcessor.prototype.processPlayerInfo = function(server_data, player_snapshot_data) {
    return new Promise(async function(resolve, reject) {
        //if(player_snapshot_data.c != 1) return resolve(); //player quit early... ignore stats
        try {        
            var profileData = await ProfileLookup.Lookup({id: player_snapshot_data.pid});
            if(profileData == null || profileData.length == 0)  { //skip invalid profile
                //console.log("skip invalid profile", player_snapshot_data.pid)
                return resolve(); 
            }
        } catch(e) {
            console.warn("profileid", player_snapshot_data.pid, e);
            profileData = [{id: player_snapshot_data.pid }];
        }
        profileData = profileData[0];
        var pageKey = "player_info";
        this.playerRecordModel.fetch({pageKey, gameid: this.options.gameid, profileid: player_snapshot_data.pid}).then(function(progress) {
            progress.profileid = player_snapshot_data.pid;
            progress.gameid = this.options.gameid;
            progress.pageKey = pageKey;
            if(!progress.data) {
                progress.data = {};
            }

            for(var i = 0;i<this.playerProgressIncKeys.length;i++) {
                var key = this.playerProgressIncKeys[i];
                if(progress.data[key] === undefined) {
                    progress.data[key] = 0;
                }
                progress.data[key] += parseFloat(player_snapshot_data[key]);
            }
    
            for(var i = 0;i<this.playerProgressGreaterKeys.length;i++) {
                var key = this.playerProgressGreaterKeys[i];
                if(progress.data[key] === undefined) {
                    progress.data[key] = 0;
                }
                var value = parseFloat(player_snapshot_data[key]);
                if(value > progress.data[key])
                    progress.data[key] = value;
            }

            progress.data = this.handleVehicleStats(server_data, player_snapshot_data, progress.data);
            progress.data = this.handleWeaponStats(server_data, player_snapshot_data, progress.data);
            progress.data = this.options.handleCalculatedVariables(server_data, player_snapshot_data, progress.data);
            this.handleDogTags(server_data, player_snapshot_data, progress.data).then(function(progressData) {
                progress.data = progressData;
                progress.nick = player_snapshot_data.nick;
                progress.profileid = player_snapshot_data.pid;
                progress.vet = 0;
                progress.countrycode = profileData.countrycode || "US";
                progress.gameid = this.options.gameid;
                progress.modified = Date.now();
                this.playerRecordModel.insertOrUpdate(progress).then(resolve, reject);
            }.bind(this));
    
            
        }.bind(this));

    }.bind(this));
}

PlayerInfoProcessor.prototype.handleVehicleStats = function(server_data, player_snapshot_data, current_progress) {
    var armoued_vehicles = [1,2];// apc, tank
    var inc_keys = [
        "vdstry",
        "vdths",
        "vkls",
        "vrkls",
        "vtp",
        "vbf",
        "vbh",
    ];
    for(var i = 0;i<=this.options.NUM_VEHICLES;i++) {
        if(inc_keys.indexOf(x) !== -1) {
            var key = "vtp-" + i;
            if(player_snapshot_data[key] != undefined)  {
                if(current_progress[key] == undefined) {
                    current_progress[key] = 0;
                }
                current_progress["atp"] += parseFloat(player_snapshot_data[key]);
            }
        }
        for(var x = 0;x<inc_keys.length;x++) {
            var key = inc_keys[x] + "-" + i;


            if(player_snapshot_data[key] == undefined) {
                continue;
            }
            
            if(current_progress[key] === undefined) {
                current_progress[key] = 0;
            }
            current_progress[key] += parseFloat(player_snapshot_data[key]);
        }
        var kills_key = "vkls-" + i;
        var deaths_key = "vdths-" + i;
        if(player_snapshot_data[kills_key] !== undefined && player_snapshot_data[deaths_key] !== undefined) {            
            var current_kills = parseInt(player_snapshot_data[kills_key]);
            var total_kills = parseInt(player_snapshot_data[kills_key]) + current_kills;

            
            var current_deaths = parseInt(player_snapshot_data[deaths_key]);
            var total_deaths = parseInt(player_snapshot_data[deaths_key]) + current_deaths;

            current_progress[("vkdr-" + i)] = total_kills / total_deaths;
        }
    }
    return current_progress;

}

PlayerInfoProcessor.prototype.handleWeaponStats = function(server_data, player_snapshot_data, current_progress) {
    var inc_keys = [
        "wdths",
        "wkls",
        "wtp",
        "wbf",
        "wbh"
    ];
    for(var i =0;i<this.options.NUM_WEAPONS;i++) {
        for(var x = 0;x<inc_keys.length;x++) {
            var key = inc_keys[x] + "-" + i;

            if(player_snapshot_data[key] == undefined) {
                continue;
            }
            
            if(current_progress[key] === undefined) {
                current_progress[key] = 0;
            }
            current_progress[key] += parseFloat(player_snapshot_data[key]);
        }

        var accu_key = "waccu-" + i;
        var hit_key = "wbh-" + i;
        var fired_key = "wbf-"+i;
        var current_hit = parseInt(player_snapshot_data[hit_key]);
        var total_hit = parseInt(current_progress[hit_key]) + current_hit;

        var current_fired = parseInt(player_snapshot_data[fired_key]);
        var total_fired = parseInt(current_progress[fired_key]) + current_fired;
        if(total_hit > 0 && total_fired > 0)
            current_progress[accu_key] = (total_hit / total_fired);
        
        var kills_key = "wkls-" + i;
        var current_kills = parseInt(player_snapshot_data[kills_key]);
        var total_kills = parseInt(current_progress[kills_key]) + current_kills;

        var deaths_key = "wdths-" + i;
        var current_deaths = parseInt(player_snapshot_data[deaths_key]);
        var total_deaths = parseInt(current_progress[deaths_key]) + current_deaths;

        if(total_kills > 0 && total_deaths > 0)
            current_progress[("wkdr-" + i)] = total_kills / total_deaths;
    }
    return current_progress;
}
PlayerInfoProcessor.prototype.handleDogTags = function(server_data, player_snapshot_data, current_progress) {
    return new Promise(function(resolve, reject) {
        if(player_snapshot_data["pdt"] !== undefined) {
            var pageKey = "player_dogtags";
            return this.playerRecordModel.fetch({pageKey, gameid: this.options.gameid, profileid: player_snapshot_data.pid}).then(function(dogtags) {
                var dogtagsData = dogtags || {};
                dogtagsData.pageKey = pageKey;
                dogtagsData.gameid = this.options.gameid;
                dogtagsData.profileid = player_snapshot_data.pid;
                if(dogtagsData.data == undefined)
                    dogtagsData.data = {};
                
                var total_dogtags = 0, total_unique = 0;
                var snapshotDogtags = player_snapshot_data["pdt"];
                var keys = Object.keys(snapshotDogtags);
                for(var i =0;i<keys.length;i++) {
                    var key = keys[i];
                    if(dogtagsData.data[key] === undefined) {
                        dogtagsData.data[key] = snapshotDogtags[key];
                        total_unique++;
                    } else {
                        dogtagsData.data[key].count += snapshotDogtags[key].count;
                        dogtagsData.data[key].nick = snapshotDogtags[key].nick;
                    }
                    total_dogtags += snapshotDogtags[key].count;
                }

                return this.playerRecordModel.insertOrUpdate(dogtagsData).then(function(results) {
                    if(isNaN(current_progress.pdt)) {
                        current_progress.pdt = 0;
                   }
                   if(isNaN(current_progress.pdtc)) {
                    current_progress.pdtc = 0;
               }
                   current_progress.pdt += total_unique;
                   current_progress.pdtc += total_dogtags;
                   return resolve(current_progress);
                });
            }.bind(this));
        } else {
            return resolve();
        }
    }.bind(this));
}
module.exports = PlayerInfoProcessor;