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
    if (typeof req.query.stock !== "string") {
      var [tickerOne, tickerTwo] = req.query.stock;
      var stockOne = await getStockData(tickerOne, req.ip, req.query.like);
      var stockTwo = await getStockData(tickerTwo, req.ip, req.query.like);
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
      var stock = await getStockData(req.query.stock, req.ip, req.query.like);
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

async function getStockData(ticker, ip, like = false) {
  var stock = await Stock.findOne({ ticker });
  var price = await getStockPriceByName(ticker).toString();

  if (!stock) {
    if (!like) {
      await Stock.create({
        ticker: ticker,
        likes: 0,
        ips: []
      });
      return { ticker: ticker, likes: 0, price: price };
    } else {
      await Stock.create({
        ticker: ticker,
        likes: 1,
        ips: [ip]
      });
      return { ticker: ticker, likes: 1, price: price };
    }
  } else {
    if (like) {
      if (stock.ips.includes(ip)) {
        return { ticker: stock.ticker, likes: stock.likes, price: price };
      } else {
        await Stock.updateOne(
          { ticker },
          { $inc: { likes: 1 }, $push: { ips: ip } }
        ).exec();
        return {
          ticker: stock.ticker,
          likes: stock.likes,
          price: price
        };
      }
    } else {
      console.log("no like");

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
