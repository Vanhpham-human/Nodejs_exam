const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const Tree = require("./models/Tree");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/TreeShop";
const DEFAULT_IMAGE =
  "https://down-vn.img.susercontent.com/file/33b0649bf349dee1c54f59d35820c54b.webp";
const providedImagesDir =
  "/Users/abc/.cursor/projects/Users-abc-Documents-Nodejs-exam/assets";

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/provided-images", express.static(providedImagesDir));

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB TreeShop database.");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
  });

const defaultForm = {
  treename: "",
  description: "",
  image: DEFAULT_IMAGE,
};

app.get("/", async (req, res) => {
  const trees = await Tree.find().sort({ _id: -1 });
  res.render("index", {
    title: "Tree Shop",
    trees,
    formData: { ...defaultForm },
    error: "",
    message: "",
    imageOptions: [
      DEFAULT_IMAGE,
      "https://gcs.tripi.vn/public-tripi/tripi-feed/img/473672qrs/lan-ho-diep-581636.jpg",
    ],
  });
});

app.get("/about", (req, res) => {
  res.render("about", { title: "About me" });
});

app.post("/trees/add", async (req, res) => {
  const treename = req.body.treename ? req.body.treename.trim() : "";
  const description = req.body.description ? req.body.description.trim() : "";
  const image = req.body.image ? req.body.image.trim() : "";

  if (!treename || !description) {
    const trees = await Tree.find().sort({ _id: -1 });
    return res.status(400).render("index", {
      title: "Tree Shop",
      trees,
      formData: { treename, description, image },
      error: "Tree Name and Description are required.",
      message: "",
      imageOptions: [
        DEFAULT_IMAGE,
        "https://gcs.tripi.vn/public-tripi/tripi-feed/img/473672qrs/lan-ho-diep-581636.jpg",
      ],
    });
  }

  await Tree.create({
    treename,
    description,
    image: image || DEFAULT_IMAGE,
  });

  return res.redirect("/");
});

app.post("/trees/reset", async (req, res) => {
  await Tree.deleteMany({});
  return res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Tree Shop running at http://localhost:${PORT}`);
});
