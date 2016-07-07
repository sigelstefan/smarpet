var mysql = require("mysql");
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var fs = require('fs');
var xml2js = require('xml2js');

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json())

// First you need to create a connection to the db
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "center_db"
});

app.get('/smarpet/floor/settings', function (req, res) {
    var parser = new xml2js.Parser();
    fs.readFile(__dirname + '/settings.xml', function (err, data) {
        if (err) console.log(err);
        parser.parseString(data, function (err, result) {
            if (err) console.log(err);
            var json = JSON.stringify(result)
            res.send(json);
        });
    });
})

app.post('/smarpet/floor/settings', function (req, res) {

    var builder = require('xmlbuilder');
    var xml = builder.create('settings').ele(req.body).end({
        pretty: true
    });
    fs.writeFile('settings.xml', xml, function (err) {
        console.log(xml);
        if (err)
            return console.log(err);
    });

    res.sendStatus(200);
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});
