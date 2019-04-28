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
PlayerInfoProcessor.prototype.saveCatigorizedData = function() {
    var pageKey = "player_info";
    return new Promise(function(resolve, reject) {
        var promises = [];
        this.playerRecordModel.fetchMany({pageKey, gameid: this.options.gameid}).then(function(cursor) {
            cursor.on('data', function(data) {
                promises.push(this.saveCatigorizedPlayerData(data));
            }.bind(this));
    
            cursor.on('end', function() {
                Promise.all(promises).then(resolve, reject);
            }) 
        }.bind(this)); 
    }.bind(this));  
}
PlayerInfoProcessor.prototype.saveCatigorizedPlayerData = function(data) {
    var catigories = {
        "base": [
            "pid", "subaccount", "tid", "gsco", "rnk", "tac", "cs", "tt", "crpt", "klstrk", "bnspt", "dstrk", "rps", "resp", "tasl", "tasm", "awybt", "hls", "sasl", "tds", "win", "los", "unlc", "expts", "cpt", "dcpt", "twsc", "tcd", "slpts", "tcrd", "md", "ent", "ent-1", "ent-2", "ent-3", "bp-1", "wtp-30", "htp", "hkl", "atp", "akl", "vtp-0", "vtp-1", "vtp-2", "vtp-3", "vtp-4", "vtp-5", "vtp-6", "vtp-7", "vtp-8", "vtp-9", "vtp-10", "vtp-11", "vtp-12", "vtp-13", "vtp-14", "vtp-15", "vkls-0", "vkls-1", "vkls-2", "vkls-3", "vkls-4", "vkls-5", "vkls-6", "vkls-7", "vkls-8", "vkls-9", "vkls-10", "vkls-11", "vkls-12", "vkls-13", "vkls-14", "vkls-15", "vdstry-0", "vdstry-1", "vdstry-2", "vdstry-3", "vdstry-4", "vdstry-5", "vdstry-6", "vdstry-7", "vdstry-8", "vdstry-9", "vdstry-10", "vdstry-11", "vdstry-12", "vdstry-13", "vdstry-14", "vdstry-15", "vdths-0", "vdths-1", "vdths-2", "vdths-3", "vdths-4", "vdths-5", "vdths-6", "vdths-7", "vdths-8", "vdths-9", "vdths-10", "vdths-11", "vdths-12", "vdths-13", "vdths-14", "vdths-15", "ktt-0", "ktt-1", "ktt-2", "ktt-3", "wkls-0", "wkls-1", "wkls-2", "wkls-3", "wkls-4", "wkls-5", "wkls-6", "wkls-7", "wkls-8", "wkls-9", "wkls-10", "wkls-11", "wkls-12", "wkls-13", "wkls-14", "wkls-15", "wkls-16", "wkls-17", "wkls-18", "wkls-19", "wkls-20", "wkls-21", "wkls-22", "wkls-23", "wkls-24", "wkls-25", "wkls-26", "wkls-27", "wkls-28", "wkls-29", "wkls-30", "wkls-31", "klsk", "klse", "etp-0", "etp-1", "etp-2", "etp-3", "etp-4", "etp-5", "etp-6", "etp-7", "etp-8", "etp-9", "etp-10", "etp-11", "etp-12", "etp-13", "etp-14", "etp-15", "etp-16", "etpk-0", "etpk-1", "etpk-2", "etpk-3", "etpk-4", "etpk-5", "etpk-6", "etpk-7", "etpk-8", "etpk-9", "etpk-10", "etpk-11", "etpk-12", "etpk-13", "etpk-14", "etpk-15", "etpk-16", "attp-0", "attp-1", "awin-0", "awin-1", "tgpm-0", "tgpm-1", "tgpm-2", "kgpm-0", "kgpm-1", "kgpm-2", "bksgpm-0", "bksgpm-1", "bksgpm-2", "ctgpm-0", "ctgpm-1", "ctgpm-2", "csgpm-0", "csgpm-1", "csgpm-2", "trpm-0", "trpm-1", "trpm-2", "klls", "attp-0", "attp-1", "awin-0", "awin-1", "pdt", "mtt-0-0", "mtt-0-1", "mtt-0-3", "mtt-0-4", "mtt-0-5", "mtt-0-6", "mtt-0-7", "mtt-0-8", "mtt-0-9", "mwin-0-0", "mwin-0-1", "mwin-0-3", "mwin-0-4", "mwin-0-5", "mwin-0-6", "mwin-0-7", "mwin-0-8", "mwin-0-9", "mbr-0-0", "mbr-0-1", "mbr-0-3", "mbr-0-4", "mbr-0-5", "mbr-0-6", "mbr-0-7", "mbr-0-8", "mbr-0-9", "mkls-0-0", "mkls-0-1", "mkls-0-3", "mkls-0-4", "mkls-0-5", "mkls-0-6", "mkls-0-7", "mkls-0-8", "mkls-0-9", "mtt-1-0", "mtt-1-1", "mtt-1-2", "mtt-1-3", "mtt-1-5", "mwin-1-0", "mwin-1-1", "mwin-1-2", "mwin-1-3", "mwin-1-5", "mlos-1-0", "mlos-1-1", "mlos-1-2", "mlos-1-3", "mlos-1-5", "mbr-1-0", "mbr-1-1", "mbr-1-2", "mbr-1-3", "mbr-1-5", "msc-1-0", "msc-1-1", "msc-1-2", "msc-1-3", "msc-1-5", "mkls-1-0", "mkls-1-1", "mkls-1-2", "mkls-1-3", "mkls-1-5"
        ],
        "ply": [
            "pid", "nick", "tid", "klls", "klla", "dths", "suic", "klstrk", "dstrk", "spm", "kdr", "kpm", "dpm", "akpr", "adpr", "tots", "toth", "ovaccu", "ktt-0", "ktt-1", "ktt-2", "ktt-3", "kkls-0", "kkls-1", "kkls-2", "kkls-3"
        ],
        "titan": [
            "pid", "nick", "tid", "tas", "tdrps", "tds", "tgr", "tgd", "tcd", "tcrd", "ttp", "trp", "cts"
        ],
        "wrk": [
            "pid", "nick", "tid", "twsc", "cpt", "capa", "dcpt", "hls", "rps", "rvs", "resp", "talw", "dass", "tkls", "tdmg", "tvdmg", "tasm", "tasl", "tac", "cs", "sasl", "cts"
        ],
        "com": [
            "pid", "nick", "tid", "slbspn", "sluav", "kluav", "cs", "slpts", "tasl", "sasl", "tac", "slbcn", "wkls-27", "csgpm-0", "csgpm-1", "csgpm-2"
        ],
        "ovr": [
            "pid", "nick", "tid", "gsco", "tt", "crpt", "fgm", "fm", "fe", "fv", "fk", "fw", "win", "los", "acdt", "lgdt", "brs", "etp-3", "pdt", "pdtc"
        ],
        "comp": [
            "pid", "nick", "tid", "gsco", "tt", "crpt", "fgm", "fm", "fe", "fv", "fk", "fw", "win", "los", "acdt", "lgdt", "brs", "etp-3", "pdt", "pdtc"
        ]
    };
    return new Promise(function(resolve, reject) {
        var keys = Object.keys(catigories);
        var promises = [];
        for(var i=0;i<keys.length;i++) {
            var catigory_data = {};
            var key_name = keys[i];
            for(var x=0;x<catigories[key_name].length;x++) {
                var sub_key_name = catigories[key_name][x];
                if(sub_key_name == "p.pid" || sub_key_name == "pid") {
                    catigory_data[sub_key_name] = data.profileid;
                } else if(sub_key_name == "subaccount" || sub_key_name == "nick") {
                    catigory_data[sub_key_name] = data.nick;
                } else {
                    catigory_data[sub_key_name] = data.data[sub_key_name];
                }
            }
            var pageKey = "player_info_" + key_name;
            var p = new Promise(function(resolve, reject) {
                this.playerRecordModel.fetch({pageKey, gameid: this.options.gameid, profileid: data.profileid}).then(function(save_data, original_data, page_name, progress) {
                    progress = progress || {};
                    progress.pageKey = page_name;
                    progress.profileid = original_data.profileid;
                    progress.gameid = this.options.gameid;
                    progress.modified = Date.now();
                    progress.data = save_data;
                    this.playerRecordModel.insertOrUpdate(progress).then(resolve, reject);
                }.bind(this, catigory_data, data, pageKey));
            }.bind(this));
            promises.push(p);
        }
        Promise.all(promises).then(resolve, reject);
    }.bind(this));
}
module.exports = PlayerInfoProcessor;