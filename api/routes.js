
const db = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const secret = require('../secret');

module.exports = function(app) {
    'use strict';

    app.get('/raceresult_order', function (req, res) {
        let x = req.query.id;
        db.getRaceResultsOrder(x, res, function(results) {
            res.send(results);
        })
    });

    app.get('/raceresult_normal', function (req, res) {
        let x = req.query.id;
        db.getRaceResults(x, res, function(results) {
            res.send(results);
        })
    });

    app.get('/paddler', function (req, res) {
        let x = req.query.id;
        db.getPaddler(x, res, function(results) {
            res.send(results);
        })
    });
	
	app.get('/race', function (req, res) {
        let x = req.query.id;
        db.getRace(x, res, function(results) {
            res.send(results);
        })
    });
	
	app.get('/race_year', function (req, res) {
        db.getDistinctYears(res, function(results) {
            res.send(results);
        })
    });

    app.get('/club', function (req, res) {
        let x = req.query.id;
        db.getClub(x, res, function(results) {
            res.send(results);
        })
    })

    app.get('/races', function (req, res) {
		let year = req.query.year;
		let region = req.query.region;
        db.getRaces(year, region, res, function(results) {
            res.send(results);
        })
    })

    app.get('/paddlers', function (req, res) {
        let club = req.query.club;
        db.getPaddlers(club, res, function(results) {
            res.send(results);
        })
    })

    app.get('/clubs', function (req, res) {
        db.getClubs(res, function(results) {
            res.send(results);
        })
    })

    app.get('/clubpaddlers', function (req, res) {
        let x = req.query.id;
        db.getClubPaddlers(x, res, function(results) {
            res.send(results);
        })
    })

    app.get('/paddlerstats', function (req, res) {
        let x = req.query.id;
        db.getPaddlerStats(x, res, function(results) {
            res.send(results);
        })
    })

    app.get('/paddlerraces', function (req, res) {
        let x = req.query.id;
        db.getPaddlerRaces(x, res, function(results) {
            res.send(results);
        })
    })

    app.post('/login', function (req, res) {
        let email = req.body.email;
        let password = req.body.password;
        db.getUserByEmail(email, res, function(data) {
			let result = JSON.parse(data);
			if(result.status === 200 && result.response[0] != null) {
				result = result.response;
				let user = result[0];
                if(bcrypt.compareSync(password, user.password)){
                    let token = jwt.sign({ id: user.userID}, secret.secret, { expiresIn: 86400 });
					delete user['password'];
					console.log(user);
                    res.status(200).send({ auth: true, token: token, user: user });
                } else {
                    res.status(401).send("Either the email or password were incorrect.");
                }
			} else {
				res.status(404).send('Either the email or password were incorrect.');	
			}
        })
    })
	
	app.post('/register', function(req, res) {
		let email = req.body.email;
		let password = req.body.password;
		let name = req.body.name;
		let is_raceorganiser = req.body.is_raceorganiser;
		let clubPassword = req.body.regPassword;
		db.checkClubPassword(clubPassword, res, function(data){
			let result = JSON.parse(data);
			if(result.status === 200) {
				result = result.response;
				let clubID = result[0].clubID;
				let hash = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
				let usrobj = {
					email,
					hash,
					name,
					is_raceorganiser,
					clubID
				}	
				db.getUserByEmail(email, res, function(data){
					let result = JSON.parse(data);
					if(result.status === 200) {
						result = result.response;
						if (result === null) {
							return res.status(500).send("There was a problem registering the user.");
						} else {
							db.registerUser(usrobj, res, function(data){
								let insertResult = JSON.parse(data);
								if(insertResult.status === 200) {
									insertResult = insertResult.response;
									if(insertResult.affectedRows > 0){
										console.log(insertResult.affectedRows + " affected from insert");
										return res.status(200).send("Registration Successful");
									}
								} else {
									return res.status(500).send("Registration failed, please try again.");
								}
							});
						}
					} else {
						return res.status(500).send("There was a problem registering the user.");
					}
				});				
			} else {
				return res.status(401).send('Club password is incorrect');
			}				
		});
	})

	app.get('/search', function(req, res) {
		let x = req.query.term;
        db.getSearch(x, res, function(results) {
            res.send(results);
        })
	});

    app.post('/insertrace', function(req, res) {
        let race = {
            raceName: req.body.name,
            year : req.body.year,
            date : req.body.date,
            regionID : req.body.regionID,
            clubID : req.body.clubID
        }
        db.insertRace(race, res, function(results) {
            res.send(results);
        })
    });

    app.get('/regions', function(req, res) {
        db.getRegions(res, function(results) {
            res.send(results);
        })
    });

    app.post('/isorganiser', function(req, res) {
       db.isOrganiser(req.body.userID, res, function(results) {
           res.send(results);
       })
    });

    app.get('/getclubraces', function(req, res) {
        let x = req.query.id;
        db.getClubRaces(x, res, function(results) {
           res.send(results);
        });
    })

    app.get('/someRoute', function (req, res) {
        res.send('Hello SomeRoute!');
    });
};


/**
 import axios from 'axios';
 export default {
    data() {
      return {
        info: [],
        errors: []
      };
    },
    created() {
      axios.get('http://localhost:3000/race?id=1')
        .then(response => {
          // JSON responses are automatically parsed.
          this.info = response.data.response;
          console.log(response.data.response[0].name);
        })
        .catch(e => {
          this.errors.push(e)
        })
    }
  };

 */