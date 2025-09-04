const express = require("express");
const logger = require("morgan");
const mongoose = require("mongoose");
const Recipe = require("./models/Recipe.model");

const app = express();
const MONGODB_URI = "mongodb://127.0.0.1:27017/express-mongoose-recipes-dev";

// MIDDLEWARE
app.use(logger("dev"));
app.use(express.static("public"));
app.use(express.json());

// Iteration 1 - Connect to MongoDB
// DATABASE CONNECTION
mongoose
  .connect(MONGODB_URI)
  .then((x) => console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`))
  .catch((err) => console.error("Error connecting to mongo", err));

// ROUTES
//  GET  / route - This is just an example route
app.get("/", (req, res) => {
  res.send("<h1>LAB | Express Mongoose Recipes</h1>");
});

//  Iteration 3 - Create a Recipe route
//  POST  /recipes route
app.post("/recipes", async (req, res) => {
  console.log(req.body);

  const { title, instructions, level, ingredients, image, duration, isArchived, created } = req.body;

  // Basic field-by-field validation so the client knows exactly what's wrong
  const errors = {};
  const levelPath = Recipe.schema.path("level");
  const allowedLevels = (levelPath && (levelPath.enumValues || levelPath.options?.enum)) || [];
  //   const allowedLevels = ["Easy Peasy", "Amateur Chef", "UltraPro Chef"];

  if (!title || typeof title !== "string" || !title.trim()) {
    errors.title = "Title is required";
  }
  if (!instructions || typeof instructions !== "string" || !instructions.trim()) {
    errors.instructions = "Instructions are required";
  }
  if (level !== undefined && level !== null && !allowedLevels.includes(level)) {
    errors.level = `Level must be one of: ${allowedLevels.join(", ")}`;
  }
  if (ingredients !== undefined) {
    if (!Array.isArray(ingredients)) {
      errors.ingredients = "Ingredients must be an array of strings";
    } else if (!ingredients.every((i) => typeof i === "string")) {
      errors.ingredients = "Each ingredient must be a string";
    }
  }
  if (image !== undefined && typeof image !== "string") {
    errors.image = "Image must be a string URL";
  }
  if (duration !== undefined) {
    const isNum = typeof duration === "number" && !Number.isNaN(duration);
    if (!isNum) errors.duration = "Duration must be a number";
    else if (duration < 0) errors.duration = "Duration must be >= 0";
  }
  if (isArchived !== undefined && typeof isArchived !== "boolean") {
    errors.isArchived = "isArchived must be a boolean";
  }
  if (created !== undefined && Number.isNaN(new Date(created).getTime())) {
    errors.created = "created must be a valid date";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    const recipe = await Recipe.create({
      title,
      instructions,
      level,
      ingredients,
      image,
      duration,
      isArchived,
      created,
    });
    return res.status(201).json(recipe);
  } catch (err) {
    // Mongoose validation errors
    if (err && err.name === "ValidationError" && err.errors) {
      const fieldErrors = Object.keys(err.errors).reduce((acc, key) => {
        acc[key] = err.errors[key].message || "Invalid value";
        return acc;
      }, {});
      return res.status(400).json({ errors: fieldErrors });
    }
    // Duplicate key error for unique title
    if (err && err.code === 11000) {
      return res.status(400).json({ errors: { title: "Title must be unique" } });
    }
    console.error("POST /recipes error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

//  Iteration 4 - Get All Recipes
//  GET  /recipes route
app.get("/recipes", (req, res) => {
  Recipe.find()
    .then((response) => {
      // console.log(response)
      res.json(response);
    })
    .catch((error) => {
      // return res.status(500).json("")
      console.log(error);
    });
});

//  Iteration 5 - Get a Single Recipe
//  GET  /recipes/:id route
app.get("/recipes/:id", (req, res) => {
  console.log("params:", req.params);
  Recipe.findById(req.params.id)
    .then((response) => {
      // console.log(response)
      res.json(response);
    })
    .catch((error) => {
      // return res.status(500).json("")
      console.log(error);
      // res.status(500).json({ message: "Error getting one sinngle recipe" });
      res.status(500).send(error);
    });
});

//  Iteration 6 - Update a Single Recipe
//  PUT  /recipes/:id route
app.patch("/recipes/:id", async (req, res) => {
  // console.log(req.body)
  // console.log("params:", req.params)
  try {
    const updatedRecipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      // { propertyToUpdate: newValue }
      req.body,
      { new: true }
    );
    console.log("updated Recipe", updatedRecipe);
    res.status(201).json(updatedRecipe);
  } catch (err) {
    console.error("PATCH /recipes error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

//  Iteration 7 - Delete a Single Recipe
//  DELETE  /recipes/:id route
app.delete("/recipes/:id", async (req, res) => {
  try {
    const response = await Recipe.findByIdAndDelete(req.params.id)
    res.status(202).json({message: `Recipe deleted: ${response}`});
  } catch (error) {
    console.log(error)
    res.status(500).send(error);
  }
});

// Start the server
app.listen(3000, () => console.log("My first app listening on port 3000!"));

//❗️DO NOT REMOVE THE BELOW CODE
module.exports = app;
