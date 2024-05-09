const express = require("express");

// Modelos
const { Chat } = require("../models/Chat.js");
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

router.get("/", isAuth, async (req, res, next) => {
  try {
    if (req.user.email === "admin@app.es") {
      const { page, limit } = req.query;

      const chats = await Chat.find()
        .limit(limit)
        .skip((page - 1) * limit)
        .populate([{ path: "user1" },
          { path: "user2" },
          { path: "product" },
          { path: "messages.userSender" },
          { path: "messages.userReceiver" }
        ]);
      const totalElements = await Chat.countDocuments();

      const response = {
        totalItems: totalElements,
        totalPages: Math.ceil(totalElements / limit),
        currentPage: page,
        data: chats,
      };

      res.json(response);
    } else {
      return res.status(401).json({ error: "No tienes autorización para realizar esta operación" });
    }
  } catch (error) {
    next(error);
  }
});

router.get("/:id", isAuth, async (req, res, next) => {
  try {
    const id = req.params.id;
    const verifyChat = await Chat.findById(id);
    console.log(verifyChat);
    if (req.user.id === verifyChat.user1._id || req.user.id === verifyChat.user2._id || req.user.email === "admin@app.es") {
      const chat = await Chat.findById(id).populate([{ path: "user1" },
        { path: "user2" },
        { path: "product" },
        { path: "messages.userSender" },
        { path: "messages.userReceiver" }
      ]);

      if (chat) {
        res.json(chat);
      } else {
        res.status(404).json({});
      }
    }
  } catch (error) {
    next(error);
  }
});

router.post("/", isAuth, async (req, res, next) => {
  try {
    const bodyChat = new Chat(req.body);
    const product = await Product.findById(bodyChat.product._id);
    let createdChat = null;
    if (bodyChat) {
      if (req.user.id === bodyChat.user1._id || req.user.id === bodyChat.user2._id || req.user.email === "admin@app.es") {
        if (!product.sold) {
          createdChat = await bodyChat.save();
        } else {
          return res.status(401).json({ error: "El producto ya está vendido" });
        }
      } else {
        return res.status(401).json({ error: "No tienes autorización para realizar esta operación" });
      }

      if (createdChat) {
        return res.status(201).json(createdChat);
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
    let chatDeleted = null;

    if (req.user.email === "admin@app.es") {
      chatDeleted = await Chat.findByIdAndDelete(id);
    } else {
      return res.status(401).json({ error: "No tienes autorización para realizar esta operación" });
    }

    if (chatDeleted) {
      res.json(chatDeleted);
    } else {
      res.status(404).json({});
    }
  } catch (error) {
    next(error);
  }
});

router.put("/:id", isAuth, async (req, res, next) => {
  try {
    const id = req.params.id;
    let chatUpdated = null;

    // COMPROBACIÓN PARA QUE SOLO EL SELLER DEL PRODUCTO LO PUEDA MODIFICAR
    if (req.user.email === "admin@app.es") {
      chatUpdated = await Chat.findByIdAndUpdate(id, req.body, { new: true });
    } else {
      return res.status(401).json({ error: "No tienes autorización para realizar esta operación" });
    }

    if (chatUpdated) {
      res.json(chatUpdated);
    } else {
      res.status(404).json({});
    }
  } catch (error) {
    next(error);
  }
});

module.exports = { chatRouter: router };
