var mysql = require("mysql");
var express = require('express');
var bodyParser = require('body-parser');
var dateFormat = require('dateformat');
var app = express();

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "POST, GET");

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
    password: "",
    database: "smarpet_center"
});

app.get('/smarpet/center/patients', function (req, res) {
    var query = "SELECT * FROM patient;";
    con.query(query, function(err, rows, fields) {
        res.send(JSON.stringify(rows));
    });
});

app.get('/smarpet/center/patient/:id/info', function (req, res) {
    var query = "SELECT * FROM patient WHERE id = " + req.params.id;
    con.query(query, function(err, rows, fields) {
        res.send(JSON.stringify(rows))
    });
});

app.get('/smarpet/center/patient/:id/contact', function (req, res) {
    var query = "SELECT * FROM contact WHERE id_patient = " + req.params.id;
    con.query(query, function(err, rows, fields) {
        res.send(JSON.stringify(rows))
    });
});

app.get('/smarpet/center/patient/:id/activities', function (req, res){
    var query = "SELECT time, distance FROM activities WHERE time >= NOW() - INTERVAL 24 HOUR AND id_patient = " + req.params.id + " ORDER BY time asc;";
    con.query(query, function(err, rows, fields) {
        var result = [];
        for(var i in rows){
            result.push([new Date(rows[i].time).getTime(),rows[i].distance]);
        }
        res.send(result)
    });
});

/**
* READ, CREATE AND DELETE drugs of a patient
*/
app.get('/smarpet/center/patient/:id/drugs', function (req, res) {
    var query = "SELECT d.id, d.name FROM drug d JOIN patient_has_drug phd on d.id = phd.id_drug WHERE phd.id_patient = " + req.params.id;
    con.query(query, function(err, rows, fields) {
        res.send(JSON.stringify(rows))
    });
});
app.post('/smarpet/center/patient/drug/add',function(req,res){
    var name = req.body.name;
    var patient = req.body.id;
    var query = "INSERT INTO drug (name) VALUES ('" + name + "')";
    con.query(query, function(err, rows, fields) {
        var query2 = "INSERT INTO patient_has_drug (id_patient, id_drug) VALUES (" + patient + "," + rows.insertId + ")";
        con.query(query2, function(err2, rows2, fields2) {
            res.send({ id:rows.insertId });
        });
    });
});
app.post('/smarpet/center/patient/drug/remove',function(req,res){
    var query = "DELETE FROM drug WHERE id = " + req.body.id;
    con.query(query, function(err, rows, fields) {
        res.send()
    });
});


/**
* READ, CREATE AND DELETE diseases of a patient
*/
app.get('/smarpet/center/patient/:id/diseases', function (req, res) {
    var query = "SELECT d.id, d.name FROM disease d LEFT JOIN patient_has_disease phd on d.id = phd.id_disease WHERE phd.id_patient = " + req.params.id;
    con.query(query, function(err, rows, fields) {
        res.send(JSON.stringify(rows))
    });
});
app.post('/smarpet/center/patient/disease/add',function(req,res){
    var name = req.body.name;
    var patient = req.body.id;
    var query = "INSERT INTO disease (name) VALUES ('" + name + "')";
    con.query(query, function(err, rows, fields) {
        var query2 = "INSERT INTO patient_has_disease (id_patient, id_disease) VALUES (" + patient + "," + rows.insertId + ")";
        con.query(query2, function(err2, rows2, fields2) {
            res.send({ id:rows.insertId });
        });
    });
});
app.delete('/smarpet/center/patient/disease/remove',function(req,res){
    var query = "DELETE FROM disease WHERE id = " + req.body.id;
    con.query(query, function(err, rows, fields) {
        res.send()
    });
});

app.get('/smarpet/center/emergencies', function (req, res) {
    var query = "SELECT e.id, e.time, p.firstname, p.lastname FROM emergency e LEFT JOIN patient p on e.id_patient = p.id;";
    con.query(query, function(err, rows, fields) {
        res.send(JSON.stringify(rows));
    });
});

app.get('/smarpet/center/emergencies/:id/details', function(req, res){
    var query = "SELECT e.id, e.time, e.event, p.firstname as pFirstname, p.lastname as pLastname, p.Address as pAddress, p.Phone as pPhone, p.yearOfBirth, c.firstname as cFirstname, c.lastname as cLastname, c.address as cAddress, c.phone as cPhone FROM emergency e  LEFT JOIN patient p on e.id_patient = p.id LEFT JOIN contact c on p.id = c.id_patient WHERE e.id = " + req.params.id;
    con.query(query, function(err, rows, fields) {
        res.send(JSON.stringify(rows));
    });
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});