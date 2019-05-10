const db = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const secret = require('../secret');
const mail = require('../config/email');
const crypto = require('crypto');
let token = "";

module.exports = function(app) {
    'use strict';

/*    var check = function(req, res, next) {
        if(req._parsedUrl.pathname === '/') {
            next();
        } else  {
            let server_token = req.headers['authorization'];
            if(server_token == "1"){
                next();
            }

        }
    }*/

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
    app.get('/clubpaddlers', function (req, res) {
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
                                            "http://localhost:3000/verify?id=" + rand;
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

    /**
     * API Path - Verifies an account by userID
     */
    app.get('/verify', function(req, res) {
       let rand = req.query.id;
       if(rand != null){
            db.checkVerification(rand, res, function(results) {
                if(results.changedRows > 0){
                    res.redirect('http://localhost:8081/login?result=1');
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
            clubID : req.body.clubID,
            regionID : req.body.region
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

    app.post('/updateboattime', function(req, res) {
        let data = req.body.data;
        db.updateBoatTime(data, res, function(results){
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
            "http://localhost:8081/phoneresults/" + hash;
        mail.send(data.email, "Race Result Volunteer", body);
        db.insertAccess(data, hash, res, function(results) {
           res.send(results);
        });
    })

    app.get('/distinctdivisions', function(req, res) {
        db.distinctDivisions(res, function(results) {
           res.send(results);
        });
    })

    app.post('/addPaddler', function(req, res) {
        let data = req.body.data;
        db.addPaddler(data, res, function(results) {
           res.send(results);
        });
    })

    app.post('/updaterace', function(req, res) {
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

    app.post('/updateboatresult', function(req, res) {
        let data = req.body.data;
        db.updateBoatResult(data, res, function(results){
            res.send(results);
        });
    })

    app.post('/mass_updateboatresult', function(req, res) {
        let data = req.body.data;
        let response = [];
        for(let i = 0; i < data.length; i++){
            db.updateBoatResult(data[i], res, function(results){
                response.push(results);
            });
        }
        res.send(response);
    })

    app.post('/updateraceprocess', function(req, res) {
        let data = req.body.data;
        if(data.region != undefined){
            regionalAdvisorEmail(data.raceID, data.region, res);
        } else {
            db.updateProcess(data, res, function(results){
                res.send(results);
            });
        }

    })

    app.get('/accesspage', function(req, res) {
        let hash =  req.query.id;
        db.checkAccess(hash, res, function(results) {
            res.send(results);
        });
    })

    app.get('/getracepaddlers', function(req, res ) {
        let raceid = req.query.id;
        db.getRacePaddlers(raceid, res, function (results) {
            res.send(results);
        });
    })

    app.get('/clubbycode', function(req, res) {
        let code = req.query.code;
        db.getClubByCode(code, res, function(results){
            res.send(results);
        });
    })

    app.post('/insertclubpoints', function(req, res){
        let data = req.body.data;
        db.insertClubPoints(data, res, function(results) {
            res.send(results);
        })
    })

    app.post('/processresults', function(req, res) {
        try {

            let data = req.body.data;
            db.getBoatResult(data.raceID, res, function (results) {
                results = JSON.parse(results).response;
                let processType = req.body.data.processType;
                let raceID = req.body.data.raceID;
                let race_region;
                db.getRaceRegion(raceID, res, function (results) {
                    race_region = results[0].regionID;
                });


                var clubList = [];
                // sort into list of races
                let raceList = [];
                for (let i = 0; i < results.length; i++) {
                    let div = results[i].raceDivision;
                    clubList.push(results[i].clubID);
                    if (results[i].time === null) {
                        res.status(428).send("Not all times were filled in.");
                        return;
                    }
                    if (div.includes("_")) {
                        div = div[0] + "0";
                    } else {

                        div = div[0];
                    }
                    if (raceList[parseInt(div)] == null) {
                        raceList[parseInt(div)] = new Array();
                        raceList[parseInt(div)].push(results[i]);
                    } else {
                        raceList[parseInt(div)].push(results[i]);
                    }
                }

                let div123 = [];
                let div456 = [];
                let div78 = [];

                // loop over each race and order results by time
                for (let j = 0; j < raceList.length; j++) {
                    if (raceList[j] != null) {

                        raceList[j].sort(function (a, b) {
                            return parseInt(hmsToSeconds(a.time)) - parseInt(hmsToSeconds(b.time));
                        })

                        let race = raceList[j];

                        for (let y = 0; y < race.length; y++) {
                            let current = race[y];
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

                let promotion_div1div2 = [];
                let promotion_div2div3div4div5 = [];
                let promotion_div5div6div7div8 = [];
                let demotion_times = [];
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

                for (let x = 0; x < raceList.length; x++) {
                    if (raceList[x] != null) {
                        let resultList = raceList[x];
                        let startingPoints = 20;
                        let pos = 1;
                        let hundred_ten_percent = 10000;
                        let promotionCounter = 0;
                        for (let z = 0; z < resultList.length; z++) {
                            let current = resultList[z];
                            current.position = pos;

                            let paddlerInRegion = true;
                            let changeDiv = 0;
                            if (processType == 0) {

                                if (current.regionID == 0) {
                                    current.regionID = race_region;
                                }
                                if (race_region != current.regionID) {
                                    paddlerInRegion = false;
                                }

                                let div = current.raceDivision;
                                let time = hmsToSeconds(current.time);
                                let promote = false;
                                let demote = false;
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

                                if (changeDiv == 0 && promotionCounter == 0) {
                                    hundred_ten_percent = hmsToSeconds(current.time) * 1.1;
                                } else {
                                    promotionCounter++;
                                }

                                if (current.time.includes("RTD") || current.time.includes("DNS")) {
                                    current.points = "";
                                } else if (hmsToSeconds(current.time) > hundred_ten_percent && x != 9 && x != 90) {
                                    current.points = "1";
                                } else if (startingPoints < 2) {
                                    current.points = "2";
                                } else {
                                    current.points = startingPoints;
                                }

                                if (paddlerInRegion) {
                                    startingPoints--;
                                } else {
                                    current.points = "";
                                }


                                if (changeDiv > 0) {
                                    db.changePaddlerDiv(current.paddlerID, changeDiv, res, function (results) {

                                    });
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

                            db.updateBoatResultProcess(data, res, function (results) {
                                //console.log(results);
                                pos++;
                            });
                        }
                    }

                }
                // calculate club points
                clubList = [...new Set(clubList.map(x => x))];

                for (let i = 0; i < clubList.length; i++) {
                    db.getClubEntries(raceID, clubList[i], res, function (result) {
                        let clubEntries = JSON.parse(result).response;
                        clubEntries.sort(function (a, b) {
                            return parseInt(b.points) - (a.points);
                        })
                        let totalClub = 0;

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
                        db.updateClubPoints(data, res, function (results) {

                        })
                    });
                }
                res.status(200).send("complete");
            })
        } catch(error){
            res.status(400).send("bad request");
        }
    })

/*    app.get('/promotiondemotiontimes', function(req, res) {
        let raceid = req.query.id;
    }*/

    function regionalAdvisorEmail(raceID, region, res){
        console.log(region)
        db.getAdvisorEmail(region, res, function(results) {
            results = JSON.parse(results);
            let email = results.response[0].advisorEmail;
            let hash = crypto.randomBytes(50).toString('hex');
            let body = "Hello Regional Advisor,  \n\n" +
                "A set of race results have been submitted.\n" +
                "Please follow the link below to review the results and make changes.\n" +
                "http://localhost:8081/adminresult/" + raceID + "?auth=" + hash;
            mail.send(email, "Race Result Submission", body);
            let data = {
                email : email,
                accessType : 1,
                raceid : raceID
            }
            db.insertAccess(data, hash, res, function(results) {
                res.send(results);
            });

        })

    }

    function getDiv1Div2Times(div123){
        div123.sort(function(a, b) {
            return parseInt(hmsToSeconds(a.time)) - parseInt(hmsToSeconds(b.time));
        })

        let middle = div123[Math.floor(div123.length / 2)];
        let middle2;
        let midplaceTime = 0;
        if(div123.length % 2 === 0) {
            middle2 = div123[Math.floor(div123.length - 1 / 2)]
            midplaceTime = (parseInt(hmsToSeconds(middle.time) + parseInt(hmsToSeconds(middle2.time)))) / 2;
        } else {
            midplaceTime = middle;
        }
        let div1 = secondsToHMS(midplaceTime / 1.033);
        let div2 = secondsToHMS(midplaceTime / 1.117);
        let div3 = secondsToHMS(midplaceTime / 1.2);


        let longCourse = [hmsToSeconds(div1),hmsToSeconds(div2), hmsToSeconds(div3)];
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
        promotionTimes[1] = average * 1.067;
        promotionTimes[2] = average * 1.15;*/

        return average;
    }

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