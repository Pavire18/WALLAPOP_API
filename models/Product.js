const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      minLength: [5, "Al menos 10 letras para el titulo."],
      maxLength: [50, "Máximo 50 letras para el titulo."],
      trim: true,
      required: true,
    },
    description: {
      type: String,
      minLength: [5, "Al menos 10 letras para el titulo."],
      maxLength: [640, "Máximo 50 letras para el titulo."],
      trim: true,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    images: {
      type: [String],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);
module.exports = { Product };
