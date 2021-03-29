const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()

const port = 5000;
const app = express();

app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(cors());

// Firebase Config & Initialization
const serviceAccount = require("./configs/burj-al-arab-d81c4-firebase-adminsdk-3eia9-b47d3e5b19.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.iohsv.mongodb.net/${process.env.DB_PASS}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


app.get('/', (req, res) => {
    res.send('Hello World!')
})


client.connect(err => {
  const collection = client.db("BaArabDB").collection("bookings");

  app.post('/addBooking', (req, res) => {
    collection.insertOne(req.body)
    .then(result => {
        res.send( result.insertedCount > 0)
    });

  });

  app.get('/bookings', (req,res) => {
      const bearer = req.headers.authorization;
      if(bearer && bearer.startsWith('Bearer ')){
        const idToken = bearer.split(' ')[1];
        
        // idToken comes from the client app
        admin.auth().verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          if(tokenEmail == req.query.email){
            collection.find({email: req.query.email})
            .toArray((err, documents) => {
                res.status(200).send(documents);
            });
          }
        })
        .catch((error) => {
          res.status(401).send('Un-authorized Accesss');
        });
      }else{
        res.status(401).send('Un-authorized Accesss');
      }
      

  });

//   console.log('Database Connected:', client.isConnected());
//   client.close();
});


app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`)
})