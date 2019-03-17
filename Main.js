var DbCtx = new (require('./lib/DbCtx.js'))();
var THPSProcessor = require('./Processor/THPS');
var BF2142Processor = require('./Processor/BF2142');
global.API_KEY = process.env.API_KEY;
global.API_ENDPOINT = process.env.API_ENDPOINT;

var Processors = [];

function setupTHPS5PS2Processor(ctx, database) {

    //				 	 Load_NJ	 Load_NY	 Load_FL Load_SD	 Load_HI	 Load_VC	Load_SJ	   Load_RU	   Load_SE	    Load_VN	  	Load_HN		Load_SC2	
    var int_map_crcs = [ -154656044, 1920361226, -680391191, -300129329, 966513896, 219087401, 161763016, -1648921988, -1726262439, 1941864084, -1476443829, -1935473659 ];
    //					  nettrickattack	netgraffiti netscorechallenge	netcombomambo	netslap		netking		netgoalattack netctf	  netfirefight
    var gametype_crcs = [ 818085795,		1580115212, 345515018, 		-989134896,		-103425741, 1861811616, -333443414,   1818227302, -1074579968 ];

    var Processor = new THPSProcessor(ctx, database, {gameid: 706, rating_bounds: {min: 0, max: 3000}, game_crcs: gametype_crcs, map_crcs: int_map_crcs, recent_timerange: 2419200000, leaderboard_limit: 20, persistStorageRatingKey: "Rating", persistStorageHighScoreKey: "HighScore", persistStorageHighComboKey: "HighCombo" });

    Processors.push(Processor);
}

function setupTHPS5PCProcessor(ctx, database) {

    //				 	 Load_NJ	 Load_NY	 Load_FL Load_SD	 Load_HI	 Load_VC	Load_SJ	   Load_RU	   Load_SE	    Load_VN	  	Load_HN		Load_SC2	
    var int_map_crcs = [ -154656044, 1920361226, -680391191, -300129329, 966513896, 219087401, 161763016, -1648921988, -1726262439, 1941864084, -1476443829, -1935473659 ];
    //					  nettrickattack	netgraffiti netscorechallenge	netco mbomambo	netslap		netking		netgoalattack netctf	  netfirefight
    var gametype_crcs = [ 818085795,		1580115212, 345515018, 		-989134896,		-103425741, 1861811616, -333443414,   1818227302, -1074579968 ];

    var Processor = new THPSProcessor(ctx, database, {gameid: 1005, rating_bounds: {min: 0, max: 3000}, game_crcs: gametype_crcs, map_crcs: int_map_crcs, recent_timerange: 2419200000, leaderboard_limit: 20, persistStorageRatingKey: "Rating", persistStorageHighScoreKey: "HighScore", persistStorageHighComboKey: "HighCombo" });

    Processors.push(Processor);
}

function setupTHPS6PS2Processor(ctx, database) {
    //  Load_TR Load_BO Load_BA Load_BE Load_AU Load_NO Load_SE Load_SE2    Load_SC Load_PH Load_DJ Load_LA Load_CA Load_AP
    var int_map_crcs = [ 1435058265, 706189655, -844123056, -893226935, -61328402, -2036148645, -1726262439, -621173885, 1886975596, -863536089, 203934302, 1395431902,  -726366959, -1942829215];
    //					  nettrickattack	netgraffiti netscorechallenge	netcombomambo	netslap		netking		netgoalattack netctf	  netfirefight
    var gametype_crcs = [ 818085795,		1580115212, 345515018, 		-989134896,		-103425741, 1861811616, -333443414,   1818227302, -1074579968 ];

    var Processor = new THPSProcessor(ctx, database, {gameid: 917, rating_bounds: {min: 0, max: 3500}, game_crcs: gametype_crcs, map_crcs: int_map_crcs, recent_timerange: 2419200000, leaderboard_limit: 20, persistStorageRatingKey: "THUG2Rating", persistStorageHighScoreKey: "THUG2HighScore", persistStorageHighComboKey: "THUG2HighCombo" });

    Processors.push(Processor);
}


