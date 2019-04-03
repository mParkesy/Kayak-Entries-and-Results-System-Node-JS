
const db = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const secret = require('../secret');
const mail = require('../config/email');
const crypto = require('crypto');

module.exports = function(app) {
    'use strict';

    app.get('/raceresult_order', function (req, res) {
        let x = req.query.id;
        db.getRaceResultsOrder(x, res, function(results) {
            res.send(results);
        })
    });

    app.get('/raceresult_number', function (req, res) {
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
		let process = req.query.process;
        db.getRaces(year, region, process, res, function(results) {
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
        let x = req.query.club;
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
				let rand = crypto.randomBytes(20).toString('hex');
				let usrobj = {
					email,
					hash,
					name,
					is_raceorganiser,
					clubID,
                    rand
				}	
				db.getUserByEmail(email, res, function(data){
					let result = JSON.parse(data);
					console.log(result);
					if(result.status === 200) {
						result = result.response;
						if (result.length > 0) {
							return res.status(500).send("There was a problem registering the user.");
						} else {

							db.registerUser(usrobj, res, function(data){
								let insertResult = JSON.parse(data);
								if(insertResult.status === 200) {
									insertResult = insertResult.response;
									if(insertResult.affectedRows > 0){
										//console.log(insertResult.affectedRows + " affected from insert");
                                        let body = "Hello " + name + ", \n\n" +
                                            "You recently registered on the Hasler Race Management Website,\n" +
                                            "Please click the link below to verify your account:\n " +
                                            "http://localhosthttps://kayakresults.herokuapp.com/verify?id=" + rand;
                                        mail.send(email, "Registration Email", body);
										return res.status(200).send("An email has been sent to verify the account");
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

    app.get('/verify', function(req, res) {
       let rand = req.query.id;
       if(rand != null){
            db.checkVerification(rand, res, function(results) {
                if(results.changedRows > 0){
                    console.log("yes");
                    res.redirect('http://https://kayakmanagement-65a08.firebaseapp.com/login?result=1');
                    //res.status(200).redirect("Your account has been verified.")
                } else {
                    res.status(500).send("Verification failed, unknown information.")
                }
            })
       } else {
           res.status(500).send("Verification failed, unknown information.")
       }
    });

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

    app.post('/insertpaddlerboat', function(req, res) {
        let boat = req.body.boatid;
        let paddler = req.body.paddlerid;
        db.insertPaddlerBoat(boat, paddler, res, function(results) {
            res.send(results)
        });
    })

    app.post('/insertboatresult', function(req, res) {
        let entry = {
            raceID : req.body.race,
            raceDivision : req.body.div
        }
        db.insertBoatResult(entry, res, function(results)  {
            res.send(results);
        });
    })

    app.post('/deleteentry', function(req, res) {
        let boat = req.body.boatid;
        db.deleteEntry(boat, res, function(results) {
            res.send(results);
        })
    })

    app.get('/clubraceentries', function(req, res) {
        let raceID = req.query.raceid;
        let clubID = req.query.clubid;
        db.getClubEntries(raceID, clubID, res, function(results) {
            res.send(results);
        });
    })

    app.get('/racedivisions', function(req, res) {
        let race = req.query.id;
        db.getRaceDivisions(race, res, function(results) {
           res.send(results);
        });
    })

    app.post('/updateraceoffset', function(req, res) {
        let data = {
            list : req.body.list,
            raceID : req.body.raceID,
        }
        db.updateRaceOffset(data, res, function(results){
            res.send(results);
        });
    })

    app.post('/assignboatnumbers', function(req, res) {
        let data = req.body.data;
        db.assignNumbers(data, res, function(results) {
           res.send(results);
        });
    })

    app.post('/updateboatresult', function(req, res) {
        let data = req.body.data;
        db.updateBoatResult(data, res, function(results){
           res.send(results);
        });
    })

    app.get('/boatnumbers', function(req, res) {
        let id = req.query.id;
        db.getDistinctBoatnumbers(id, res, function (results) {
            res.send(results);
        });
    })

    app.post('/insertAccess', function(req, res) {
        let data = req.body.data;
        let hash = crypto.randomBytes(50).toString('hex');
        let body = "Hello volunteer  \n\n" +
            "You have been asked to help input boat numbers and their finishing time.\n" +
            "Please follow the link below to access the input page.\n" +
            "http://https://kayakmanagement-65a08.firebaseapp.com/phoneresults/" + hash;
        mail.send(data.email, "Race Result Volunteer", body);
        db.insertAccess(data, hash, res, function(results) {
           res.send(results);
        });
    })

    app.get('/accesspage', function(req, res) {
        let hash =  req.query.id;
        db.checkAccess(hash, res, function(results) {
            res.send(results);
        });
    })
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