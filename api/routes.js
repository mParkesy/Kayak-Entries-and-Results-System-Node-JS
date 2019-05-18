const db = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const secret = require('../secret');
const mail = require('../config/email');
const crypto = require('crypto');
let token = "";

module.exports = function(app) {
    'use strict';

       var check = function(req, res, next) {
                let server_token = req.headers['authorization'];
                if(server_token === token) {
                    next();
                } else {
                    res.send("no token provided")
                }
        }

    /**
     * API Path - Gets race results for a specific race in order
     */
    app.get('/raceresult_order', function (req, res) {
        let x = req.query.id;
        db.getRaceResultsOrder(x, res, function(results) {
            res.send(results);
        })
    });

    /**
     * API Path - Gets race results for a specific race in order of boat number
     */
    app.get('/raceresult_number', function (req, res) {
        let x = req.query.id;
        db.getRaceResults(x, res, function(results) {
            res.send(results);
        })
    });

    /**
     * API Path - Gets a paddler by paddlerID
     */
    app.get('/paddler', function (req, res) {
        let x = req.query.id;
        db.getPaddler(x, res, function(results) {
            res.send(results);
        })
    });

    /**
     * API Path - Gets a races details by raceID
     */
	app.get('/race', function (req, res) {
        let x = req.query.id;
        db.getRace(x, res, function(results) {
            res.send(results);
        })
    });

    /**
     * API Path - Gets distinct years that races have occurred
     */
	app.get('/race_year', function (req, res) {
        db.getDistinctYears(res, function(results) {
            res.send(results);
        })
    });

    /**
     * API Path - Gets a clubs details by clubID
     */
    app.get('/club', function (req, res) {
        let x = req.query.id;
        db.getClub(x, res, function(results) {
            res.send(results);
        })
    })

    /**
     * API Path - Gets a list of races that can be filtered by year, region and if processed by raceID
     */
    app.get('/races', function (req, res) {
		let year = req.query.year;
		let region = req.query.region;
		let process = req.query.process;
        db.getRaces(year, region, process, res, function(results) {
            res.send(results);
        })
    })

    /**
     * API Path - Gets a list of paddlers from a specific club by clubID
     */
    app.get('/paddlers', function (req, res) {
        let club = req.query.club;
        db.getPaddlers(club, res, function(results) {
            res.send(results);
        })
    })

    /**
     * API Path - Gets all clubs in the system
     */
    app.get('/clubs', function (req, res) {
        db.getClubs(res, function(results) {
            res.send(results);
        })
    })

    /**
     * API Path - Get a list of paddlers from a specific club by clubID ordered by number of race entries
     */
    app.get('/clubpaddlers', check, function (req, res) {
        let x = req.query.club;
        db.getClubPaddlersEntries(x, res, function(results) {
            res.send(results);
        })
    })

    /**
     * API Path - Gets a specific paddlers stats by paddlerID
     */
    app.get('/paddlerstats', function (req, res) {
        let x = req.query.id;
        db.getPaddlerStats(x, res, function(results) {
            res.send(results);
        })
    })

    /**
     * API Path - Get a specific paddlers races by paddlerID
     */
    app.get('/paddlerraces', function (req, res) {
        let x = req.query.id;
        db.getPaddlerRaces(x, res, function(results) {
            res.send(results);
        })
    })

    /**
     * API Path - Authenticates a user for access to the system by email address and password
     */
    app.post('/login', function (req, res) {
        let email = req.body.email;
        let password = req.body.password;
        db.getUserByEmail(email, res, function(data) {
			let result = JSON.parse(data);
			if(result.status === 200 && result.response[0] != null) {
				result = result.response;
				let user = result[0];
                if(bcrypt.compareSync(password, user.password)){
                    token = jwt.sign({ id: user.userID}, secret.secret, { expiresIn: 86400 });
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

    /**
     * API Path - Registers a user in the system by checking the correct club password has been entered
     */
	app.post('/register', function(req, res) {
		let email = req.body.email;
		let password = req.body.password;
		let name = req.body.name;
		let is_raceorganiser = req.body.is_raceorganiser;
		let clubPassword = req.body.regPassword.toUpperCase();
		// calls the database to make sure the correct club password was entered
		db.checkClubPassword(clubPassword, res, function(data){
			let result = JSON.parse(data);
			// check to see if database call was successful
			if(result.status === 200) {
				result = result.response;
				let clubID = result[0].clubID;
				// hash the password
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
				// check if a user with that email already exists
				db.getUserByEmail(email, res, function(data){
					let result = JSON.parse(data);
					if(result.status === 200) {
						result = result.response;
						if (result.length > 0) {
						    // user already exists with that email
							return res.status(500).send("There was a problem registering the user.");
						} else {
						    // register the user in the database
							db.registerUser(usrobj, res, function(data){
								let insertResult = JSON.parse(data);
								if(insertResult.status === 200) {
									insertResult = insertResult.response;
									// if insert successful then send verification email
									if(insertResult.affectedRows > 0){
										//console.log(insertResult.affectedRows + " affected from insert");
                                        let body = "Hello " + name + ", \n\n" +
                                            "You recently registered on the Hasler Race Management Website,\n" +
                                            "Please click the link below to verify your account:\n " +
                                            //"https://kayakresults.herokuapp.com/verify?id=" + rand;
                                            "http://localhost:3000/verify?id=" + rand;
                                        // send email
                                        mail.send(email, "Registration Email", body);
                                        // send message to front end
										return res.status(200).send("An email has been sent to verify the account");
									}
								} else {
								    // database fail or account exists
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

    /**
     * API Path - Verifies an account by userID
     */
    app.get('/verify', function(req, res) {
       let rand = req.query.id;
       // if id exists
       if(rand != null){
           // if an id was passed to the page then check verification code
            db.checkVerification(rand, res, function(results) {
                // if correct and verified then send to front end view
                if(results.changedRows > 0){
                    //res.redirect('https://kayakmanagement-65a08.firebaseapp.com/login?result=1');
                    res.redirect('http://localhost:8081/login?result=bfeqwhf8327rtgq3fq8o');
                    //res.status(200).redirect("Your account has been verified.")
                } else {
                    res.status(500).send("Verification failed, unknown information.")
                }
            })
       } else {
           // if not verified then send error message
           res.status(500).send("Verification failed, unknown information.")
       }
    });

    /**
     * Carries out a paddler search based on a passed term
     */
	app.get('/search', function(req, res) {
		let x = req.query.term;
        db.getSearch(x, res, function(results) {
            res.send(results);
        })
	});

	/**
     * Inserts a race by passing details to database
	 */
    app.post('/insertrace', check, function(req, res) {
        let race = {
            raceName: req.body.name,
            year : req.body.year,
            date : req.body.date,
            clubID : req.body.clubID,
            regionID : req.body.region
        }
        db.insertRace(race, res, function(results) {
            res.send(results);
        })
    });

    /**
     * Gets all regions in the system
     */
    app.get('/regions', function(req, res) {
        db.getRegions(res, function(results) {
            res.send(results);
        })
    });

    /**
     * Checks to see if the user logged in is a race organiser by sending an id to the database
     */
    app.post('/isorganiser', function(req, res) {
        let id = req.body.userID;
       db.isOrganiser(id, res, function(results) {
           res.send(results);
       })
    });

    /**
     * Gets all the races run by a club by passing the clubID
     */
    app.get('/getclubraces', check, function(req, res) {
        let x = req.query.id;
        db.getClubRaces(x, res, function(results) {
           res.send(results);
        });
    })

    /**
     * Inserts a paddler boat which determines what paddlers a boat contains
     */
    app.post('/insertpaddlerboat', check, function(req, res) {
        let boat = req.body.boatid;
        let paddler = req.body.paddlerid;
        db.insertPaddlerBoat(boat, paddler, res, function(results) {
            res.send(results)
        });
    })

    /**
     * Inserts a fairly blank boat result into the database ready to be filled with finish times, etc
     */
    app.post('/insertboatresult', check, function(req, res) {
        let entry = {
            raceID : req.body.race,
            raceDivision : req.body.div
        }
        db.insertBoatResult(entry, res, function(results)  {
            res.send(results);
        });
    })

    /**
     * Deletes a race entry in the database by passing a boatID
     */
    app.post('/deleteentry', check, function(req, res) {
        let boat = req.body.boatid;
        db.deleteEntry(boat, res, function(results) {
            res.send(results);
        })
    })

    /**
     * Gets the entries for a particular club for a particular race
     */
    app.get('/clubraceentries', check, function(req, res) {
        let raceID = req.query.raceid;
        let clubID = req.query.clubid;
        db.getClubEntries(raceID, clubID, res, function(results) {
            res.send(results);
        });
    })

    /**
     * Gets the race divisions that currently have entries for a particular race
     */
    app.get('/racedivisions', check, function(req, res) {
        let race = req.query.id;
        db.getRaceDivisions(race, res, function(results) {
           res.send(results);
        });
    })

    /**
     * Updates the race stopwatch offsets for each divisional race
     */
    app.post('/updateraceoffset', check, function(req, res) {
        let data = {
            list : req.body.list,
            raceID : req.body.raceID,
        }
        db.updateRaceOffset(data, res, function(results){
            res.send(results);
        });
    })

    /**
     * Runs the assign boat number command which gives each boat a number and saves it to the database
     * The boat number acts as a unique identifier for the particular race
     */
    app.post('/assignboatnumbers', check, function(req, res) {
        let data = req.body.data;
        db.assignNumbers(data, res, function(results) {
           res.send(results);
        });
    })

    /**
     * Updates a boats time and race outcome for a particular boat number for a particular race
     */
    app.post('/updateboattime', check, function(req, res) {
        let data = req.body.data;
        db.updateBoatTime(data, res, function(results){
           res.send(results);
        });
    })

    /**
     * Gets a list of boat numbers for a particular race
     */
    app.get('/boatnumbers', check, function(req, res) {
        let raceID = req.query.id;
        db.getDistinctBoatnumbers(raceID, res, function (results) {
            res.send(results);
        });
    })

    /**
     * Inserts an access token for somebody who might want to help with result input
     * and sends an email to them with a link
     */
    app.post('/insertAccess', check, function(req, res) {
        let data = req.body.data;
        // creates a random hash to store in database
        let hash = crypto.randomBytes(50).toString('hex');
        let body = "Hello volunteer  \n\n" +
            "You have been asked to help input boat numbers and their finishing time.\n" +
            "Please follow the link below to access the input page.\n" +
            //"https://kayakmanagement-65a08.firebaseapp.com/phoneresults/" + hash;
            "http://localhost:8081/phoneresults/" + hash;
        // sends the email and then saves token to database
        mail.send(data.email, "Race Result Volunteer", body);
        db.insertAccess(data, hash, res, function(results) {
           res.send(results);
        });
    })

    /**
     * Gets the distinct divisions that exist in the whole system
      */
    app.get('/distinctdivisions', check, function(req, res) {
        db.distinctDivisions(res, function(results) {
           res.send(results);
        });
    })

    /**
     * Adds a new paddler to the system
     */
    app.post('/addPaddler', check, function(req, res) {
        let data = req.body.data;
        db.addPaddler(data, res, function(results) {
           res.send(results);
        });
    })

    /**
     * Updates a races details based on the raceID
     */
    app.post('/updaterace', check, function(req, res) {
        let race = {
            raceName: req.body.name,
            year : req.body.year,
            date : req.body.date,
            raceID : req.body.raceID,
        }
        db.updateRace(race, res, function(results) {
            res.send(results);
        })
    });

    /**
     * Updates a boats results including there position, points and promotion/demotion field
     * for a particular boat for a particular race
     */
    app.post('/updateboatresult', function(req, res) {
        let data = req.body.data;
        db.updateBoatResult(data, res, function(results){
            res.send(results);
        });
    })

    /**
     * This call carries out a mass update of boat results submitted by a regional advisor
     */
    app.post('/mass_updateboatresult', function(req, res) {
        let data = req.body.data;
        let response = [];
        // loop over all the data and update each boats results
        for(let i = 0; i < data.length; i++){
            db.updateBoatResult(data[i], res, function(results){
                response.push(results);
            });
        }
        res.send(response);
    })

    /**
     * Updates the processed column in the race database to determine whether the results are ready for
     * checking by a regional advisor or if they are ready to go live on the site
     */
    app.post('/updateraceprocess', check, function(req, res) {
        let data = req.body.data;
        if(data.region != undefined){
            regionalAdvisorEmail(data.raceID, data.region, res);
        } else {
            db.updateProcess(data, res, function(results){
                res.send(results);
            });
        }

    })

    /**
     * Checks to see if a user accessing a page can actually access that page by looking in the temporary
     * access table for a particular token, returns the type of action this user can carry out
     */
    app.get('/accesspage', function(req, res) {
        let hash =  req.query.id;
        db.checkAccess(hash, res, function(results) {
            res.send(results);
        });
    })

    /**
     * Gets all the paddlers entered into a particular race
     */
    app.get('/getracepaddlers', check, function(req, res ) {
        let raceid = req.query.id;
        db.getRacePaddlers(raceid, res, function (results) {
            res.send(results);
        });
    })

    /**
     * Gets the details for a club based on the club code given
     */
    app.get('/clubbycode', check, function(req, res) {
        let code = req.query.code;
        db.getClubByCode(code, res, function(results){
            res.send(results);
        });
    })

    app.post('/clubpointsforrace', function(req, res) {
        let raceID = req.body.raceID;
        db.getClubPointsForRace(raceID, res, function(results){
            res.send(results);
        })
    })

    /**
     * The large processing route that goes over results and calculates positions, points, promotions,
     * demotions and points
     */
    app.post('/processresults', function(req, res) {
        try {
            let data = req.body.data;
            // gets all boat resulst for a race
            db.getBoatResult(data.raceID, res, function (results) {
                // save necessary variables for processing
                results = JSON.parse(results).response;
                let processType = req.body.data.processType;
                let raceID = req.body.data.raceID;
                let race_region;
                // gets the race region for this race
                db.getRaceRegion(raceID, res, function (results) {
                    race_region = results[0].regionID;
                });

                // a list to store all clubs in race
                var clubList = [];
                // sort into list of races
                let raceList = [];
                // for every result into race
                for (let i = 0; i < results.length; i++) {
                    // save the division
                    let div = results[i].raceDivision;
                    // save the club to list
                    clubList.push(results[i].clubID);
                    // make sure all times are entered
                    if (results[i].time === null) {
                        res.status(428).send("Not all times were filled in.");
                        return;
                    }
                    // if a k2 result then append 0
                    if (div.includes("_")) {
                        div = div[0] + "0";
                    } else {
                        // if k1 then take division number
                        div = div[0];
                    }
                    // if a list for that particular division doesn't exist
                    if (raceList[parseInt(div)] == null) {
                        // add a list to that element and add the result to it
                        raceList[parseInt(div)] = new Array();
                        raceList[parseInt(div)].push(results[i]);
                    } else {
                        // add the element to the already defined list
                        raceList[parseInt(div)].push(results[i]);
                    }
                }

                // arrays for division splitting times
                let div123 = [];
                let div456 = [];
                let div78 = [];

                // loop over each race and order results by time
                for (let j = 0; j < raceList.length; j++) {
                    if (raceList[j] != null) {
                        // order results by time
                        raceList[j].sort(function (a, b) {
                            return parseInt(hmsToSeconds(a.time)) - parseInt(hmsToSeconds(b.time));
                        })

                        let race = raceList[j];
                        // loop over each race
                        for (let y = 0; y < race.length; y++) {
                            let current = race[y];
                            // add to appropriate list for the three distances
                            if (j == 1 || j == 2 || j == 3) {
                                div123.push({
                                    boatID: current.boatID,
                                    time: current.time,
                                    raceDivision: current.raceDivision
                                })
                            } else if (j == 4 || j == 5 || j == 6) {
                                div456.push({
                                    boatID: current.boatID,
                                    time: current.time,
                                    raceDivision: current.raceDivision
                                })
                            } else if (j == 7 || j == 8) {
                                div78.push({
                                    boatID: current.boatID,
                                    time: current.time,
                                    raceDivision: current.raceDivision
                                })
                            }
                        }
                    }
                }

                // define lists for calculations
                let promotion_div1div2 = [];
                let promotion_div2div3div4div5 = [];
                let promotion_div5div6div7div8 = [];
                let demotion_times = [];
                // get promotion and demotion times for each division
                // these are based on handbook factors
                if (div123.length > 0) {
                    let average = getDiv1Div2Times(div123);
                    promotion_div1div2[1] = average * 1.067;
                    promotion_div1div2[2] = average * 1.15;
                    demotion_times[2] = average * 1.083;
                    demotion_times[3] = average * 1.167;
                    demotion_times[4] = average * 1.25;
                }
                if (div456.length > 0) {
                    let average = getDiv3Div4Div5Times(div456);
                    promotion_div2div3div4div5[2] = average * 1.15;
                    promotion_div2div3div4div5[3] = average * 1.233;
                    promotion_div2div3div4div5[4] = average * 1.317;
                    promotion_div2div3div4div5[5] = average * 1.4;
                    demotion_times[5] = average * 1.333;
                    demotion_times[6] = average * 1.417;
                    demotion_times[7] = average * 1.5;
                }
                if (div78.length > 0) {
                    let average = getDiv6Div7Div8Times(div78);
                    promotion_div5div6div7div8[5] = average * 1.4;
                    promotion_div5div6div7div8[6] = average * 1.483;
                    promotion_div5div6div7div8[7] = average * 1.567;
                    promotion_div5div6div7div8[8] = average * 1.65;
                    demotion_times[8] = average * 1.583;
                }

                // loop over each division race
                for (let x = 0; x < raceList.length; x++) {
                    if (raceList[x] != null) {
                        let resultList = raceList[x];
                        // define starting points and position
                        let startingPoints = 20;
                        let pos = 1;
                        let hundred_ten_percent = 10000;
                        let promotionCounter = 0;
                        // for each result
                        for (let z = 0; z < resultList.length; z++) {
                            let current = resultList[z];
                            current.position = pos;

                            let paddlerInRegion = true;
                            let changeDiv = 0;
                            // if normal process continue
                            if (processType == 0) {

                                if (race_region != current.regionID) {
                                    paddlerInRegion = false;
                                }

                                let div = current.raceDivision;
                                let time = hmsToSeconds(current.time);
                                let promote = false;
                                let demote = false;
                                // check paddler time against promotion and demotion times
                                // and promote or demote where appropriate
                                if (div == 2 || div == 3) {
                                    if (time < promotion_div1div2[div - 1]) {
                                        //changeDiv = div - 1;
                                        //promote = true;
                                    } else if (div == 2 && time > demotion_times[3]) {
                                        changeDiv = div + 1;
                                        demote = true;
                                    } else if (div == 3 && time > demotion_times[4]) {
                                        changeDiv = div + 1;
                                        demote = true;
                                    }
                                } else if (div == 4 || div == 5 || div == 6) {
                                    if (time < promotion_div2div3div4div5[div - 1]) {
                                        changeDiv = div - 1;
                                        promote = true;
                                    } else if (div == 4 && time > demotion_times[5]) {
                                        changeDiv = div + 1;
                                        demote = true;
                                    } else if (div == 5 && time > demotion_times[6]) {
                                        changeDiv = div + 1;
                                        demote = true;
                                    } else if (div == 6 && time > demotion_times[7]) {
                                        changeDiv = div + 1;
                                        demote = true;
                                    }
                                } else if (div == 7 || div == 8 || div == 9) {
                                    if (time < promotion_div5div6div7div8[div - 1]) {
                                        changeDiv = div - 1;
                                        promote = true;
                                    } else if (div == 7 && time > demotion_times[8]) {
                                        changeDiv = div + 1;
                                        demote = true;
                                    }
                                } else if (div == 1 && time > demotion_times[2]) {
                                    changeDiv = div + 1;
                                    demote = true;
                                }

                                // calculate hundred ten percent time only if the current paddler hasn't
                                // been promoted and no one else has been promoted yet
                                if (changeDiv == 0 && promotionCounter == 0) {
                                    hundred_ten_percent = hmsToSeconds(current.time) * 1.1;
                                } else {
                                    promotionCounter++;
                                }
                                // if paddler retired or did not start give zero points
                                if (current.time.includes("RTD") || current.time.includes("DNS")) {
                                    current.points = "";
                                // if paddler was slow then hundred ten percent time then give one point
                                } else if (hmsToSeconds(current.time) > hundred_ten_percent && x != 9 && x != 90) {
                                    current.points = "1";
                                // if points are currently less that 2 then give 2
                                } else if (startingPoints < 2) {
                                    current.points = "2";
                                // apply normal points
                                } else {
                                    current.points = startingPoints;
                                }

                                // if in region then remove from point for next paddler
                                if (paddlerInRegion) {
                                    startingPoints--;
                                } else {
                                    // if not in region then set points to none
                                    current.points = "";
                                }

                                // if paddler changed division then send to database
                                if (changeDiv > 0) {
                                    db.changePaddlerDiv(current.paddlerID, changeDiv, res, function (results) {

                                    });
                                    // add to promotion of demotion field in database
                                    if (promote) {
                                        changeDiv = "P" + changeDiv;
                                    } else if (demote) {
                                        changeDiv = "D" + changeDiv;
                                    } else {
                                        changeDiv = '';
                                    }

                                } else {
                                    changeDiv = '';
                                }
                            // if different process type then just make sure division doesn't change
                            // this is for when an advisor submits results
                            } else if (data.processType == 1) {
                                changeDiv = current.raceDivision;
                            }


                            let data = {
                                position: current.position,
                                boatname: current.boatname,
                                points: current.points,
                                pd: changeDiv,
                                raceID: current.raceID
                            }
                            // submit updated resuts to database and add one to position
                            db.updateBoatResultProcess(data, res, function (results) {
                                //console.log(results);
                                pos++;
                            });
                        }
                    }

                }
                // makes sure only unique club IDs are in list
                clubList = [...new Set(clubList.map(x => x))];
                // loop over all clubs
                for (let i = 0; i < clubList.length; i++) {
                    // gets a clubs entries and sorts them by points given
                    db.getClubEntries(raceID, clubList[i], res, function (result) {
                        let clubEntries = JSON.parse(result).response;
                        clubEntries.sort(function (a, b) {
                            return parseInt(b.points) - (a.points);
                        })
                        let totalClub = 0;
                        // loops over top 12 paddlers in club to get total points
                        for (let z = 0; z < 12; z++) {
                            if (clubEntries[z] != null) {
                                totalClub += parseInt(clubEntries[z].points);
                            }
                        }
                        let data = {
                            clubID: clubList[i],
                            points: totalClub,
                            raceID: raceID
                        }
                        // update points table
                        db.updateClubPoints(data, res, function (results) {
                            rese.send()
                        })
                    });
                }
                res.status(200).send("complete");
            })
        } catch(error){
            res.status(400).send("bad request");
        }
    })

    /**
     * Sends an email to a regional advisor with a link to edit results
     * @param raceID The raceID for the race results that are going to be checked
     * @param region The region of the race so that the right advisor is emailed
     * @param res Response for front end
     */
    function regionalAdvisorEmail(raceID, region, res){
        // get advisor email
        db.getAdvisorEmail(region, res, function(results) {
            results = JSON.parse(results);
            let email = results.response[0].advisorEmail;
            // create a hash to append to link in email
            let hash = crypto.randomBytes(50).toString('hex');
            let body = "Hello Regional Advisor,  \n\n" +
                "A set of race results have been submitted.\n" +
                "Please follow the link below to review the results and make changes.\n" +
                "http://localhost:8081/adminresult/" + raceID + "?auth=" + hash;
            // send email
            mail.send(email, "Race Result Submission", body);
            let data = {
                email : email,
                accessType : 1,
                raceid : raceID
            }
            // insert an access token so that the advisor can access the page
            db.insertAccess(data, hash, res, function(results) {
                res.send(results);
            });

        })

    }

    /**
     * Gets the promotion average for div 1,2 and 3
     * @param div123 The list of results for those divisions
     * @returns {*} The average factor
     */
    function getDiv1Div2Times(div123){
        // sort by time
        div123.sort(function(a, b) {
            return parseInt(hmsToSeconds(a.time)) - parseInt(hmsToSeconds(b.time));
        })

        // get middle time for course
        let middle = div123[Math.floor(div123.length / 2)];
        let middle2;
        let midplaceTime = 0;
        if(div123.length % 2 === 0) {
            middle2 = div123[Math.floor(div123.length - 1 / 2)]
            midplaceTime = (parseInt(hmsToSeconds(middle.time) + parseInt(hmsToSeconds(middle2.time)))) / 2;
        } else {
            midplaceTime = middle;
        }
        // get a factor for each division
        let div1 = secondsToHMS(midplaceTime / 1.033);
        let div2 = secondsToHMS(midplaceTime / 1.117);
        let div3 = secondsToHMS(midplaceTime / 1.2);


        let longCourse = [hmsToSeconds(div1),hmsToSeconds(div2), hmsToSeconds(div3)];
        longCourse.sort();
        let average;
        // check how close these factors are to each other and remove a factor that is to far away from
        // the other two factors
        if(longCourse[2] - longCourse[0] > 60){
            // all three within 60
            average = (longCourse[0] + longCourse[1] + longCourse[2]) / 3;
        } else if (longCourse[1] - longCourse[0] > 60){
            // second and third within 60
            // delete first
            average = (longCourse[1] + longCourse[2]) / 2;
        } else if (longCourse[2] - longCourse[1] > 60){
            // first and second within 60
            // delete third
            average = (longCourse[0] + longCourse[1]) / 2;
        } else {
            average = longCourse[1];
        }

/*        let promotionTimes = [];
        promotionTimes[1] = average * 1.067;
        promotionTimes[2] = average * 1.15;*/
        // return the average of the factors
        return average;
    }

    /**
     * Same as above but for Div 4, 5, 6
     * @param div345 The list of results in those divisions
     * @returns {*} The average factor
     */
    function getDiv3Div4Div5Times(div345){
        div345.sort(function(a, b) {
            return parseInt(hmsToSeconds(a.time)) - parseInt(hmsToSeconds(b.time));
        })

        let middle = div345[Math.floor(div345.length / 2)];
        let middle2;
        let midplaceTime = 0;
        if(div345.length % 2 === 0) {
            middle2 = div345[Math.floor(div345.length - 1 / 2)]
            midplaceTime = (parseInt(hmsToSeconds(middle.time) + parseInt(hmsToSeconds(middle2.time)))) / 2;
        } else {
            midplaceTime = middle;
        }
        let div3 = secondsToHMS(midplaceTime / 1.283);
        let div4 = secondsToHMS(midplaceTime / 1.367);
        let div5 = secondsToHMS(midplaceTime / 1.45);


        let longCourse = [hmsToSeconds(div3),hmsToSeconds(div4), hmsToSeconds(div5)];
        longCourse.sort();
        let average;
        if(longCourse[2] - longCourse[0] > 60){
            // all three within 60
            average = (longCourse[0] + longCourse[1] + longCourse[2]) / 3;
        } else if (longCourse[1] - longCourse[0] > 60){
            // second and third within 60
            // delete first
            average = (longCourse[1] + longCourse[2]) / 2;
        } else if (longCourse[2] - longCourse[1] > 60){
            // first and second within 60
            // delete third
            average = (longCourse[0] + longCourse[1]) / 2;
        } else {
            average = longCourse[1];
        }

/*        let promotionTimes = [];
        promotionTimes[2] = average * 1.15;
        promotionTimes[3] = average * 1.233;
        promotionTimes[4] = average * 1.317;
        promotionTimes[5] = average * 1.4;*/

        return average;
    }

    /**
     * Same as above but for Div 6, 7, 8
     * @param div678 The list of results for those divisions
     * @returns {number} The average factor
     */
    function getDiv6Div7Div8Times(div678){
        div678.sort(function(a, b) {
            return parseInt(hmsToSeconds(a.time)) - parseInt(hmsToSeconds(b.time));
        })
        let middle = div678[Math.floor(div678.length / 2)];
        let middle2;
        let midplaceTime = 0;
        if(div678.length % 2 === 0) {
            middle2 = div678[Math.floor(div678.length - 1 / 2)]
            midplaceTime = (parseInt(hmsToSeconds(middle.time) + parseInt(hmsToSeconds(middle2.time)))) / 2;
        } else {
            midplaceTime = middle;
        }

        let div7 = secondsToHMS(midplaceTime / 1.533);
        let div8 = secondsToHMS(midplaceTime / 1.617);

        let longCourse = [hmsToSeconds(div7),hmsToSeconds(div8)];
        longCourse.sort();
        let average;
        average = (longCourse[0] + longCourse[1]) / 2;

/*
        let promotionTimes = [];
        promotionTimes[5] = average * 1.4;
        promotionTimes[6] = average * 1.483;
        promotionTimes[7] = average * 1.567;
        promotionTimes[8] = average * 1.65;
*/
        return average;
    }


    function hmsToSeconds(s) {
        var b = s.split(':');
        return b[0]*3600 + b[1]*60 + (+b[2] || 0);
    }

    // Convert seconds to hh:mm:ss
    // Allow for -ve time values
    function secondsToHMS(secs) {
        function z(n){return (n<10?'0':'') + n;}
        var sign = secs < 0? '-':'';
        secs = Math.abs(secs);
        return sign + z(secs/3600 |0) + ':' + z((secs%3600) / 60 |0) + ':' + z(secs%60);
    }
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