function setupTHPS6PCProcessor(ctx, database) {
    //  Load_TR Load_BO Load_BA Load_BE Load_AU Load_NO Load_SE Load_SE2    Load_SC Load_PH Load_DJ Load_LA Load_CA Load_AP
    var int_map_crcs = [ 1435058265, 706189655, -844123056, -893226935, -61328402, -2036148645, -1726262439, -621173885, 1886975596, -863536089, 203934302, 1395431902,  -726366959, -1942829215];
    //					  nettrickattack	netgraffiti netscorechallenge	netcombomambo	netslap		netking		netgoalattack netctf	  netfirefight
    var gametype_crcs = [ 818085795,		1580115212, 345515018, 		-989134896,		-103425741, 1861811616, -333443414,   1818227302, -1074579968 ];

    var Processor = new THPSProcessor(ctx, database, {gameid: 1003, rating_bounds: {min: 0, max: 3500}, game_crcs: gametype_crcs, map_crcs: int_map_crcs, recent_timerange: 2419200000, leaderboard_limit: 20, persistStorageRatingKey: "THUG2Rating", persistStorageHighScoreKey: "THUG2HighScore", persistStorageHighComboKey: "THUG2HighCombo" });

    Processors.push(Processor);
}
function setupBF2142Processor(ctx, database) {
    var scoreSettings = [
        {rank: 1, minScore: 40},
        {rank: 2, minScore: 80},
        {rank: 3, minScore: 120},
        {rank: 4, minScore: 200},
        {rank: 5, minScore: 330},
        {rank: 6, minScore: 520},
        {rank: 7, minScore: 750},
        {rank: 8, minScore: 1050},
        {rank: 9, minScore: 1400},
        {rank: 10, minScore: 1800},
        {rank: 11, minScore: 2250},
        {rank: 12, minScore: 2850},
        {rank: 13, minScore: 3550},
        {rank: 14, minScore: 4400},
        {rank: 15, minScore: 5300},
        {rank: 16, minScore: 6250},
        {rank: 17, minScore: 7250},
        {rank: 18, minScore: 8250},
        {rank: 19, minScore: 9300},
        {rank: 20, minScore: 10400},
        {rank: 21, minScore: 11550},
        {rank: 22, minScore: 12700},
        {rank: 23, minScore: 14000},
        {rank: 24, minScore: 15300},
        {rank: 25, minScore: 16700},
        {rank: 26, minScore: 18300},
        {rank: 27, minScore: 20100},
        {rank: 28, minScore: 22100},
        {rank: 29, minScore: 24200},
        {rank: 30, minScore: 26400},
        {rank: 31, minScore: 28800},
        {rank: 32, minScore: 31500},
        {rank: 33, minScore: 34200},
        {rank: 34, minScore: 37100},
        {rank: 35, minScore: 40200},
        {rank: 36, minScore: 43300},
        {rank: 37, minScore: 46900},
        {rank: 38, minScore: 50500},
        {rank: 39, minScore: 54100},
        {rank: 40, minScore: 57700},
        {rank: 41, minScore: 1000000},
        {rank: 42, minScore: 0},
        {rank: 43, minScore: 0},
    ];
    var awardSettings = [
        {awardKey: "100_1", rules: ["9,23,ktt-3,54000", "6,1, ,20", "6,168, ,"]},
        {awardKey: "100_2", rules: ["6,1, ,20", "9,23,ktt-3,54000"]},
        {awardKey: "100_3", rules: ["6,1, ,30", "9,23,ktt-3,180000"]},
        {awardKey: "101_1", rules: ["6,2, ,12"]},
        {awardKey: "101_2", rules: ["6,2, ,20", "9,20,ktt-0,54000"]},
        {awardKey: "101_3", rules: ["6,2, ,30", "9,20,ktt-0,180000"]},
        {awardKey: "102_1", rules: ["6,3, ,12"]},
        {awardKey: "102_2", rules: ["6,3, ,20", "9,21,ktt-1,54000"]},
        {awardKey: "102_3", rules: ["6,3, ,30", "9,21,ktt-1,180000"]},
        {awardKey: "103_1", rules: ["6,4, ,12"]},
        {awardKey: "103_2", rules: ["6,4, ,20", "9,22,ktt-2,54000"]},
        {awardKey: "103_3", rules: ["6,4, ,30", "9,22,ktt-2,180000"]},
        {awardKey: "104_1", rules: ["6,50, ,10"]},
        {awardKey: "104_2", rules: ["6,50, ,20", "1,113,slpts,300"]},
        {awardKey: "104_3", rules: ["6,50, ,30", "1,113,slpts,600"]},
        {awardKey: "105_1", rules: ["6,5, ,7"]},
        {awardKey: "105_2", rules: ["6,5, ,10", "1,5,wkls-12,50"]},
        {awardKey: "105_3", rules: ["6,5, ,17", "1,5,wkls-12,150"]},
        {awardKey: "106_1", rules: ["6,7, ,5"]},
        {awardKey: "106_2", rules: ["6,7, ,7", "1,7,wkls-5;wkls-11,50"]},
        {awardKey: "106_3", rules: ["6,7, ,18", "1,7,wkls-5;wkls-11,300"]},
        {awardKey: "107_1", rules: ["6,8, ,10"]},
        {awardKey: "107_2", rules: ["6,8, ,15", "1,8,klse,50"]},
        {awardKey: "107_3", rules: ["6,8, ,20", "1,8,klse,300"]},
        {awardKey: "108_1", rules: ["10,18, ,180"]},
        {awardKey: "108_2", rules: ["6,9, ,15", "9,148,vtp-12;vtp-3;wtp-30,72000"]},
        {awardKey: "108_3", rules: ["6,9, ,30", "9,148,vtp-12;vtp-3;wtp-30,180000"]},
        {awardKey: "109_1", rules: ["6,40, ,30"]},
        {awardKey: "109_2", rules: ["10,150, ,1200", "1,40,csgpm-0,1000"]},
        {awardKey: "109_3", rules: ["10,150, ,1500", "1,40,csgpm-0,4000"]},
        {awardKey: "110_1", rules: ["6,39, ,30"]},
        {awardKey: "110_2", rules: ["10,149, ,1200", "1,39,csgpm-1,1000"]},
        {awardKey: "110_3", rules: ["10,149, ,1500", "1,39,csgpm-1,4000"]},
        {awardKey: "111_1", rules: ["6,42, ,8"]},
        {awardKey: "111_2", rules: ["6,42, ,10", "9,128,etpk-1,36000"]},
        {awardKey: "111_3", rules: ["6,42, ,15", "9,128,etpk-1,216000", "1,42,rps,200"]},
        {awardKey: "112_1", rules: ["6,43, ,8"]},
        {awardKey: "112_2", rules: ["6,43, ,10", "9,129,etpk-5,36000"]},
        {awardKey: "112_3", rules: ["6,43, ,15", "9,129,etpk-5,216000", "1,43,hls,400"]},
        {awardKey: "113_1", rules: ["6,45, ,8"]},
        {awardKey: "113_2", rules: ["6,45, ,10", "9,130,etpk-6,36000"]},
        {awardKey: "113_3", rules: ["6,45, ,15", "9,130,etpk-6,180000", "1,45,resp,400"]},
        {awardKey: "114_1", rules: ["10,141, ,900"]},
        {awardKey: "114_2", rules: ["6,11, ,15", "9,114,atp,90000"]},
        {awardKey: "114_3", rules: ["6,11, ,35", "9,114,atp,180000"]},
        {awardKey: "115_1", rules: ["10,142, ,900"]},
        {awardKey: "115_2", rules: ["6,12, ,15", "9,25,vtp-10;vtp-4,90000"]},
        {awardKey: "115_3", rules: ["6,12, ,35", "9,25,vtp-10;vtp-4,180000"]},
        {awardKey: "116_1", rules: ["10,151, ,600"]},
        {awardKey: "116_2", rules: ["6,116, ,5", "9,115,vtp-1;vtp-4;vtp-6,90000"]},
        {awardKey: "116_3", rules: ["6,116, ,12", "9,115,vtp-1;vtp-4;vtp-6,144000"]},
        {awardKey: "117_1", rules: ["6,46, ,8"]},
        {awardKey: "117_2", rules: ["6,46, ,15", "9,27,tgpm-1,108000"]},
        {awardKey: "117_3", rules: ["6,46, ,30", "9,27,tgpm-1,216000"]},
        {awardKey: "118_1", rules: ["6,47, ,8"]},
        {awardKey: "118_2", rules: ["6,47, ,15", "9,27,tgpm-1,108000"]},
        {awardKey: "118_3", rules: ["6,47, ,30", "9,27,tgpm-1,216000"]},
        {awardKey: "119_1", rules: ["6,48, ,2"]},
        {awardKey: "119_2", rules: ["6,49, ,1", "1,48,tcd,10"]},
        {awardKey: "119_3", rules: ["6,48, ,3", "6,49, ,1", "1,48,tcd,40"]},
        {awardKey: "200", rules: ["6,127, ,"]},
        {awardKey: "201", rules: ["6,126, ,"]},
        {awardKey: "202", rules: ["6,125, ,"]},
        {awardKey: "203", rules: ["6,41, ,30", "9,19,tac,180000", "9,28,tasl,180000", "9,29,tasm,180000"]},
        {awardKey: "204", rules: ["6,59, ,1", "5,62,100_1,1", "5,63,101_1,1", "5,64,102_1,1", "5,65,103_1,1", "5,66,105_1,1", "5,67,106_1,1", "5,68,107_1,1"]},
        {awardKey: "205", rules: ["6,59, ,1", "5,69,100_2,1", "5,70,101_2,1", "5,71,102_2,1", "5,72,103_2,1", "5,73,105_2,1", "5,74,106_2,1", "5,75,107_2,1"]},
        {awardKey: "206", rules: ["6,59, ,1", "5,76,100_3,1", "5,77,101_3,1", "5,78,102_3,1", "5,79,103_3,1", "5,80,105_3,1", "5,81,106_3,1", "5,82,107_3,1"]},
        {awardKey: "207", rules: ["11,30,tt,540000", "3,51,cpt,1000", "3,52,dcpt,400", "3,41,twsc,5000"]},
        {awardKey: "208", rules: ["10,145, ,180", "11,31,attp-0,540000", "1,54,awin-0,300"]},
        {awardKey: "209", rules: ["10,146, ,180", "11,32,attp-1,540000", "1,55,awin-1,300"]},
        {awardKey: "210", rules: ["6,60, ,1", "11,26,tgpm-0,288000", "1,13,kgpm-0,8000", "1,15,bksgpm-0,25"]},
        {awardKey: "211", rules: ["6,61, ,1", "11,27,tgpm-1,288000", "1,14,kgpm-1,8000", "1,16,bksgpm-1,25"]},
        {awardKey: "212", rules: ["6,12, ,30", "9,25,vtp-10;vtp-4,360000", "1,12,vkls-10;vkls-4,8000"]},
        {awardKey: "213", rules: ["6,11, ,25", "9,24,vtp-0;vtp-1;vtp-2,360000", "1,11,vkls-0;vkls-1;vkls-2,8000"]},
        {awardKey: "214", rules: ["6,17, ,27", "6,83, ,0", "9,30,tt,648000"]},
        {awardKey: "215", rules: ["11,30,tt,360000", "3,43,hls,400", "3,42,rps,400", "3,45,resp,400"]},
        {awardKey: "216", rules: ["6,85, ,0.25"]},
        {awardKey: "217", rules: ["6,86, ,10", "9,33,vtp-4,90000"]},
        {awardKey: "218", rules: ["6,14, ,10", "11,27,tgpm-1,540000", "1,133,mbr-1-0;mbr-1-1;mbr-1-2;mbr-1-3;mbr-1-5;mbr-1-10;mbr-1-12,70"]},
        {awardKey: "219", rules: ["6,17, ,20", "1,51,cpt,100", "1,42,rps,70"]},
        {awardKey: "300", rules: ["10,18, ,300", "6,9, ,15"]},
        {awardKey: "301", rules: ["10,142, ,600", "6,12, ,20"]},
        {awardKey: "302", rules: ["6,120, ,10"]},
        {awardKey: "303", rules: ["10,143, ,1200", "9,28,tasl,144000"]},
        {awardKey: "304", rules: ["10,38, ,1200", "6,34, ,40", "9,19,tac,288000"]},
        {awardKey: "305", rules: ["6,41, ,15", "9,29,tasm,36000", "9,28,tasl,36000", "9,19,tac,36000"]},
        {awardKey: "306", rules: ["10,144, ,1080", "6,41, ,40", "9,29,tasm,72000"]},
        {awardKey: "307", rules: ["6,41, ,55", "9,29,tasm,90000", "9,28,tasl,180000"]},
        {awardKey: "308", rules: ["6,34, ,45", "9,19,tac,216000", "5,87,wlr,2"]},
        {awardKey: "309", rules: ["10,141, ,1200", "6,11, ,20"]},
        {awardKey: "310", rules: ["6,110, ,10", "9,121,vtp-0;vtp-1;vtp-2;vtp-6,36000"]},
        {awardKey: "311", rules: ["9,99,mtt-0-0;mtt-1-0,0", "9,101,mtt-0-2;mtt-1-2,0", "9,103,mtt-0-4,0", "9,104,mtt-0-5;mtt-1-5,0", "9,108,mtt-0-9,0", "9,32,attp-1,432000"]},
        {awardKey: "312", rules: ["9,100,mtt-0-1;mtt-1-1,0", "9,102,mtt-0-3;mtt-1-3,0", "9,105,mtt-0-6,0", "9,106,mtt-0-7,0", "9,107,mtt-0-8,0", "9,31,attp-0,432000"]},
        {awardKey: "313", rules: ["6,17, ,20", "1,88,bksgpm-0;bksgpm-1,10"]},
        {awardKey: "314", rules: ["6,17, ,10", "6,83, ,", "11,30,tt,180000"]},
        {awardKey: "315", rules: ["6,17, ,10", "11,30,tt,432000", "1,88,bksgpm-0;bksgpm-1,10"]},
        {awardKey: "316", rules: ["3,10,vkls-7,200"]},
        {awardKey: "317", rules: ["6,86, ,15", "9,33,vtp-4,90000"]},
        {awardKey: "318", rules: ["6,138, ,15", "9,137,vtp-12,36000"]},
        {awardKey: "319", rules: ["6,39, ,10", "11,36,ctgpm-1,90000"]},
        {awardKey: "400", rules: ["6,89, ,5"]},
        {awardKey: "401", rules: ["6,89, ,10"]},
        {awardKey: "402", rules: ["6,48, ,4"]},
        {awardKey: "403", rules: ["6,109, ,4"]},
        {awardKey: "404", rules: ["6,86, ,10"]},
        {awardKey: "406", rules: ["6,47, ,7"]},
        {awardKey: "407", rules: ["6,139, ,5"]},
        {awardKey: "408", rules: ["6,110, ,5"]},
        {awardKey: "409", rules: ["6,93, ,8"]},
        {awardKey: "410", rules: ["6,8, ,8"]},
        {awardKey: "411", rules: ["6,44, ,8"]},
        {awardKey: "412", rules: ["6,124, ,"]},
        {awardKey: "413", rules: ["6,7, ,4"]},
        {awardKey: "414", rules: ["6,9, ,10"]},
        {awardKey: "415", rules: ["6,6, ,10"]},
        {awardKey: "120_1", rules: ["6,152, ,6"]},
        {awardKey: "120_2", rules: ["6,152, ,10", "9,153,mtt-1-10;mtt-2-10;mtt-2-11;mtt-1-12;mtt-2-12,7200"]},
        {awardKey: "120_3", rules: ["6,152, ,14", "9,153,mtt-1-10;mtt-2-10;mtt-2-11;mtt-1-12;mtt-2-12,18000"]},
        {awardKey: "121_1", rules: ["10,154, ,300"]},
        {awardKey: "121_2", rules: ["6,156, ,8", "9,155,vtp-14;vtp-15,3600"]},
        {awardKey: "121_3", rules: ["6,156, ,12", "9,155,vtp-14;vtp-15,14400"]},
        {awardKey: "320", rules: ["6,157, ,5", "5,158,vkls-15,40"]},
        {awardKey: "321", rules: ["6,152, ,15", "5,159,mwin-1-12;mwin-2-12,2", "5,160,mwin-1-10;mwin-2-10,2", "5,161,mwin-2-11,2"]},
        {awardKey: "322", rules: ["6,162, ,9", "9,163,vtp-14,7200"]},
        {awardKey: "323", rules: ["7,164,vdstry-15,4", "7,165,vdstry-14,2", "7,166,vdths-15,5", "7,167,vdths-14,5"]},
        {awardKey: "416", rules: ["6,168, ,"]}
    ];
    var NUM_VEHICLES = 16;
    var NUM_WEAPONS = 49;
    Processors.push(new BF2142Processor(ctx, database, {gameid: 1324, scoreSettings, awardSettings, NUM_VEHICLES, NUM_WEAPONS}));
}
async function doPlayerProgressDebug(ctx, database) {
    var scoreSettings = [
        {rank: 1, minScore: 40}
    ];
    var awardSettings = [
        {awardKey: "100_1", rules: ["9,23,ktt-3,54000", "6,1, ,20", "6,168, ,"]}
    ];

    var processor = new BF2142Processor(ctx, database, {gameid: 1324, scoreSettings, awardSettings})
    /*
                nearest.globalscore += gsco;
            nearest.points += (gsco + experiencepoints);
            nearest.experiencepoints += experiencepoints;
     */

    await processor.snapshotProcessor.playerRecordProcessor.playerProgressProcessor.processSnapshot({hostname: "hello", mapend: "1572021200"}, {gsco: 100, pid: 123, crpt: 12});
    await processor.snapshotProcessor.playerRecordProcessor.playerProgressProcessor.processSnapshot({hostname: "hello", mapend: "1572021200"}, {gsco: 666, pid: 123, crpt: 12});
    await processor.snapshotProcessor.playerRecordProcessor.playerProgressProcessor.processSnapshot({hostname: "hello", mapend: "1572021200"}, {gsco: 11, pid: 123, crpt: 12});
    //await processor.snapshotProcessor.playerRecordProcessor.playerProgressProcessor.processSnapshot({hostname: "hello", mapend: "1573321300"}, {gsco: 100, pid: 123, crpt: 12});
}
DbCtx.getDatabaseCtx().then(async function(ctx) {
    var database = ctx.db('gamestats');
    //setupTHPS5PS2Processor(ctx,database);
	//setupTHPS5PCProcessor(ctx, database);
	//setupTHPS6PS2Processor(ctx,database);
    //setupTHPS6PCProcessor(ctx, database);
    setupBF2142Processor(ctx, database);
    //await doPlayerProgressDebug(ctx, database);
    //process.exit(1);
    //return;
	var promises = [];
    for(var i of Processors) {
		promises.push(i.performAllCalculations());
    }
    Promise.all(promises).then(function() {
        process.exit(1);
    })
    
});