import express from 'express'
import sqlite3 from 'sqlite3'
import path from "path"
import bcrypt from 'bcrypt'




const BadChars = ["'", '"', "-", "#", "*", "/", ";", "=", "(", ")", "+", "%", "&", "^"]
const app = express();
const __dirname = import.meta.dirname;
const port = 443

async function HashPassword(Password) {
    const salt = bcrypt.genSaltSync(10)
    const hash = await bcrypt.hash(Password, salt)
    const hashString = hash.toString()
    console.log("Hashing password...")
    return hashString
}

async function Signup(username, Password, rows) {
    if ( rows == "" ) {
      console.log("No previous user made with account name")
      console.log("Checking signup...")
      const charCheck = BadChars.some(char => username.includes(char))
      if ( charCheck == false && Password != "") {
        HashPassword(Password).then(hashedPassword => {
          const db = new sqlite3.Database('./userbase.db', sqlite3.OPEN_READWRITE, (err) => {
          if (err) return console.log("error")
          });
          db.run('INSERT INTO users(name, permissions, password) VALUES (?,?,?)', [username, 1, hashedPassword])
          console.log("Successfully created a user!")
          return 1;
        })
      }
    }
    else if ( rows != "" ) {
      return 0;
    }
}

async function dbCheck(username, password) {
  const db = new sqlite3.Database('./userbase.db', sqlite3.OPEN_READWRITE, (err) => {
  if (err) return console.log("error")
  });
  const rows = db.all('SELECT * FROM users WHERE name = ?', [username], function(error, rows) {
  console.log(rows)
  Signup(username, password, rows)
  })
}

async function passwordrows(rows) {
  if (rows != "") {
    return 1
  } else if (rows == "") {
    return 0
  }
}

async function ThreadToDataBase(Txt, Title, usr) {
  const db = new sqlite3.Database('./userbase.db', sqlite3.OPEN_READWRITE, (err) => {
  if (err) return console.log("error")
  });
  db.run('INSERT INTO Posts(title, text, user) VALUES (?,?,?)', [Title, Txt, usr])
  
}

app.use('/static', express.static(path.join(__dirname + '/static'),),)
app.use('/pages', express.static(path.join ( __dirname + '/pages'),),)
app.use('/index.html', express.static(path.join(__dirname + '/index.html'),),)
app.use(express.json())


app.get('/', (req, res) => {
  console.log("sent")
  res.sendFile('/index.html', { root: __dirname });
});

app.use(function (req, res, next) {
    console.log("Middleware called");
    next();
});

app.post('/api/signup', async (req, res) => {
  console.log("Got Request in /api/signup")
  const SignupValues = req.body;
  // Returns two values, "User", "Password"
  console.log(SignupValues)
  console.log(SignupValues.User + " : Is the username")
  console.log(SignupValues.Password + " : Is the Password")
  // Now you check the database for validity then send a json with text and cookie values
  const db = new sqlite3.Database('./userbase.db', sqlite3.OPEN_READWRITE, (err) => {
  if (err) return console.log("error")
  });
  dbCheck(SignupValues.User, SignupValues.Password).then(res.send("You have successfully signed up as" + " " + SignupValues.User))
});
// NEED TO ADD COOKIES + ERROR MESSAGE FOR FAILED LOGIN

app.post('/api/login', async (req, res) => {
  console.log("Got Request in /api/login")
  const LoginValues = req.body;
  // Returns two values, "User", "Password"
  console.log(LoginValues)
  console.log(LoginValues.User + " : Is the username")
  console.log(LoginValues.Password + " : Is the Password")
  const db = new sqlite3.Database('./userbase.db', sqlite3.OPEN_READWRITE, (err) => {
  if (err) return console.log("error")
  });
  console.log("Getting db with user "+LoginValues.User)
  db.get('SELECT password FROM users WHERE name = ?', [LoginValues.User], function(error, rows) {
    try {
     console.log("fuck everythong")
     console.log(rows)
     console.log(rows.password + ": in try func")
     bcrypt.compare(LoginValues.Password, rows.password, (err, result) => {
      console.log(result + " is the result")
      if (result) {
      
      console.log("Match")
      res.send("You have successfully signed up as" + " " + LoginValues.User)
    } else if (err) {
      console.log("not a match")
      res.send("Failed to log in as" + " " + LoginValues.User)
    }
  }) 
  } catch {
    console.log("returning a zero")
    res.send("Failed to log in as" + " " + LoginValues.User)
  }
  })
})

app.post('/api/hash', async (req, res) => {
  const hash = req.body.id.toString()
  console.log(hash + " Is the id to hash")
    const user = req.body.user;
    HashPassword(hash).then(hashed => {
      const db = new sqlite3.Database('./userbase.db', sqlite3.OPEN_READWRITE, (err) => {
      if (err) return console.log("error")
      });
      const cookie=hashed+user
      console.log(cookie)
      db.run('UPDATE users SET cookieID = ? WHERE name = ?', [cookie, user])
      res.send(cookie)
  })
})
//60 characters in cookie hash
app.post('/api/Thread', async (req, res) => {
  const Title = req.body.Title
  const Txt = req.body.Txt
  const cookie = req.body.cookie
  console.log(Title + " " + Txt)
  if ( Title.length < 20 && Txt.length < 500 && Title.length > 0 && Txt.length > 0) {

      try {
        const db = new sqlite3.Database('./userbase.db', sqlite3.OPEN_READWRITE, (err) => {
        if (err) return console.log("error")
        });
        
        db.get('SELECT name FROM users WHERE cookieID = ?', [cookie], function(error, rows) {
        if (rows != "" && typeof rows !== "undefined") {
          console.log(rows)
          ThreadToDataBase(Txt,Title, rows.name)
          res.send("1")
        } else {
          res.send("2")
        }
        })
      } catch {
        res.send("2")
      }
  } else {
    res.send("0")
  }
})

app.post('/api/getThreads', async (req,res) => {
  const page = req.body.page
  console.log(page)
  const db = new sqlite3.Database('./userbase.db', sqlite3.OPEN_READWRITE, (err) => {
  if (err) return console.log("error")
  });
  const min = 1+(page*10)-10
  const max = 10*page
  console.log(min + " :" + max + ", Is the range")
  db.all(`SELECT p.*, t.total
              FROM Posts p
              CROSS JOIN (SELECT COUNT(id) AS total FROM Posts) t
              WHERE p.id BETWEEN ? AND ?;
`, [min, max], async function(err,rows) {
      console.log(rows)
      res.send(rows)
  })
})


app.listen(port, function(err){
    if (err) {
      console.log("Server setup Error") 
      console.log(err)
    } else {
      console.log("Server listening on Port: ", port)
    }
})