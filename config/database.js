const  mysql = require('mysql');
const settings = require('./db');
let db;

function connectDatabase() {
    if(!db){
        db = mysql.createConnection(settings);

        db.connect(function(err) {
            if(!err){
                console.log('MySQL Database connected.');
            } else {
                console.log(err);
            }
        })
    }
    return db;
}

/**
 * This gets a races results in order
 * @param id
 * @param res
 * @param callback
 */
function getRaceResultsOrder(id, res, callback) {
    db.query('SELECT raceDivision, `position`, paddler.name, club.clubcode , paddler.class ,paddler.division, ' +
        '`time`,`points`,`pd`,`outcome` FROM `raceresults`, `paddler`, `club` ' +
        'WHERE raceID = ? AND paddler.paddlerID = raceresults.paddlerID AND paddler.clubID = club.clubID ' +
        ' ORDER BY raceresults.raceDivision, case when raceresults.position regexp \'^[0-9]\' then 1 ' +
        'when raceresults.position regexp \'^[a-zA-Z]\' then 2 end , raceresults.position + 0 ASC', [id],
        function(err, rows) {
            if (err) {
                callback(error(err));
            }else {
                callback(success(rows));
            }
        });
}

function getRaceResults(id, res, callback) {
    db.query('SELECT * FROM raceresults WHERE raceID = ?', [id],
        function(err, rows) {
            if (err) {
                callback(error(err));
            }else {
                callback(success(rows));
            }
        });
}

function getRace(id, res, callback) {
    db.query('SELECT * FROM race WHERE raceID = ?', [id],
        function(err, rows) {
            if (err) {
                callback(error(err));
            }else {
                callback(success(rows));
            }
        });
}

function getPaddler(id, res, callback) {
    db.query('SELECT * FROM paddler WHERE paddlerID = ?', [id],
        function(err, rows) {
            if (err) {
                callback(error(err));
            }else {
                callback(success(rows));
            }
        });
}

function getClub(id, res, callback) {
    db.query('SELECT * FROM club WHERE clubID = ?', [id],
        function(err, rows) {
            if (err) {
                callback(error(err));
            }else {
                callback(success(rows));
            }
        });
}

function getRaces(year, region, process, res, callback) {
	let query = "SELECT * FROM race";

	if(year && region){
        query += " WHERE year = " + db.escape(year) + " AND regionID = " + db.escape(region);
	} else if (year){
        query += " WHERE year = " + db.escape(year);
    } else if (region) {
        query += " WHERE regionID = " + db.escape(region);
    } else {
        if(process != null) {
            query += " WHERE processed = " + db.escape(process);
        }
    }

    if(!query.includes("processed") && process != null){
        query += " AND processed = " + db.escape(process);
    }

    db.query(query,
        function(err, rows) {
            if (err) {
                callback(error(err));
            } else {
                callback(success(rows));
            }
        });
}

function getPaddlers(club, res, callback) {
    let query = 'SELECT * FROM paddler';
    if(club !== ""){
        query += " WHERE clubID = " + db.escape(club);
    }
    db.query(query,
        function(err, rows) {
            if (err) {
                callback(error(err));
            } else {
                callback(success(rows));
            }
        });
}

function getClubs(res, callback) {
    db.query('SELECT * FROM club',
        function(err, rows) {
            if (err) {
                callback(error(err));
            } else {
                callback(success(rows));
            }
        });
}

function getClubPaddlers(id, res, callback) {
    db.query('SELECT * FROM paddler WHERE clubID = ? ', [id] ,
        function(err, rows) {
            if (err) {
                callback(error(err));
            } else {
                callback(success(rows));
            }
        });
}

function getPaddlerStats(id, res, callback) {
    db.query('SELECT SUM(IF(paddlerID = ?, 1, 0)) as racesEntered,\n' +
        '           SUM(IF(paddlerID = ? AND (outcome = "DNF" OR outcome = "RTD"), 1, 0)) as retirements,\n' +
        '           SUM(IF(paddlerID = ? AND outcome = "DNS", 1, 0)) as notStart,\n' +
        '           SUM(IF(paddlerID = ? AND position = "1", 1, 0)) as first,\n' +
        '           SUM(IF(paddlerID = ? AND position = "2", 1, 0)) as second,\n' +
        '           SUM(IF(paddlerID = ? AND position = "3", 1, 0)) as third,\n' +
        '           SUM(IF(paddlerID = ? AND outcome = "Unknown", 1, 0)) as unknown\n' +
        'FROM raceresults', [id, id, id, id, id, id ,id] ,
        function(err, rows) {
            if (err) {
                callback(error(err));
            } else {
                callback(success(rows));
            }
        });
}

