require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.39yqdr4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Global client and collections for reuse in serverless
let client;
let coffeeCollection;
let userCollection;

async function connectToDB() {
  if (client && client.topology && client.topology.isConnected()) {
    return { coffeeCollection, userCollection };
  }

  try {
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });

    await client.connect();
    console.log("✅ MongoDB connected successfully!");

    const database = client.db("Coffee-collection");
    coffeeCollection = database.collection("coffee");
    userCollection = database.collection("users");

    return { coffeeCollection, userCollection };
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    throw error;
  }
}

// Routes — সব routes connection-এর বাইরে, যাতে register হয়
app.get("/", (req, res) => {
  res.send("☕ Coffee Store Server is running successfully!");
});

// Coffee Routes
app.get("/coffee", async (req, res) => {
  try {
    const { coffeeCollection } = await connectToDB();
    const result = await coffeeCollection.find({}).toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch coffees" });
  }
});

app.get("/coffee/:id", async (req, res) => {
  try {
    const { coffeeCollection } = await connectToDB();
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid ID format" });
    }
    const query = { _id: new ObjectId(id) };
    const result = await coffeeCollection.findOne(query);
    if (!result) {
      return res.status(404).send({ message: "Coffee not found" });
    }
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Server error" });
  }
});

app.post("/coffee", async (req, res) => {
  try {
    const { coffeeCollection } = await connectToDB();
    const result = await coffeeCollection.insertOne(req.body);
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to add coffee" });
  }
});

app.put("/coffee/:id", async (req, res) => {
  try {
    const { coffeeCollection } = await connectToDB();
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid ID format" });
    }
    const updateDoc = {
      $set: req.body,
    };
    const query = { _id: new ObjectId(id) };
    const result = await coffeeCollection.updateOne(query, updateDoc, {
      upsert: true,
    });
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to update coffee" });
  }
});

app.delete("/coffee/:id", async (req, res) => {
  try {
    const { coffeeCollection } = await connectToDB();
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid ID format" });
    }
    const query = { _id: new ObjectId(id) };
    const result = await coffeeCollection.deleteOne(query);
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to delete coffee" });
  }
});

// User Routes
app.post("/users", async (req, res) => {
  try {
    const { userCollection } = await connectToDB();
    const result = await userCollection.insertOne(req.body);
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to create user" });
  }
});

app.get("/users", async (req, res) => {
  try {
    const { userCollection } = await connectToDB();
    const result = await userCollection.find({}).toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch users" });
  }
});

app.delete("/users/:id", async (req, res) => {
  try {
    const { userCollection } = await connectToDB();
    const id = req.params.id;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid ID" });
    }
    const query = { _id: new ObjectId(id) };
    const result = await userCollection.deleteOne(query);
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to delete user" });
  }
});

app.patch("/users", async (req, res) => {
  try {
    const { userCollection } = await connectToDB();
    const { email, lastSignInTime } = req.body;
    if (!email) {
      return res.status(400).send({ message: "Email is required" });
    }
    const filter = { email };
    const updateDoc = { $set: { lastSignInTime } };
    const result = await userCollection.updateOne(filter, updateDoc);
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to update user" });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global Error:", err.stack);
  res.status(500).send({ message: "Something went wrong!" });
});

// Vercel-এর জন্য export (অবশ্যই)
module.exports = app;

// লোকালে চালালে listen করবে
if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`🚀 Local server running on port ${port}`);
  });
}
