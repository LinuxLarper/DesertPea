import express from 'express'
import sqlite3 from 'sqlite3'
import path from "path"
import { error } from 'console';

const app = express();
const __dirname = import.meta.dirname;
const port = 3001
const db = new sqlite3.Database('./userbase.db', sqlite3.OPEN_READWRITE, (err) => {
  if (err) return console.log("you fucked up")
});


async function HashPassword(Password) {
    const salt = bcrypt.genSaltSync(10)
    const hash = await bcrypt.hash(Password, salt)

    console.log({
        password, hash
    })  
}


// Returns true for a clean username
async function SearchSqlForUser(username) {
  const db = new sqlite3.Database('./userbase.db', sqlite3.OPEN_READWRITE, (err) => {
  if (err) return console.log("error")
  });

  db.all('SELECT * FROM users WHERE name = ?', [username], function (error, rows) {
    if (error) {
      console.log("error");
    }
    if (rows == "") {
      console.log("True")
      return 1;
    } else {
      console.log("False")
      return 0;
    }
  })
}

db.run('INSERT INTO users(name, permissions, password) VALUES (?,?,?)', ["1", 1, "iamL"])

app.use('/static', express.static(path.join(__dirname + '/static'),),)
app.use('/pages', express.static(path.join ( __dirname + '/pages'),),)
app.use('/index.html', express.static(path.join(__dirname + '/index.html'),),)

app.get('/', (req, res) => {
  console.log("sent")
  res.sendFile('/index.html', { root: __dirname });
});

app.use(function (req, res, next) {
    console.log("Middleware called");
    next();
});

app.get('/signup', async (req, res) => {
  const username = req.query.Username
  const password = req.query.Password 
  const db = new sqlite3.Database('./userbase.db', sqlite3.OPEN_READWRITE, (err) => {
  if (err) return console.log("error")
  });

  db.all('SELECT * FROM users WHERE name = ?', [username], function (error, rows) {
    if (error) {
      console.log("error");
    }
    if (rows == "") {
      console.log("True")
      
    } else if (rows != "") {
      console.log("False")
      return 0;
    }
  })
});


app.listen(port, function(err){
    if (err) console.log("Server setup Error")
    console.log("Server listening on Port: ", port)
})