const express = require("express");

// Modelos
const { Sale } = require("../models/Sale.js");
const { isAuth } = require("../middlewares/auth.middleware.js");
const { Product } = require("../models/Product.js");

const router = express.Router();

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

    const products = await Sale.find()
      .limit(limit)
      .skip((page - 1) * limit)
      .populate([{ path: "seller" }, { path: "buyer" }, { path: "product" }]);

    const totalElements = await Sale.countDocuments();

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
    const sale = await Sale.findById(id).populate([{ path: "seller" }, { path: "buyer" }, { path: "product" }]);
    if (sale) {
      res.json(sale);
    } else {
      res.status(404).json({});
    }
  } catch (error) {
    next(error);
  }
});

router.post("/", isAuth, async (req, res, next) => {
  try {
    const bodySale = new Sale(req.body);

    const product = await Product.findById(bodySale.product._id.toString());
    let createdSale = null;

    if (bodySale && product) {
      // COMPROBACIÓN PARA QUE SOLO EL SELLER DEL PRODUCTO LO PUEDA CREAR
      if (req.user.id === bodySale.seller._id.toString() || req.user.email === "admin@app.es") {
        if (!product.sold) {
          createdSale = await bodySale.save();
        } else {
          return res.status(401).json({ error: "El producto ya está vendido" });
        }
      } else {
        return res.status(401).json({ error: "No tienes autorización para realizar esta operación" });
      }

      if (createdSale) {
        return res.status(201).json(createdSale);
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
    const sale = await Sale.findById(id);
    let saleDeleted = null;

    if (sale) {
      // COMPROBACIÓN PARA QUE SOLO EL SELLER DEL PRODUCTO LO PUEDA ELIMINAR
      if (req.user.id === sale.seller._id.toString() || req.user.email === "admin@app.es") {
        saleDeleted = await Sale.findByIdAndDelete(id);
      } else {
        return res.status(401).json({ error: "No tienes autorización para realizar esta operación" });
      }

      if (saleDeleted) {
        res.json(saleDeleted);
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
    const sale = await Sale.findById(id);
    let saleUpdated = null;

    if (sale) {
      // COMPROBACIÓN PARA QUE SOLO EL SELLER DEL PRODUCTO LO PUEDA MODIFICAR
      if (req.user.id === sale.seller._id.toString() || req.user.email === "admin@app.es") {
        saleUpdated = await Sale.findByIdAndUpdate(id, req.body, { new: true });
      } else {
        return res.status(401).json({ error: "No tienes autorización para realizar esta operación" });
      }

      if (saleUpdated) {
        res.json(saleUpdated);
      } else {
        res.status(404).json({});
      }
    }
  } catch (error) {
    next(error);
  }
});

module.exports = { saleRouter: router };
