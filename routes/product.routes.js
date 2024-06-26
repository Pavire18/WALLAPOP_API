const express = require("express");

// Modelos
const { Product } = require("../models/Product.js");
const { isAuth } = require("../middlewares/auth.middleware.js");

const router = express.Router();

const checkParams = (req) => {
  const query = {};

  const { title, description } = req.query;
  if (title) {
    query.title = title;
  }

  if (description) {
    query.description = description;
  }

  return query;
};

router.get("/", (req, res, next) => {
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit) : 10;

  if (!isNaN(page) && !isNaN(limit) && page > 0 && limit > 0) {
    req.query.page = page;
    req.query.limit = limit;
    next();
  } else {
    console.log("Parámetros no válidos:");
    console.log(JSON.stringify(req.query));
    res.status(400).json({ error: "Params page or limit are not valid" });
  }
});

router.get("/", async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const query = checkParams(req);

    const products = await Product.find({ title: new RegExp(query.title, "i"), description: new RegExp(query.description, "i") })
      .limit(limit)
      .skip((page - 1) * limit)
      .populate("owner");

    const totalElements = await Product.countDocuments();

    const response = {
      totalItems: totalElements,
      totalPages: Math.ceil(totalElements / limit),
      currentPage: page,
      data: products,
    };
    console.log(products);

    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const product = await Product.findById(id).populate("owner");
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({});
    }
  } catch (error) {
    next(error);
  }
});

router.post("/", isAuth, async (req, res, next) => {
  try {
    const bodyProduct = new Product(req.body);
    let createdProduc = null;

    if (bodyProduct) {
      // COMPROBACIÓN PARA QUE SOLO EL OWNER DEL PRODUCTO LO PUEDA CREAR
      if (req.user.id === bodyProduct.owner._id.toString() || req.user.email === "admin@app.es") {
        createdProduc = await bodyProduct.save();
      } else {
        return res.status(401).json({ error: "No tienes autorización para realizar esta operación" });
      }

      if (createdProduc) {
        return res.status(201).json(createdProduc);
      } else {
        res.status(404).json({});
      }
    } else {
      res.status(404).json({});
    }
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", isAuth, async (req, res, next) => {
  try {
    const id = req.params.id;
    const product = await Product.findById(id);
    let productDeleted = null;

    if (product) {
      // COMPROBACIÓN PARA QUE SOLO EL OWNER DEL PRODUCTO LO PUEDA ELIMINAR
      if (req.user.id === product.owner._id.toString() || req.user.email === "admin@app.es") {
        productDeleted = await Product.findByIdAndDelete(id);
      } else {
        return res.status(401).json({ error: "No tienes autorización para realizar esta operación" });
      }

      if (productDeleted) {
        res.json(productDeleted);
      } else {
        res.status(404).json({});
      }
    }
  } catch (error) {
    next(error);
  }
});

router.put("/:id", isAuth, async (req, res, next) => {
  try {
    const id = req.params.id;
    const product = await Product.findById(id);
    let productUpdated = null;

    if (product) {
      // COMPROBACIÓN PARA QUE SOLO EL OWNER DEL PRODUCTO LO PUEDA MODIFICAR
      if (req.user.id === product.owner._id.toString() || req.user.email === "admin@app.es") {
        productUpdated = await Product.findByIdAndUpdate(id, req.body, { new: true });
      } else {
        return res.status(401).json({ error: "No tienes autorización para realizar esta operación" });
      }

      if (productUpdated) {
        res.json(productUpdated);
      } else {
        res.status(404).json({});
      }
    }
  } catch (error) {
    next(error);
  }
});

module.exports = { productRouter: router };
