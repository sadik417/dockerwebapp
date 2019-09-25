const express = require('express')
const bodyParser = require('body-parser')
const app = express();
const cors = require('cors')
const path = require('path')
const fs = require('fs')

const http = require('http').Server(app)
const io = require('socket.io')(http)
const UserProfile = require('./models/userSchema.js')
const mongoose = require('mongoose')

const reportGenerator = require('./utils/report.js')


app.use(cors())
app.use(express.static(path.join(__dirname, 'build')));
//app.use(express.static(path.join(__dirname)))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', (req, res) => {
  //res.sendFile(path.join(__dirname,'index.html'));
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
})


// var dotenv = require('dotenv')
// dotenv.config()

var mongoDBURL = process.env.NODE_MONGO_URL
mongoose.connect(mongoDBURL, { useNewUrlParser: true, useUnifiedTopology: true }, (err) => {
  console.log("Mongo DB Connected: ", err);

})
// //delete if db is full

// var db = mongoose.connection
// db.once('open', () => {
//   console.log('Deleteing old user profiles');
//   db.dropCollection('profiles', (err,res)=>{
//   if(err) console.log('Could not delete', err);
//    else if(res) console.log('Deleted Successfully')
//   })

// })





io.on('connection', (socket) => {
  console.log(`User id: ${socket.client.id} is connected to the server`);
})

app.get('/userProfiles', (req, res) => {
  UserProfile.find({}, (err, userProfiles) => {
    if (err) return res.sendStatus(500)
    if (userProfiles.length >= 0) {
      return res.send(userProfiles)
    }
  })
})

app.get('/d', (req, res) => {
  return res.download(path.join(__dirname, 'reports', '5d5d35b306315154cc3bdd3e.pdf'))
})

app.get('/downloadProfile', (req, res) => {
  try {
    var fileName;
    UserProfile.findById(req.query.id, (err, userProfile) => {
      if (err) {
        console.log('Error',err)
        return res.sendStatus(500)
      }
      else if (userProfile != null) {
        fileName = path.join(__dirname, 'reports', `${userProfile.id}.pdf`)
        reportGenerator(userProfile).then(()=>{
          res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename=' +`${userProfile.id}.pdf`,
          });
          var readStream = fs.createReadStream(fileName);
          readStream.pipe(res);
        }).catch(err=>{
          console.log('Error',err)
          res.sendStatus(500)})
      } else {
        console.log('Error',err)
        return res.sendStatus(500)
      }
    })
  } catch (err) {
    console.log('Error in catch', err)
    return res.sendStatus(500)
  }
})

app.post('/saveUserProfile', (req, res) => {
  try {
    //var userProfile = new UserProfile(req.body)
    UserProfile.findOneAndUpdate({ email: req.body.email }, req.body, { useFindAndModify: false }).
      then(userProfile => {
        if (null != userProfile) {
          io.emit('updatedProfile', userProfile.toJSON())
          return res.sendStatus(200)
        } else {
          new UserProfile(req.body).save()
            .then(useUserProfile => {
              io.emit('createdProfile', useUserProfile.toJSON())
              return res.sendStatus(200)
            }).catch(err => {
              res.sendStatus(500)
            })
        }
      }).catch(err => {
        res.sendStatus(500)
      })

  } catch (error) {
    console.error('error', error);
    return res.sendStatus(500)
  }
})

var PORT = process.env.REACT_APP_API_PORT || 9000
console.log('Env port', process.env.REACT_APP_API_PORT)
var server = http.listen(PORT, console.log("Server listening at: ", PORT));