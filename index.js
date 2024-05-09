const express = require("express");
const cors = require("cors");
const { userRouter } = require("./routes/user.routes.js");
const { errorHandler } = require("./middlewares/error.middleware.js");
const { productRouter } = require("./routes/product.routes.js");
const { saleRouter } = require("./routes/sale.routes.js");
const { chatRouter } = require("./routes/chat.routes.js");

const main = async () => {
  // Conexión a la BBDD
  const { connect } = require("./db.js");
  const database = await connect();

  // Creamos router de expres
  const PORT = 3000;
  const app = express();
  const router = express.Router();

  // Configuración del app
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(
    cors({
      origin: "http://localhost:3000",
    })
  );
  app.use((req, res, next) => {
    const date = new Date();
    console.log(`Petición de tipo ${req.method} a la url ${req.originalUrl} el ${date}`);
    next();
  });

  app.use(errorHandler);

  // Rutas
  router.get("/", (req, res) => {
    res.send(`Esta es la home de nuestra API usando BBDD --> ${database.connection.name}`);
  });

  router.get("*", (req, res) => {
    res.status(404).send("Lo sentimos :( No hemos encontrado la página solicitada.");
  });

  app.use("/chat", chatRouter);
  app.use("/sale", saleRouter);
  app.use("/product", productRouter);
  app.use("/user", userRouter);
  app.use("/", router);

  app.listen(PORT, () => {
    console.log(`app levantado en el puerto ${PORT}`);
  });
};

main();
