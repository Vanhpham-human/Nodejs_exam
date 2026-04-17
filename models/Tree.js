const mongoose = require("mongoose");
const DEFAULT_IMAGE =
  "https://down-vn.img.susercontent.com/file/33b0649bf349dee1c54f59d35820c54b.webp";

const treeSchema = new mongoose.Schema(
  {
    treename: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: DEFAULT_IMAGE,
      trim: true,
    },
  },
  {
    collection: "TreeCollection",
  }
);

module.exports = mongoose.model("Tree", treeSchema);
