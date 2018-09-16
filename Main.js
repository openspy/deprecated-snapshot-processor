var DbCtx = new (require('./lib/DbCtx.js'))();
var THPSProcessor = require('./Processor/THPS');

//				 	 Load_NJ	 Load_NY	 Load_FL Load_SD	 Load_HI	 Load_VC	Load_SJ	   Load_RU	   Load_SE	    Load_VN	  	Load_HN		Load_SC2	
var int_map_crcs = [ -154656044, 1920361226, -680391191, -300129329, 966513896, 219087401, 161763016, -1648921988, -1726262439, 1941864084, -1476443829, -1935473659 ];
//					  nettrickattack	netgraffiti netscorechallenge	netcombomambo	netslap		netking		netgoalattack netctf	  netfirefight
var gametype_crcs = [ 818085795,		1580115212, 345515018, 		-989134896,		-103425741, 1861811616, -333443414,   1818227302, -1074579968 ];



DbCtx.getDatabaseCtx().then(function(ctx) {
    var database = ctx.db('gamestats');
    var THPS5PS2Processor = new THPSProcessor(ctx, database, {gameid: 706, rating_bounds: {min: 0, max: 3500}, game_crcs: gametype_crcs, map_crcs: int_map_crcs, recent_timerange: 2419200000, leaderboard_limit: 20 });
    THPS5PS2Processor.calculateLeaderboard();
    /*SnapshotModel.getUnprocessedSnapshots({gameid: 706}).then(function(snapshots) {
        return THPS5PS2Processor.processSnapshots(snapshots).then(function() {
            return SnapshotModel.markSnapshotsProcessed(snapshots);
        });
    });*/
});