
const db = require('../../config/database');


module.exports = function(app) {
    'use strict';

    app.get('/race', function (req, res) {
        let x = req.query.id;
        db.getRaceResults(x, res, function(results) {
            res.send(JSON.stringify({"status": 200, "error": null, "response": results}));
        })
    });

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