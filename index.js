const e = require("express");
const express = require("express");
const mysql = require("mysql");
const app = express();
const bodyParser = require("body-parser");
const pool = mysql.createPool({
  connectionLimit: 10,
  password: "Elevator12*",
  user: "root",
  database: "mikesapp",
  host: "localhost",
  port: "3306",
});

app.get("/", function (req, res) {
  return res.send("Hello world");
});

app.listen(() => {
  console.log(`server is listening  on 8080`);
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended:true
}))

app.post("/register", async function (req, res) {
  try {
    console.log(req.body)
    const email = req.body.email;
    const password = req.body.password;
    const osztaly = req.body.osztaly;
    var sql = "INSERT INTO users (email,password,osztaly_id) VALUES ?";
    var check_email = "[a-zA-Z0-9]{0,}([.]?[a-zA-Z0-9]{1,})[@](mikeslici.ro)";
    var patt = new RegExp(check_email);
    var result = patt.test(email);
    const bcrypt = require("bcrypt");
    var hashdpassword;
    const hash = bcrypt.hashSync(password, 5);
    console.log(hash);
    var values = [[email, hash, osztaly]];
    if (!result) {
      res.json({ error: "Nem mikeslicis E-mail" });
    } else {
      pool.query(
        "SELECT COUNT(*) AS cnt FROM users WHERE email = ? ",
        email,
        function (err, data) {
          if (err) {
            throw err;
          } else {
            if (data[0].cnt > 0) {
              res.json({ error: "E-mail already exists" });
            } else {
              pool.query(sql, [values], function (err, result) {
                if (err) throw err;
                console.log("1 record inserted");
                res.json({
                  succes: "User is registered",
                });
              });
            }
          }
        }
      );
    }
  } catch (error) {
    console.log(error);
    res.json({
      error: error,
    });
  }
});

app.post("/login", async function (req, res) {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const bcrypt = require("bcrypt");
    var hash;
    pool.query(
      "SELECT password, osztaly_id from users where email = ?",
      [email],
      function (err, result) {
        if (err) throw err;
        hash = result[0].password;
        
        bcrypt.compare(password, hash, (err, data) => {
          if (err) throw err
          if (data) {
              return res.status(200).json({ msg: result[0].osztaly_id })
          } else {
              return res.status(401).json({ msg: "Invalid credencial" })
          }
      });
      }
    );

  } catch (err) {
    console.log(err);
    res.json({ error: err });
  }
});
app.get("/classes", async function(req,res){
  try{
   pool.query("SELECT * from osztalyok",function (err, rows) {
    if (err) {
      res.json({
        'error': err
      })
    } else {
      res.json({
        'classes': rows
      })
    }
    });
  }
  catch(err){
    console.log(err);
    res.json({error: err});
  }
})
app.get("/orak", async function(req,res){
  try{
    const osztaly_id =req.headers.osztaly_id;
    pool.query("SELECT nap, ora, tantargy, nev from orarendek,napok,tantargyak,tanarok where orarendek.nap_id=napok.id and orarendek.tantargy_id=Tantargyak.id and orarendek.tanar_id=tanarok.id group by osztaly_id, nap_id, ora, tanar_id, tantargy_id HAVING osztaly_id = ? order by nap_id ASC, ora DESC",[osztaly_id],function(err,rows){
      if(err){
        res.json({
          'error' : err
        }) 
      }
      else{
      
        res.json({
          'orak': rows
        })
    }
    })
  }
  catch(err){
    console.log(err);
    res.json({error: err})
  }
})
app.listen(process.env.PORT || 8080);

