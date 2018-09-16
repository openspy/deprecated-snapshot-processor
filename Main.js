var DbCtx = new (require('./lib/DbCtx.js'))();
var THPSProcessor = require('./Processor/THPS');

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
/*
		
*/
    //				 	 Level_BO	Level_AU	Level_BA	Level_BE	Level_NO	Level_ST	Level_SE	Level_SE2	Level_TR	Level_LA	Level_SC	Level_PH	Level_DJ	Level_CA	Level_AP
    var int_map_crcs = [ -731335653, 36118178, 869308700, 884825349, 232021735, 1734639125, -1519529707, -1409913579, -1387023214, -1912087776,  855134571, -229054702, 717989981, 1917708845];
    //					  nettrickattack	netgraffiti netscorechallenge	netcombomambo	netslap		netking		netgoalattack netctf	  netfirefight
    var gametype_crcs = [ 818085795,		1580115212, 345515018, 		-989134896,		-103425741, 1861811616, -333443414,   1818227302, -1074579968 ];

    var Processor = new THPSProcessor(ctx, database, {gameid: 917, rating_bounds: {min: 0, max: 3500}, game_crcs: gametype_crcs, map_crcs: int_map_crcs, recent_timerange: 2419200000, leaderboard_limit: 20, persistStorageRatingKey: "THUG2Rating", persistStorageHighScoreKey: "THUG2HighScore", persistStorageHighComboKey: "THUG2HighCombo" });

    Processors.push(Processor);
}


function setupTHPS6PCProcessor(ctx, database) {
/*
		
*/
    //				 	 Level_BO	Level_AU	Level_BA	Level_BE	Level_NO	Level_ST	Level_SE	Level_SE2	Level_TR	Level_LA	Level_SC	Level_PH	Level_DJ	Level_CA	Level_AP
    var int_map_crcs = [ -731335653, 36118178, 869308700, 884825349, 232021735, 1734639125, -1519529707, -1409913579, -1387023214, -1912087776,  855134571, -229054702, 717989981, 1917708845];
    //					  nettrickattack	netgraffiti netscorechallenge	netcombomambo	netslap		netking		netgoalattack netctf	  netfirefight
    var gametype_crcs = [ 818085795,		1580115212, 345515018, 		-989134896,		-103425741, 1861811616, -333443414,   1818227302, -1074579968 ];

    var Processor = new THPSProcessor(ctx, database, {gameid: 1003, rating_bounds: {min: 0, max: 3500}, game_crcs: gametype_crcs, map_crcs: int_map_crcs, recent_timerange: 2419200000, leaderboard_limit: 20, persistStorageRatingKey: "THUG2Rating", persistStorageHighScoreKey: "THUG2HighScore", persistStorageHighComboKey: "THUG2HighCombo" });

    Processors.push(Processor);
}

DbCtx.getDatabaseCtx().then(function(ctx) {
    var database = ctx.db('gamestats');
    setupTHPS5PS2Processor(ctx,database);
	setupTHPS5PCProcessor(ctx, database);
	setupTHPS6PS2Processor(ctx,database);
	setupTHPS6PCProcessor(ctx, database);
	var promises = [];
    for(var i of Processors) {
		promises(i.performAllCalculations());
    }
});