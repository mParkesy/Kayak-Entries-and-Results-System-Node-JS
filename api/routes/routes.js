
const db = require('../../config/database');


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

    app.get('/club', function (req, res) {
        let x = req.query.id;
        db.getClub(x, res, function(results) {
            res.send(results);
        })
    })

    app.get('/races', function (req, res) {
        db.getRaces(res, function(results) {
            res.send(results);
        })
    })

    app.get('/paddlers', function (req, res) {
        db.getPaddlers(res, function(results) {
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