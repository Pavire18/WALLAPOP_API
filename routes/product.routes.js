const express = require("express");

// Modelos
const { Product } = require("../models/Product.js");
const { isAuth } = require("../middlewares/auth.middleware.js");

const router = express.Router();

const comprobarParametros = (req) => {
  const query = {};

  if (req.title) {
    query.title = req.title;
  }

  if (req.description) {
    query.description = req.description;
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
    const query = comprobarParametros(req);

    const products = await Product.find(query)
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

// Endpoint de creación de usuarios
router.post("/", async (req, res, next) => {
  try {
    const user = new Product(req.body);

    const createdUser = await user.save();
    return res.status(201).json(createdUser);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", isAuth, async (req, res, next) => {
  try {
    const id = req.params.id;
    const product = await Product.findById(id);
    let productDeleted = null;

    if (!product) {
      // COMPROBACIÓN PARA QUE SOLO EL OWNER DEL PRODUCTO LO PUEDA ELIMINAR
      if (req.user.id === product.owner._id.toString()) {
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

router.put("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const product = await Product.findById(id);
    let productUpdated = null;

    if (!product) {
      // COMPROBACIÓN PARA QUE SOLO EL OWNER DEL PRODUCTO LO PUEDA ELIMINAR
      if (req.user.id === product.owner._id.toString()) {
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
