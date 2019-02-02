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


function getRaceResults(id, res, callback) {
    db.query('SELECT raceDivision, `position`, paddler.name, club.clubcode , paddler.class ,paddler.division, ' +
        '`time`,`points`,`pd`,`outcome` FROM `raceresults`, `paddler`, `club` ' +
        'WHERE raceID = ? AND paddler.paddlerID = raceresults.paddlerID AND paddler.clubID = club.clubID ' +
        ' ORDER BY raceresults.raceDivision, case when raceresults.position regexp \'^[0-9]\' then 1 ' +
        'when raceresults.position regexp \'^[a-zA-Z]\' then 2 end , raceresults.position + 0 ASC', [id],
        function(err, rows) {
            if (err) {
                console.log(err);
            }else {
                callback(rows);
            }
        });
}



module.exports = {
    connectDatabase: connectDatabase,
    getRaceResults: getRaceResults
};