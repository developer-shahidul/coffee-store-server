require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.39yqdr4.mongodb.net/?appName=Cluster0`;

// MongoClient setup
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Collections (will be assigned after connection)
let coffeeCollection;
let userCollection;

// Main async function to connect and setup routes
async function run() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("✅ Successfully connected to MongoDB!");

    const database = client.db("Coffee-collection");
    coffeeCollection = database.collection("coffee");
    userCollection = database.collection("users");

    // ==================== Coffee Routes ====================

    // Get all coffees
    app.get("/coffee", async (req, res) => {
      try {
        const result = await coffeeCollection.find({}).toArray();
        console.log(`📋 Fetched ${result.length} coffees`);
        res.send(result);
      } catch (error) {
        console.error("❌ Error fetching coffees:", error);
        res.status(500).send({ message: "Failed to fetch coffees" });
      }
    });

    // Get single coffee by ID
    app.get("/coffee/:id", async (req, res) => {
      try {
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
        console.error("❌ Error fetching coffee:", error);
        res.status(500).send({ message: "Server error" });
      }
    });

    // Add new coffee
    app.post("/coffee", async (req, res) => {
      try {
        const newCoffee = req.body;
        const result = await coffeeCollection.insertOne(newCoffee);
        res.send(result);
      } catch (error) {
        console.error("❌ Error adding coffee:", error);
        res.status(500).send({ message: "Failed to add coffee" });
      }
    });

    // Update coffee (PUT)
    app.put("/coffee/:id", async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ message: "Invalid ID format" });
        }
        const updatedCoffee = req.body;
        const query = { _id: new ObjectId(id) };

        const updateDoc = {
          $set: {
            name: updatedCoffee.name,
            chef: updatedCoffee.chef,
            supplier: updatedCoffee.supplier,
            taste: updatedCoffee.taste,
            category: updatedCoffee.category,
            details: updatedCoffee.details,
            photo: updatedCoffee.photo,
          },
        };

        const result = await coffeeCollection.updateOne(query, updateDoc, {
          upsert: true,
        });
        res.send(result);
      } catch (error) {
        console.error("❌ Error updating coffee:", error);
        res.status(500).send({ message: "Failed to update coffee" });
      }
    });

    // Delete coffee
    app.delete("/coffee/:id", async (req, res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ message: "Invalid ID format" });
        }
        const query = { _id: new ObjectId(id) };
        const result = await coffeeCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        console.error("❌ Error deleting coffee:", error);
        res.status(500).send({ message: "Failed to delete coffee" });
      }
    });

    // ==================== User Routes ====================

    // Create or update user (usually after login)
    app.post("/users", async (req, res) => {
      try {
        const user = req.body;
        const result = await userCollection.insertOne(user);
        console.log("👤 New user created:", user.email);
        res.send(result);
      } catch (error) {
        console.error("❌ Error creating user:", error);
        res.status(500).send({ message: "Failed to create user" });
      }
    });

    // Get all users (admin use)
    app.get("/users", async (req, res) => {
      try {
        const result = await userCollection.find({}).toArray();
        res.send(result);
      } catch (error) {
        console.error("❌ Error fetching users:", error);
        res.status(500).send({ message: "Failed to fetch users" });
      }
    });

    // Delete user
    app.delete("/users/:id", async (req, res) => {
      try {
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

    // Update last sign-in time (PATCH)
    app.patch("/users", async (req, res) => {
      try {
        const { email, lastSignInTime } = req.body;
        if (!email) {
          return res.status(400).send({ message: "Email is required" });
        }
        const filter = { email };
        const updateDoc = {
          $set: { lastSignInTime },
        };
        const result = await userCollection.updateOne(filter, updateDoc);
        res.send(result);
      } catch (error) {
        console.error("❌ Error updating user:", error);
        res.status(500).send({ message: "Failed to update user" });
      }
    });

    // Ping to confirm connection
    await client.db("admin").command({ ping: 1 });
    console.log("🔔 MongoDB ping successful!");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
  }
}

// Run the setup
run();

// Root route
app.get("/", (req, res) => {
  res.send("☕ Coffee Store Server is running successfully!");
});

// Global error handler (must be after all routes)
app.use((err, req, res, next) => {
  console.error("Global Error:", err.stack);
  res.status(500).send({ message: "Something went wrong on the server!" });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server is running on port: ${port}`);
});

// Optional: export for testing
module.exports = app;