function getPaddlerRaces(id, res, callback) {
    db.query('SELECT * FROM raceresults WHERE paddlerID = ? ', [id] ,
        function(err, rows) {
            if (err) {
                callback(error(err));
            } else {
                callback(success(rows));
            }
        });
}

function getDistinctYears(res, callback) {
	db.query('SELECT DISTINCT year FROM race',
        function(err, rows) {
            if (err) {
                callback(error(err));
            } else {
                callback(success(rows));
            }
        });	
}


function getUserByEmail(email, res, callback) {
    db.query('SELECT * FROM user WHERE email = ?', [email], function(err, rows) {
        if (err) {
            callback(error(err));
        }else {
            callback(success(rows));
        }
    });
}

function checkClubPassword(password, res, callback){
    db.query('SELECT * FROM club WHERE clubPassword = ?', [password], function(err, rows) {
        if(err){
            callback(error(err));
        } else {
            callback(success(rows));
        }
    })
}

function registerUser(user, res, callback){
    db.query('' +
        'INSERT INTO user (name, email, password, clubID, account) ' +
        'VALUES (?, ?, ?, ?, ?)', [user.name, user.email, user.hash, user.clubID, user.is_raceorganiser],
        function(err, rows) {
            if(err){
                callback(error(err));
            } else {
                callback(success(rows));
            }
        }
    )
}

function getSearch(term, res, callback) {
    db.query('SELECT name, paddlerID FROM paddler WHERE name LIKE "'+term+'%"', function(err, rows, fields) {
		console.log(rows);
        if (err) {
            callback(error(err));
        }else {
            callback(success(rows));
        }
    });
}

function insertRace(race, res, callback) {
    db.query('INSERT INTO race (raceName, year, date, regionID, clubID) ' +
        'VALUES (?, ?, ?, ?, ?)', [race.raceName, race.year, race.date, race.regionID, race.clubID],
        function(err, rows){
            if(err){
                callback(error(err));
            } else {
                callback(success(rows));
            }
        }
    )
}

function getRegions(res, callback) {
    db.query('SELECT * FROM region',
        function(err, rows) {
            if(err){
                callback(error(err));
            } else {
                callback(success(rows));
            }
        }
    )
}

function isOrganiser(id, res, callback) {
    db.query('SELECT account FROM user WHERE userID = ?', [id],
        function(err, rows) {
            if(err){
                callback(error(err));
            } else {
                callback(success(rows));
            }
        }
    )
}

function getClubRaces(id, res, callback) {
    db.query('SELECT * FROM race WHERE clubID = ?', [id],
        function(err, rows){
            if(err){
                callback(error(err))
            } else {
                callback(success(rows));
            }
        }
    )
}

/**
 * Not sure what this does yet
 * @param raceID
 * @param res
 * @param callback
 */
function getEntryCount(raceID, res, callback) {
    db.query('SELECT COUNT(*) AS entry FROM raceresults WHERE raceID = ? AND position = ""', [raceID],
        function (err, rows) {
            if (err) {
                callback(error(err));
            } else {
                callback(success(rows));
            }
        }
    )
}


function success(data){
    return JSON.stringify({"status": 200, "error": null, "response": data});
}

function error(error){
    return JSON.stringify({"status": 500, "error": error, "response": null})
}

module.exports = {
    connectDatabase: connectDatabase,
    getRaceResultsOrder: getRaceResultsOrder,
    getRaceResults: getRaceResults,
    getPaddler: getPaddler,
    getClub: getClub,
    getRaces: getRaces,
    getPaddlers: getPaddlers,
    getClubs: getClubs,
    getClubPaddlers: getClubPaddlers,
    getPaddlerStats: getPaddlerStats,
    getPaddlerRaces: getPaddlerRaces,
	getRace : getRace,
	getDistinctYears : getDistinctYears,
    getUserByEmail : getUserByEmail,
    checkClubPassword : checkClubPassword,
	registerUser : registerUser,
	getSearch : getSearch,
    insertRace : insertRace,
    getRegions : getRegions,
    getEntryCount : getEntryCount,
    isOrganiser : isOrganiser,
    getClubRaces : getClubRaces

};