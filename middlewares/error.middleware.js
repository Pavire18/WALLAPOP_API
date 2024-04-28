function errorHandler(err, req, res, next) {
  console.log("*** INICIO DE ERROR ***");
  console.log(`PETICIÓN FALLIDA: ${req.method} a la url ${req.originalUrl}`);
  console.log(err);
  console.log("*** FIN DE ERROR ***");

  if (err && err.name === "ValidationError") {
    res.status(400).json({ error: err.message });
  } else {
    res.status(500).json({ error: "Hubo un error en el servidor." });
  }
}

module.exports = { errorHandler };
