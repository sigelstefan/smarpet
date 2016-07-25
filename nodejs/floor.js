var mysql = require("mysql");
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var fs = require('fs');
var xml2js = require('xml2js');

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

app.get('/smarpet/floor/settings', function (req, res) {
    var parser = new xml2js.Parser();
    fs.readFile(__dirname + '/settings.xml', function (err, data) {
        if (err){
            console.log("no file found");
            res.send();
        }
        else{
            parser.parseString(data, function (err, result) {
                if (err) console.log(err);
                var json = JSON.stringify(result)
                res.send(json);
            });
        }
    });
})


app.post('/smarpet/floor/settings/insert', function (req, res) {
    console.log("insert")

    //ZUERST IN DB
    //DANN IN XML
    var query = "INSERT INTO patient (firstname, lastname, address, phone, yearOfBirth, floorid) VALUES ('" + req.body.person.firstname + "','" + req.body.person.lastname + "','" + req.body.person.address + "','" + req.body.person.phone + "','" + req.body.person.yearOfBirth + "','" + req.body.person.floorid + "');";
    con.query(query, function (err, rows, fields) {
        console.log(err);
        var query2 = "INSERT INTO contact (firstname, lastname, address, phone, email, id_patient) VALUES ('" + req.body.contact.firstname + "','" + req.body.contact.lastname + "','" + req.body.person.address + "','" + req.body.contact.phone + "','" + req.body.contact.email + "'," + rows.insertId + ");";
        con.query(query2, function (err2, rows2, fields2) {
            console.log(err2);
            console.log(rows.insertId);
            var builder = require('xmlbuilder');
            req.body.person.id = rows.insertId;
            var xml = builder.create('settings').ele(req.body).end({
                pretty: true
            });
            fs.writeFile('settings.xml', xml, function (err) {
                console.log(err);
                res.send();
            });
        });
    });


});
app.post('/smarpet/floor/settings/update', function (req, res) {
    console.log("update")
    console.log(req.body.person.id);
        
    var query = "UPDATE patient SET firstname='"+req.body.person.firstname+"',lastname='"+req.body.person.lastname+"',address='"+req.body.person.address+"',phone='"+req.body.person.phone+"',yearOfBirth='"+req.body.person.yearOfBirth+"',floorid='"+req.body.person.floorid+"' WHERE id="+req.body.person.id+";"
    console.log(query);
    con.query(query, function(err, rows, fields){
        console.log(rows);
        var query2 = "UPDATE contact SET firstname='"+req.body.contact.firstname+"',lastname='"+req.body.contact.lastname+"',address='"+req.body.contact.address+"',phone='"+req.body.contact.phone+"',email='"+req.body.contact.email+"' WHERE id_patient="+req.body.person.id+";"
        con.query(query2, function(err2, rows2, fields2){
            console.log(rows2);
            var builder = require('xmlbuilder');
            var xml = builder.create('settings').ele(req.body).end({
                pretty: true
            });
            fs.writeFile('settings.xml', xml, function (err) {
                res.send();
            });
        });
    });
});

app.listen(3001, function () {
    console.log('Example app listening on port 3001!');
});
