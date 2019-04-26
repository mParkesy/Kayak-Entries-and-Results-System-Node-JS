const  mysql = require('mysql');
const settings = require('./db');
let db;

function connectDatabase() {
    if(!db){
        db = mysql.createPool(settings);

        db.getConnection(function(err) {
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
    db.query('SELECT boatresult.boatname, boatresult.raceDivision, boatresult.position, paddler.name, club.clubcode , paddler.class ,paddler.division,'
        + ' boatresult.time, boatresult.points ,boatresult.pd,boatresult.outcome '
        + ' FROM '
        + '	boatresult, paddler, club, paddlerboat'
        + ' WHERE '
        + '	boatresult.boatID = paddlerboat.boatID '
        + ' AND boatresult.raceID = ? AND paddler.paddlerID = paddlerboat.paddlerID AND paddler.clubID = club.clubID '
        + ' ORDER BY boatresult.raceDivision, case when boatresult.position regexp \'^[0-9]\' then 1 '
        + ' WHEN boatresult.position regexp \'^[a-zA-Z]\' then 2 end , boatresult.position + 0 ASC', [id],
        function(err, rows) {
            if (err) {
                callback(error(err));
            }else {
                callback(success(rows));
            }
        });
}

function getRaceResults(id, res, callback) {
    db.query('SELECT\n' +
        '    boatresult.boatname,\n' +
        '    boatresult.raceDivision,\n' +
        '    boatresult.position,\n' +
        '    paddler.name,\n' +
        '    club.clubcode,\n' +
        '    paddler.class,\n' +
        '    paddler.division,\n' +
        '    boatresult.time,\n' +
        '    boatresult.points,\n' +
        '    boatresult.pd,\n' +
        '    boatresult.outcome\n' +
        'FROM\n' +
        '    boatresult,\n' +
        '    paddler,\n' +
        '    club,\n' +
        '    paddlerboat\n' +
        'WHERE\n' +
        '    boatresult.boatID = paddlerboat.boatID AND boatresult.raceID = ? AND paddler.paddlerID = paddlerboat.paddlerID AND paddler.clubID = club.clubID\n' +
        'ORDER BY\n' +
        '    boatresult.raceDivision,\n' +
        '    boatresult.boatname,\n' +
        '    boatresult.position + 0 ASC', [id],
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
    db.query('SELECT *, (SELECT COUNT(*) FROM paddlerboat WHERE paddlerboat.paddlerID = paddler.paddlerID) as numEntries ' +
        'FROM paddler WHERE clubID = ? ORDER BY `numEntries` DESC ', [id] ,
        function(err, rows) {
            if (err) {
                callback(error(err));
            } else {
                callback(success(rows));
            }
        });
}

function getPaddlerStats(id, res, callback) {
    /*
        SELECT SUM(IF(paddlerID = ?, 1, 0)) as racesEntered,\n' +
        '           SUM(IF(paddlerID = ? AND (outcome = "DNF" OR outcome = "RTD"), 1, 0)) as retirements,\n' +
        '           SUM(IF(paddlerID = ? AND outcome = "DNS", 1, 0)) as notStart,\n' +
        '           SUM(IF(paddlerID = ? AND position = "1", 1, 0)) as first,\n' +
        '           SUM(IF(paddlerID = ? AND position = "2", 1, 0)) as second,\n' +
        '           SUM(IF(paddlerID = ? AND position = "3", 1, 0)) as third,\n' +
        '           SUM(IF(paddlerID = ? AND outcome = "Unknown", 1, 0)) as unknown\n' +
        'FROM boatresult2', [id, id, id, id, id, id ,id] ,
     */
   /*SELECT COUNT(boatresult.boatID) as racesEntered, SUM(IF((outcome = "DNF" OR outcome = "RTD"),1,0)) as retirements, SUM(IF((position = "1"), 1, 0)) as first, SUM(IF((position = "2"), 1, 0)) as second, SUM(IF((position = "3"), 1, 0)) as third, SUM(IF((outcome = "Unknown"), 1, 0)) as unknown FROM boatresult, paddlerboat WHERE paddlerboat.paddlerID = 523 AND boatresult.boatID = paddlerboat.boatID*/
    db.query('SELECT COUNT(boatresult.boatID) as racesEntered, ' +
        'SUM(IF((outcome = "DNF" OR outcome = "RTD"),1,0)) as retirements, ' +
        'SUM(IF((outcome = "DNS"),1,0)) as notStart,' +
        'SUM(IF((position = "1"), 1, 0)) as first, ' +
        'SUM(IF((position = "2"), 1, 0)) as second, ' +
        'SUM(IF((position = "3"), 1, 0)) as third, ' +
        'SUM(IF((outcome = "Unknown"), 1, 0)) as unknown ' +
        'FROM boatresult, paddlerboat WHERE paddlerboat.paddlerID = ? AND boatresult.boatID = paddlerboat.boatID', [id],
        function(err, rows) {
            if (err) {
                callback(error(err));
            } else {
                callback(success(rows));
            }
        });
}

function getPaddlerRaces(id, res, callback) {
    db.query('SELECT * FROM boatresult INNER JOIN paddlerboat ON boatresult.boatID = paddlerboat.boatID WHERE paddlerID = ?', [id] ,
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
    db.query('INSERT INTO user (name, email, password, clubID, account, active) ' +
        'VALUES (?, ?, ?, ?, ?, ?)', [user.name, user.email, user.hash, user.clubID, user.is_raceorganiser, user.rand],
        function(err, rows) {
            if(err){
                callback(error(err));
            } else {
                callback(success(rows));
            }
        }
    )
}

function checkVerification(info, res, callback){
    db.query('UPDATE user SET active = CASE WHEN active = ? THEN 1 ELSE active END;', [info], function(err, rows) {
        if(err){
            callback(err);
        } else {
            callback(rows);
        }
    });
}

function getSearch(term, res, callback) {
    db.query('SELECT name, class, paddlerID, division, club.clubID, club.clubcode FROM paddler, club WHERE name LIKE "'+term+'%" AND paddler.clubID = club.clubID', function(err, rows) {
		console.log(rows);
        if (err) {
            callback(error(err));
        }else {
            callback(success(rows));
        }
    });
}

function insertRace(race, res, callback) {
    db.query('INSERT INTO race (raceName, year, date, clubID, seasonID) ' +
        'VALUES (?, ?, ?, ?, (SELECT MAX(seasonID) FROM season))', [race.raceName, race.year, race.date, race.clubID],
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
    db.query('SELECT COUNT(*) AS entry FROM boatresult WHERE raceID = ? AND position = ""', [raceID],
        function (err, rows) {
            if (err) {
                callback(error(err));
            } else {
                callback(success(rows));
            }
        }
    )
}

function insertPaddlerBoat(boatID, paddlerID, res, callback) {
    db.query('INSERT INTO paddlerboat (paddlerID, boatID) VALUES (?, ?);', [paddlerID, boatID],
        function(err, rows) {
            if(err){
                callback(error(err));
            } else {
                callback(success(rows));
            }
        }
    )
}

function insertBoatResult(entry, res, callback) {
    db.query('INSERT INTO boatresult (raceID, raceDivision) VALUES (?, ?);', [entry.raceID, entry.raceDivision],
        function(err, rows) {
            if (err) {
                callback(error(err));
            } else {
                callback(success(rows));
            }
        }
    )
}

function deleteEntry(boatID, res, callback) {
    db.query('DELETE FROM paddlerboat WHERE boatID = ?;' +
        'DELETE FROM boatresult WHERE boatID = ?', [boatID, boatID],
        function(err, rows){
            if(err){
                callback(error(err));
            } else {
                callback(success(rows));
            }
        }
    )
}

function getClubEntries(raceID, clubID, res, callback) {
    db.query('SELECT\n' +
        '    paddler.*,\n' +
        '    boatresult.boatID,\n' +
        '    boatresult.raceDivision\n' +
        '    FROM\n' +
        '    paddler,\n' +
        '    boatresult,\n' +
        '    paddlerboat\n' +
        'WHERE\n' +
        '    boatresult.raceID = ? ' +
        '    AND boatresult.boatID = paddlerboat.boatID AND paddlerboat.paddlerID = paddler.paddlerID ' +
        '    AND paddler.clubID = ?' +
        '    ORDER BY raceDivision DESC, boatID', [raceID, clubID],
        function(err, rows) {
            if(err){
                callback(error(err));
            } else {
                callback(success(rows));
            }
        }
    )
}

function getRaceDivisions(raceID, res, callback) {
    db.query('SELECT DISTINCT raceDivision FROM boatresult WHERE raceID = ?', [raceID],
     function(err, rows){
        if(err){
           callback(error(err));
        } else {
            callback(success(rows));
        }
     }
    )
}



function updateRaceOffset(data, res, callback) {
    db.query('UPDATE race SET boatOffset = ? WHERE raceID = ?', [data.list, data.raceID],
        function(err, rows){
            if(err){
                callback(error(err));
            } else {
                callback(success(rows));
            }
        }
    )
    /*db.query('UPDATE boatresult SET time = ? WHERE raceID = ? AND raceDivision = ?', [data.time, data.raceID, data.raceDivision],
        function(err, rows){
            if(err){
                callback(error(err));
            } else {
                callback(success(rows));
            }
        }
    )*/
}

function assignNumbers(data, res, callback) {
    let sql = "";
    for(let i = 0; i < data.divList.length; i++){
        let currentDiv = data.divList[i];
        let raceID = data.raceID;
        let count = 0, type = 0;
        let divNum = currentDiv[0];
        if(currentDiv.includes("_")){
         count = 2;
         type = 5;
        } else count = 1;
        let s = "SET @increment = " + divNum + type + "0;" +
            "UPDATE boatresult " +
            "SET boatname = @increment:= @increment + 1 " +
            "WHERE raceDivision = '" + currentDiv + "' AND raceID = " + db.escape(raceID) +
            " AND (SELECT COUNT(*) FROM paddlerboat WHERE boatresult.boatID = paddlerboat.boatID) = " + count + "; \n";
        sql = sql + s;
    }
    db.query(sql,
        function(err, rows){
            if(err){
                callback(error(err));
            } else {
                callback(success(rows));
            }
        }
    )
}

function updateBoatTime(data, res, callback){
    db.query('UPDATE boatresult SET time = ?, outcome = ? WHERE boatname = ?', [data.racetime, data.outcome, data.boatname],
        function(err, rows){
            if(err){
                callback(error(err));
            } else {
                callback(success(rows));
            }
        }
    )
}

function getDistinctBoatnumbers(id, res, callback){
    db.query('SELECT DISTINCT boatname FROM boatresult WHERE raceID = ?', [id],
        function(err, rows){
            if(err){
                callback(error(err));
            } else {
                callback(success(rows));
            }
        }
    )
}

function insertAccess(data, hash, res, callback){
    db.query('INSERT INTO temporaryaccess (hash, email, accessType, raceID) VALUES (?, ?, ?, ?);', [hash, data.email, data.accessType, data.raceid],
        function(err, rows){
            if(err){
                callback(error(err));
            } else {
                callback(success(rows));
            }
        }
    )
}

function checkAccess(hash, res, callback) {
    db.query('SELECT * FROM temporaryaccess WHERE hash = ?;', [hash],
        function(err, rows){
            if(err){
                callback(error(err));
            } else {
                callback(success(rows));
            }
        }
    )
}

function distinctDivisions(res, callback) {
    db.query('SELECT DISTINCT division FROM paddler',
        function(err, rows) {
            if(err){
                callback(error(err));
            } else {
                callback(success(rows));
            }
        }
    )
}

function addPaddler(data, res, callback) {
    db.query('INSERT INTO paddler (name, division, class, bcu, clubID) VALUES (?, ?, ?, ?, ?);', [data.name, data.division, data.class, data.bcu, data.club],
        function(err, rows) {
            if(err){
                callback(error(err));
            } else {
                callback(success(rows));
            }
        }
    )
}

function updateRace(race, res, callback) {
    db.query('UPDATE race SET raceName = ?, year = ?, date = ? WHERE raceID = ?', [race.raceName, race.year, race.date, race.raceID],
        function(err, rows){
            if(err){
                callback(error(err));
            } else {
                callback(success(rows));
            }
        }
    )
}

function updateBoatResult(data, res, callback){
    db.query('UPDATE boatresult SET position = ?, time = ?, pd = ? WHERE boatname = ? AND raceID = ?',
        [data.position, data.time, data.pd, data.boatname, data.raceID],
        function(err, rows){
            if(err){
                callback(error(err));
            } else {
                callback(success(rows));
            }
        }
    )
}

function updateBoatResultProcess(data, res, callback){
    let sql = "UPDATE boatresult SET position = "+ data.position +", points = "+ data.points +", pd = "+ data.pd +" WHERE boatname = "+ data.boatname +" AND raceID = "+ data.raceID;
    console.log(sql);
    db.query('UPDATE boatresult SET position = ?, points = ?, pd = ? WHERE boatname = ? AND raceID = ?',
        [data.position, data.points, data.pd, data.boatname, data.raceID],
        function(err, rows){
            if(err){
                callback(error(err));
            } else {
                callback(success(rows));
            }
        }
    )
}

function updateProcess(data, res, callback) {
    db.query('UPDATE race SET processed = ? WHERE raceID = ?', [data.process, data.raceID],
        function(err, rows){
            if(err){
                callback(error(err));
            } else {
                callback(success(rows));
            }
        }
    )
}

function getAdvisorEmail(data, res, callback) {
    db.query('SELECT advisorEmail FROM region WHERE regionID = ?', [data],
        function(err, rows){
            if(err){
                callback(error(err));
            } else {
                callback(success(rows));
            }
        }
    )
}

function getBoatResult(raceID, res, callback) {
    db.query('SELECT * FROM boatresult WHERE raceID = ?', [raceID],
        function(err, rows){
            if(err){
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
    getClubRaces : getClubRaces,
    insertPaddlerBoat : insertPaddlerBoat,
    insertBoatResult : insertBoatResult,
    getClubEntries : getClubEntries,
    deleteEntry : deleteEntry,
    getRaceDivisions : getRaceDivisions,
    updateRaceOffset : updateRaceOffset,
    assignNumbers : assignNumbers,
    checkVerification : checkVerification,
    updateBoatTime : updateBoatTime,
    getDistinctBoatnumbers : getDistinctBoatnumbers,
    insertAccess : insertAccess,
    checkAccess : checkAccess,
    distinctDivisions : distinctDivisions,
    addPaddler : addPaddler,
    updateRace : updateRace,
    updateBoatResult : updateBoatResult,
    updateProcess : updateProcess,
    getAdvisorEmail : getAdvisorEmail,
    getBoatResult : getBoatResult,
    updateBoatResultProcess : updateBoatResultProcess,

};