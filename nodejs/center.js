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

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "smarpet_center"
});


app.get('/smarpet/center/patients', function (req, res) {
    var query = "SELECT * FROM patient;";
    con.query(query, function (err, rows, fields) {
        res.send(JSON.stringify(rows));
    });
});

app.get('/smarpet/center/patient/:id/info', function (req, res) {
    var query = "SELECT * FROM patient WHERE id = " + req.params.id;
    con.query(query, function (err, rows, fields) {
        res.send(JSON.stringify(rows))
    });
});

app.get('/smarpet/center/patient/:id/contact', function (req, res) {
    var query = "SELECT * FROM contact WHERE id_patient = " + req.params.id;
    con.query(query, function (err, rows, fields) {
        res.send(JSON.stringify(rows))
    });
});

app.get('/smarpet/center/patient/:id/activities', function (req, res) {
    var query = "SELECT time, distance FROM activities WHERE time >= NOW() - INTERVAL 24 HOUR AND id_patient = " + req.params.id + " ORDER BY time asc;";
    con.query(query, function (err, rows, fields) {
        var result = [];
        for (var i in rows) {
            result.push([new Date(rows[i].time).getTime(), rows[i].distance]);
        }
        res.send(result)
    });
});

/**
 * READ, CREATE AND DELETE drugs of a patient
 */
app.get('/smarpet/center/patient/:id/drugs', function (req, res) {
    var query = "SELECT d.id, d.name FROM drug d JOIN patient_has_drug phd on d.id = phd.id_drug WHERE phd.id_patient = " + req.params.id;
    con.query(query, function (err, rows, fields) {
        res.send(JSON.stringify(rows))
    });
});
app.post('/smarpet/center/patient/drug/add', function (req, res) {
    var name = req.body.name;
    var patient = req.body.id;
    var query = "INSERT INTO drug (name) VALUES ('" + name + "')";
    con.query(query, function (err, rows, fields) {
        var query2 = "INSERT INTO patient_has_drug (id_patient, id_drug) VALUES (" + patient + "," + rows.insertId + ")";
        con.query(query2, function (err2, rows2, fields2) {
            res.send({
                id: rows.insertId
            });
        });
    });
});
app.post('/smarpet/center/patient/drug/remove', function (req, res) {
    var query = "DELETE FROM drug WHERE id = " + req.body.id;
    con.query(query, function (err, rows, fields) {
        res.send()
    });
});


/**
 * READ, CREATE AND DELETE diseases of a patient
 */
app.get('/smarpet/center/patient/:id/diseases', function (req, res) {
    var query = "SELECT d.id, d.name FROM disease d LEFT JOIN patient_has_disease phd on d.id = phd.id_disease WHERE phd.id_patient = " + req.params.id;
    con.query(query, function (err, rows, fields) {
        res.send(JSON.stringify(rows))
    });
});
app.post('/smarpet/center/patient/disease/add', function (req, res) {
    var name = req.body.name;
    var patient = req.body.id;
    var query = "INSERT INTO disease (name) VALUES ('" + name + "')";
    con.query(query, function (err, rows, fields) {
        var query2 = "INSERT INTO patient_has_disease (id_patient, id_disease) VALUES (" + patient + "," + rows.insertId + ")";
        con.query(query2, function (err2, rows2, fields2) {
            res.send({
                id: rows.insertId
            });
        });
    });
});
app.delete('/smarpet/center/patient/disease/remove', function (req, res) {
    var query = "DELETE FROM disease WHERE id = " + req.body.id;
    con.query(query, function (err, rows, fields) {
        res.send()
    });
});

app.get('/smarpet/center/emergencies', function (req, res) {
    var query = "SELECT e.id, e.time, p.firstname, p.lastname FROM emergency e LEFT JOIN patient p on e.id_patient = p.id ORDER BY e.time DESC;";
    con.query(query, function (err, rows, fields) {
        res.send(JSON.stringify(rows));
    });
});

app.get('/smarpet/center/emergencies/:id/details', function (req, res) {
    var query = "SELECT e.id, e.time, e.event, p.firstname as pFirstname, p.lastname as pLastname, p.Address as pAddress, p.Phone as pPhone, p.yearOfBirth, c.firstname as cFirstname, c.lastname as cLastname, c.address as cAddress, c.phone as cPhone FROM emergency e  LEFT JOIN patient p on e.id_patient = p.id LEFT JOIN contact c on p.id = c.id_patient WHERE e.id = " + req.params.id;
    con.query(query, function (err, rows, fields) {
        res.send(JSON.stringify(rows));
    });
});

app.get('/smarpet/center/checkemergency', function (req, res) {
    var query = "SELECT e.id as id, e.time as time, e.event as event, p.firstname as firstname, p.lastname as lastname FROM emergency e LEFT JOIN patient p ON e.id_patient=p.id WHERE e.called=0;";
    con.query(query, function (err, rows, fields) {
        if (rows.length > 0) {
            for (var i in rows) {
                var query2 = "UPDATE emergency SET called=1 WHERE id=" + rows[i].id + ";";
                con.query(query2);
            }
            res.send(rows);
        } else {
            res.send();
        }
    });
})

app.post('/smarpet/center/fall', function (req, res) {
    console.log(req.body.floorid);
    var today = new Date();
    today.setMonth(today.getMonth() + 1);
    var time = today.getFullYear() + "-" + today.getMonth() + "-" + today.getDate() + " " + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    console.log(time);
    var query = "SELECT id FROM patient WHERE floorid='" + req.body.floorid + "';";
    //var query = "SELECT p.id as pId, p.firstname as pFirstname, p.lastname as pLastname, c.firstname as cFirstname, c.lastname as cLastname, c.email as cEmail FROM patient p LEFT JOIN contact c ON p.id=c.id_patient WHERE p.floorid='" + req.body.floorid + "';";
    console.log(query);
    con.query(query, function (err, rows, fields) {
        if (rows.length > 0) {
            var query2 = "INSERT INTO emergency (time, event, id_patient) VALUES ('" + time + "','Sturz'," + rows[0].id + ")";
            con.query(query2, function (err2, rows2, fields2) {
                if (err2) {
                    console.log(err2);
                } else {
                    console.log("success");
                }
                res.send();
            });
        } else {
            console.log("floorid doesn't exist!!!");
            res.send();
        }
    });
});
app.post('/smarpet/center/stagger', function (req, res) {
    console.log(req.body.floorid);
    var today = new Date();
    today.setMonth(today.getMonth() + 1);
    var time = today.getFullYear() + "-" + today.getMonth() + "-" + today.getDate() + " " + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    console.log(time);
    var query = "SELECT id FROM patient WHERE floorid='" + req.body.floorid + "';";
    con.query(query, function (err, rows, fields) {
        if (rows.length > 0) {
            var query2 = "INSERT INTO emergency (time, event, id_patient) VALUES ('" + time + "','Schwindelgefühl'," + rows[0].id + ")";
            con.query(query2, function (err2, rows2, fields2) {
                if (err2) {
                    console.log(err2);
                } else {
                    console.log("success");
                }
                res.send();
            });
        } else {
            console.log("floorid doesn't exist!!!");
            res.send();
        }
    });
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});
