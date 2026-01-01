require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// middlewareWrapper
app.use(express.json());
app.use(cors());

// dotenv
// console.log(process.env.DB_USER);
// console.log(process.env.DB_PASS);
// wBSUkSn8eSMX5gwP
//coffeeMaster

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.39yqdr4.mongodb.net/?appName=Cluster0`;
// console.log(uri);

// const uri =
//   "mongodb+srv://coffeeMaster:wBSUkSn8eSMX5gwP@cluster0.39yqdr4.mongodb.net/?appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let coffeeConnection;
let userCollection;

async function run() {
  try {
    await client.connect();

    const database = client.db("Coffee-collection");

    coffeeConnection = database.collection("coffee");
    userCollection = database.collection("users");

    app.get("/coffee", async (req, res) => {
      const cursor = coffeeConnection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    //   update
    app.get("/coffee/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await coffeeConnection.findOne(query);
      res.send(result);
    });
    app.put("/coffee/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedCoffee = req.body;
      const coffee = {
        $set: {
          name: updatedCoffee.name,
          chef: updatedCoffee.chef,
          supplier: updatedCoffee.supplier,
          taste: updatedCoffee.taste,
          photo: updatedCoffee.photo,
          details: updatedCoffee.details,
          category: updatedCoffee.category,
        },
      };
      const result = await coffeeConnection.updateOne(query, coffee, options);
      res.send(result);
    });

    // post
    app.post("/coffee", async (req, res) => {
      const body = req.body;
      // console.log(body);
      const result = await coffeeConnection.insertOne(body);
      res.send(result);
    });

    // delete
    app.delete("/coffee/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await coffeeConnection.deleteOne(query);
      res.send(result);
    });

    // users aer jonno
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      console.log("create new user", newUser);
      const result = await userCollection.insertOne(newUser);
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const cursor = userCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    app.patch("/users", async (req, res) => {
      const email = req.body.email;
      const filter = { email };
      const updateDoc = {
        $set: {
          lastSignInTime: req.body?.lastSignInTime,
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("server site successfully run");
});

// নিচে app.listen এর আগে যোগ করো
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: "Something went wrong!" });
});

app.listen(port, () => {
  console.log(`server is run on port : ${port}`);
});

module.exports = app;
