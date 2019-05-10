const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const router = express.Router();
const app = express();
var bodyParser = require('body-parser'); 
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());


// get database details and connect to database
const db = require('./config/database');
db.connectDatabase();

var cors = require('cors')
app.use(cors())

const allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Access-Control-Allow-Headers', '*');
    next();
}
app.use(allowCrossDomain)

// include routes for api
require('./api/routes')(app);

app.use(logger('dev'));
app.use(cookieParser());

module.exports = app;
