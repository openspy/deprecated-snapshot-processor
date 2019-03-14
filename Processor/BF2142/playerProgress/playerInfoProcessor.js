var PlayerRecordModel = require('../../../lib/PlayerRecordModel');
function PlayerInfoProcessor(DbCtx, database, options) {
    this.options = options;
    this.DbCtx = DbCtx;
    this.database = database;    
    this.playerRecordModel = new PlayerRecordModel(DbCtx, database, options);    

    this.NUM_VEHICLES = 16;
    this.NUM_WEAPONS = 49;

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
		"dths",     //+ => Deaths
		"gsco",     //+ => Global Score
		"hls",      //+ => Heals
		"kick",     //+ => total kicks from servers
		"klla",     //+ => Kill Assists
		"klls",     //+ => Kills			
		"kluav",    //+ => Kills With Gun Drone
		"ncpt",     //+ => Neutralized CPs
		//"pdt",      //+ => Unique Dog Tags Collected
		//"pdtc",     //+ => Dog Tags Collected
		"resp",     //+ => Re-supplies
		"rps",      //+ => Repairs
		"rvs",      //+ => Revives
		"slbspn",   //+ => Spawns On Squad Beacons
		"sluav",    //+ => Spawn Dron Deployed
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
    ]
}
PlayerInfoProcessor.prototype.processPlayerInfo = function(server_data, player_snapshot_data) {
    return new Promise(function(resolve, reject) {
        //if(player_snapshot_data.c != 1) return resolve(); //player quit early... ignore stats
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
                if(progress.data[key] > value)
                progress.data[key] = value;
            }

            progress.data = this.handleVehicleStats(server_data, player_snapshot_data, progress.data);
            progress.data = this.handleWeaponStats(server_data, player_snapshot_data, progress.data);
            progress.data = this.handleCalculatedVariables(server_data, player_snapshot_data, progress.data);
    
            progress.nick = player_snapshot_data.nick;
            progress.profileid = player_snapshot_data.pid;
            progress.gameid = this.options.gameid;
            progress.modified = Date.now();
            this.playerRecordModel.insertOrUpdate(progress).then(resolve, reject);
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
    for(var i = 0;i<=this.NUM_VEHICLES;i++) {
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
    for(var i =0;i<this.NUM_WEAPONS;i++) {
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

        var key = "waccu-" + i;
        if(current_progress[key] == undefined) {
            current_progress[key] = 0;
        }
        if(player_snapshot_data[key] !== undefined) {
            if(current_progress[key] == 0) {
                current_progress[key] = parseFloat(player_snapshot_data[key]);
            } else {
                current_progress[key] *= parseFloat(player_snapshot_data[key]);
            }
            
        }
    }
    return current_progress;
}
PlayerInfoProcessor.prototype.getRankFromScore = function(score) {
    var highest_score = 0;
    for(var i = 0;i < this.options.scoreSettings.length;i++) {
        var setting = this.options.scoreSettings[i];
        if(setting != null && setting.minScore > 0) {
            if(score >= setting.minScore) {
                highest_score = setting.rank;
            }
        }
    }
    return highest_score;
}
PlayerInfoProcessor.prototype.handleCalculatedVariables = function(server_data, player_snapshot_data, current_progress) {
    //kill death ratio, time as titan, etc
    current_progress.rnk = this.getRankFromScore(current_progress.crpt);

    var kills_diff = current_progress.klls - current_progress.dths;
    if(current_progress.dths > 0) {
        if(kills_diff > 0) {
            current_progress.kdr = current_progress.klls / current_progress.dths;
        } else {
            current_progress.kdr = -(current_progress.dths / current_progress.klls);
        }
        var start_time = parseFloat(server_data["mapstart"]);
        var end_time = parseFloat(server_data["mapend"]);

        current_progress.ttp = Math.floor(end_time-start_time);
    }
        
    return current_progress;
}
module.exports = PlayerInfoProcessor;