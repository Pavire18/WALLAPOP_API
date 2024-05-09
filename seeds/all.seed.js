const mongoose = require("mongoose");
const { connect } = require("../db.js");
const { User } = require("../models/User.js");
const { Product } = require("../models/Product.js");
const { Sale } = require("../models/Sale.js");
const { Chat } = require("../models/Chat.js");
const { userList } = require("../seeds/data/user.data.js");
const { productList } = require("./data/product.data.js");
const { randomNumber } = require("../utils/utils.js");
const { chatList } = require("./data/chat.data.js");

async function populateBBDD() {
  try {
    await connect();
    console.log("Tenemos conexión");

    // BORRADO DE DATOS
    await User.collection.drop();
    await Product.collection.drop();
    await Sale.collection.drop();
    await Chat.collection.drop();

    // USERS
    const userDocuments = userList.map((user) => new User(user));

    for (let i = 0; i < userDocuments.length; i++) {
      const user = userDocuments[i];
      await user.save();
    }

    // PRODUCTS
    const productsDocuments = productList.map((product) => new Product(product));

    productsDocuments.forEach((product) => {
      product.owner = userDocuments[randomNumber(0, userDocuments.length - 1)]._id;
    });

    // SALES
    const saleDocuments = productList.map((sale) => new Sale(sale));

    saleDocuments.forEach((sale) => {
      sale.seller = userDocuments[randomNumber(0, userDocuments.length - 1)]._id;
      const buyerId = userDocuments[randomNumber(0, userDocuments.length - 1)]._id;
      sale.buyer = buyerId !== sale.seller ? buyerId : userDocuments[randomNumber(0, userDocuments.length - 1)]._id;
      sale.product = productsDocuments[randomNumber(0, productsDocuments.length - 1)]._id;
      sale.saleDate = new Date();
    });

    // CHATS
    const chatDocuments = chatList.map((chat) => new Chat(chat));

    chatDocuments.forEach((chat) => {
      chat.user1 = userDocuments[randomNumber(0, userDocuments.length - 1)]._id;
      const user2Id = userDocuments[randomNumber(0, userDocuments.length - 1)]._id;
      chat.user2 = user2Id !== chat.user1 ? user2Id : userDocuments[randomNumber(0, userDocuments.length - 1)]._id;
      chat.product = productsDocuments[randomNumber(0, productsDocuments.length - 1)]._id;
      chat.messages.forEach((message) => {
        message.userSender = randomNumber(0, 1) === 1 ? chat.user1 : chat.user2;
        message.userReceiver = message.userSender === chat.user1 ? chat.user2 : chat.user1;
        message.messageDate = new Date();
      });
    });

    await Product.insertMany(productsDocuments);
    await Sale.insertMany(saleDocuments);
    await Chat.insertMany(chatDocuments);
    console.log("Datos guardados correctamente!");
  } catch (error) {
    console.error(error);
  } finally {
    mongoose.disconnect();
  }
}

populateBBDD();
