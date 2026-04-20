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
const materioAssetsDir =
  "/Users/abc/Downloads/materio-bootstrap-html-admin-template/materio-bootstrap-html-admin-template/assets";
const imageOptions = [
  DEFAULT_IMAGE,
  "https://gcs.tripi.vn/public-tripi/tripi-feed/img/473672qrs/lan-ho-diep-581636.jpg",
];

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/provided-images", express.static(providedImagesDir));
app.use("/materio-assets", express.static(materioAssetsDir));

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

const normalizeTreeInput = (body) => ({
  treename: body.treename ? body.treename.trim() : "",
  description: body.description ? body.description.trim() : "",
  image: body.image ? body.image.trim() : "",
});

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getErrorMessage = (error) => {
  if (error && error.name === "CastError") {
    return "Khong tim thay san pham.";
  }

  return "Da xay ra loi. Vui long thu lai.";
};

const renderForm = (res, config) => {
  res.status(config.statusCode || 200).render("tree-form", {
    title: config.title,
    action: config.action,
    submitLabel: config.submitLabel,
    formHeading: config.formHeading,
    formDescription: config.formDescription,
    activePage: config.activePage || "create",
    formData: config.formData || { ...defaultForm },
    error: config.error || "",
    message: config.message || "",
    treeId: config.treeId || "",
    searchQuery: config.searchQuery || "",
    imageOptions,
  });
};

app.get("/", (req, res) => {
  return res.redirect("/trees");
});

app.get("/trees", async (req, res) => {
  const searchQuery = req.query.q ? req.query.q.trim() : "";
  const filter = searchQuery
    ? {
        $or: [
          { treename: { $regex: escapeRegex(searchQuery), $options: "i" } },
          { description: { $regex: escapeRegex(searchQuery), $options: "i" } },
        ],
      }
    : {};
  const trees = await Tree.find(filter).sort({ _id: -1 });
  res.render("trees-list", {
    title: "Danh sach san pham",
    activePage: "list",
    trees,
    error: "",
    message: req.query.message || "",
    searchQuery,
    imageOptions,
  });
});

app.get("/about", (req, res) => {
  res.render("about", {
    title: "Gioi thieu",
    activePage: "about",
    searchQuery: "",
  });
});

app.get("/trees/new", (req, res) => {
  renderForm(res, {
    title: "Them san pham",
    action: "/trees/add",
    submitLabel: "Them san pham",
    formHeading: "Tao moi san pham",
    formDescription: "Nhap thong tin cay canh de them vao he thong.",
    message: req.query.message || "",
    searchQuery: "",
  });
});

app.post("/trees/add", async (req, res) => {
  const { treename, description, image } = normalizeTreeInput(req.body);

  if (!treename || !description) {
    return renderForm(res, {
      statusCode: 400,
      title: "Them san pham",
      action: "/trees/add",
      submitLabel: "Them san pham",
      formHeading: "Tao moi san pham",
      formDescription: "Nhap thong tin cay canh de them vao he thong.",
      formData: { treename, description, image },
      error: "Ten san pham va mo ta la bat buoc.",
    });
  }

  await Tree.create({
    treename,
    description,
    image: image || DEFAULT_IMAGE,
  });

  return res.redirect("/trees?message=Them+san+pham+thanh+cong");
});

app.get("/trees/:id/edit", async (req, res) => {
  try {
    const tree = await Tree.findById(req.params.id);

    if (!tree) {
      return res.redirect("/trees?message=Khong+tim+thay+san+pham");
    }

    return renderForm(res, {
      title: "Cap nhat san pham",
      action: `/trees/${tree._id}/update`,
      submitLabel: "Luu thay doi",
      formHeading: "Chinh sua san pham",
      formDescription: "Cap nhat thong tin san pham theo du lieu moi nhat.",
      activePage: "edit",
      formData: {
        treename: tree.treename,
        description: tree.description,
        image: tree.image || DEFAULT_IMAGE,
      },
      treeId: tree._id.toString(),
    });
  } catch (error) {
    return res.redirect(`/trees?message=${encodeURIComponent(getErrorMessage(error))}`);
  }
});

app.post("/trees/:id/update", async (req, res) => {
  const { treename, description, image } = normalizeTreeInput(req.body);

  if (!treename || !description) {
    return renderForm(res, {
      statusCode: 400,
      title: "Cap nhat san pham",
      action: `/trees/${req.params.id}/update`,
      submitLabel: "Luu thay doi",
      formHeading: "Chinh sua san pham",
      formDescription: "Cap nhat thong tin san pham theo du lieu moi nhat.",
      activePage: "edit",
      treeId: req.params.id,
      formData: { treename, description, image },
      error: "Ten san pham va mo ta la bat buoc.",
    });
  }

  try {
    const updatedTree = await Tree.findByIdAndUpdate(
      req.params.id,
      {
        treename,
        description,
        image: image || DEFAULT_IMAGE,
      },
      { new: true }
    );

    if (!updatedTree) {
      return res.redirect("/trees?message=Khong+tim+thay+san+pham");
    }

    return res.redirect("/trees?message=Cap+nhat+san+pham+thanh+cong");
  } catch (error) {
    return renderForm(res, {
      statusCode: 400,
      title: "Cap nhat san pham",
      action: `/trees/${req.params.id}/update`,
      submitLabel: "Luu thay doi",
      formHeading: "Chinh sua san pham",
      formDescription: "Cap nhat thong tin san pham theo du lieu moi nhat.",
      activePage: "edit",
      treeId: req.params.id,
      formData: { treename, description, image },
      error: getErrorMessage(error),
    });
  }
});

app.post("/trees/:id/delete", async (req, res) => {
  try {
    const deletedTree = await Tree.findByIdAndDelete(req.params.id);

    if (!deletedTree) {
      return res.redirect("/trees?message=Khong+tim+thay+san+pham");
    }

    return res.redirect("/trees?message=Xoa+san+pham+thanh+cong");
  } catch (error) {
    return res.redirect(`/trees?message=${encodeURIComponent(getErrorMessage(error))}`);
  }
});

const deleteSelectedTrees = async (req, res) => {
  try {
    const rawIds = req.body.selectedTreeIds;
    const selectedTreeIds = Array.isArray(rawIds) ? rawIds : rawIds ? [rawIds] : [];

    if (!selectedTreeIds.length) {
      return res.redirect("/trees?message=Vui+long+chon+san+pham+can+xoa");
    }

    const validIds = selectedTreeIds.filter((id) => mongoose.Types.ObjectId.isValid(id));

    if (!validIds.length) {
      return res.redirect("/trees?message=Khong+co+san+pham+hop+le+de+xoa");
    }

    const result = await Tree.deleteMany({ _id: { $in: validIds } });
    return res.redirect(`/trees?message=Da+xoa+${result.deletedCount}+san+pham+duoc+chon`);
  } catch (error) {
    return res.redirect(`/trees?message=${encodeURIComponent(getErrorMessage(error))}`);
  }
};

app.post("/trees/delete-selected", deleteSelectedTrees);
app.post("/trees/delete-selected/", deleteSelectedTrees);

app.post("/trees/reset", async (req, res) => {
  await Tree.deleteMany({});
  return res.redirect("/trees?message=Da+xoa+toan+bo+san+pham");
});

app.listen(PORT, () => {
  console.log(`Tree Shop running at http://localhost:${PORT}`);
});
