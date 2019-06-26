/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

var expect = require("chai").expect;
var MongoClient = require("mongodb");
var mongoose = require("mongoose");
var Stock = require("../models/Stock").Stock;
const fetch = require("node-fetch");

mongoose.connect(process.env.DB, { useNewUrlParser: true }); //MongoClient.connect(CONNECTION_STRING, function(err, db) {});
var db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

module.exports = function(app) {
  app.route("/api/stock-prices").get(async function(req, res) {
    if (!req.query.stock) res.status(400).send("Need ticker");
    var isLiked = req.query.like;
    if (typeof req.query.stock !== "string") {
      tickerOne = req.query.stock[0];
      tickerTwo = req.query.stock[1];
      var stockOne = await getStockData(tickerOne, req.ip, isLiked);
      var stockTwo = await getStockData(tickerTwo, req.ip, isLiked);
      var diff = stockOne.likes - stockTwo.likes;
      return res.json({
        stockData: [
          {
            stock: stockOne.ticker.toUpperCase(),
            price: stockOne.price,
            rel_likes: diff
          },
          {
            stock: stockTwo.ticker.toUpperCase(),
            price: stockTwo.price,
            rel_likes: -diff
          }
        ]
      });
    } else {
      var stock = await getStockData(req.query.stock, req.ip, isLiked);
      return res.json({
        stockData: {
          stock: stock.ticker.toUpperCase(),
          price: stock.price,
          likes: stock.likes
        }
      });
    }
  });
};

async function getStockData(ticker, ip, like) {
  var stock = await Stock.findOne({ ticker });
  var price = await getStockPriceByName(ticker).toString();

  if (!stock) {
    await Stock.create({
      ticker: ticker,
      likes: like ? 1 : 0,
      ips: [ip]
    });
    return { ticker: ticker, likes: like ? 1 : 0, price: price };
  } else {
    if (like) {
      if (stock.ips.includes(ip)) {
        return { ticker: stock.ticker, likes: stock.likes, price: price };
      } else {
        await Stock.update({ ticker }, { $inc: { likes: 1 } }).exec();
        return { ticker: stock.ticker, likes: stock.likes + 1, price: price };
      }
    } else {
      return { ticker: stock.ticker, likes: stock.likes, price: price };
    }
  }
}

function getStockPriceByName(name) {
  const url = `https://api.iextrading.com/1.0/deep/trades?symbols=${name}&last=1`;
  return fetch(url)
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      return data[name.toUpperCase()][0].price;
    })
    .catch(err => console.log(err));
}
