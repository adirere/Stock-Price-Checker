/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

var expect = require("chai").expect;
const mongodb = require("mongodb");
const mongoose = require("mongoose");
const axios = require("axios");

module.exports = function(app) {
  const URI = `mongodb+srv://adi:${process.env.PW}@cluster0.azfi6.mongodb.net/stock_price_checker?retryWrites=true&w=majority`;

  mongoose.connect(URI, { useNewUrlParser: true, useUnifiedTopology: true });

  let stockSchema = new mongoose.Schema({
    stock: { type: String, required: true },
    ips: [String],
    likes: {
      type: Number
    },
    price: { type: Number, default: 0 }
  });

  let Stock = mongoose.model("Stock", stockSchema);

  app.route("/api/stock-prices").get(async function(req, res) {
    let stockNames = req.query.stock;
    let like = req.query.like ? true : false;
    let ip = req.headers["x-forwarded-for"] ? req.headers["x-forwarded-for"].split(",", 1)[0] : '';

    async function getStock(stockName) {
      try {
        const response = await axios.get(
          `https://stock-price-checker-proxy--freecodecamp.repl.co/v1/stock/${stockName}/quote`
        );
        if (typeof response.data === "string") {
          res.json("please use a correct stock symbol");
          return undefined;
        } else {
          return { stock: stockName, price: response.data.latestPrice };
        }
      } catch (error) {
        res.json("please use a correct stock symbol");
        //console.error(error);
      }
    }

    function verifyStock(stockData) {
      stockData["$addToSet"] = { ips: ip };

      Stock.findOneAndUpdate(
        { stock: stockData.stock },
        stockData,
        { new: true, upsert: true, useFindAndModify: false },
        (err, stockDocument) => {
          if (err) {
            console.log(err);
          } else if (!err && stockDocument) {
            stockData = {};
            stockData = stockDocument.toJSON();

            if (stockData.ips.includes(ip)) {
              if (!like) {
                stockData.ips = stockData.ips.filter(value => value !== ip);

                Stock.findOneAndUpdate(
                  { stock: stockData.stock },
                  { ips: stockData.ips, likes: stockData.ips.length },
                  { new: true, upsert: true, useFindAndModify: false },
                  (err, result) => {
                    if (!err && result)
                      console.log("like substracted from " + ip);
                    stockData = result.toJSON();
                    delete stockData._id;
                    delete stockData.__v;
                    delete stockData.ips;
                    res.json({ stockData: stockData });
                  }
                );
              } else {
                Stock.findOneAndUpdate(
                  { stock: stockData.stock },
                  { ips: stockData.ips, likes: stockData.ips.length },
                  { new: true, upsert: true, useFindAndModify: false },
                  (err, result) => {
                    if (!err && result) console.log("like added from " + ip);
                    stockData = result.toJSON();
                    delete stockData._id;
                    delete stockData.__v;
                    delete stockData.ips;
                    res.json({ stockData: stockData });
                  }
                );
              }
            }
          }
        }
      );
    }

    function verifyStocks(firstStock, secondStock) {
      firstStock["$addToSet"] = { ips: ip };
      secondStock["$addToSet"] = { ips: ip };
      let likesFirst, likesSecond;

      Stock.findOneAndUpdate(
        { stock: firstStock.stock },
        firstStock,
        { new: true, upsert: true, useFindAndModify: false },
        (err, firstStockDocument) => {
          firstStock = firstStockDocument.toJSON();

          if (firstStock.ips.includes(ip)) {
            if (!like) {
              firstStock.ips = firstStock.ips.filter(value => value !== ip);

              Stock.findOneAndUpdate(
                { stock: firstStock.stock },
                { ips: firstStock.ips, likes: firstStock.ips.length },
                { new: true, upsert: true, useFindAndModify: false },
                (err, resultOne) => {
                  if (!err && resultOne) {
                    // console.log("result", result)
                    console.log(
                      "like substracted from " +
                        ip +
                        " for stock " +
                        firstStock.stock
                    );
                    findAndUpdateSecondStock(resultOne);
                  }
                }
              );
            } else {
              Stock.findOneAndUpdate(
                { stock: firstStock.stock },
                { ips: firstStock.ips, likes: firstStock.ips.length },
                { new: true, upsert: true, useFindAndModify: false },
                (err, resultOne) => {
                  if (!err && resultOne) {
                    // console.log("result", result)
                    console.log(
                      "like added from " + ip + " for stock " + firstStock.stock
                    );
                    findAndUpdateSecondStock(resultOne);
                  }
                }
              );
            }
          }
        }
      );

      function findAndUpdateSecondStock(resultOne) {
        Stock.findOneAndUpdate(
          { stock: secondStock.stock },
          secondStock,
          { new: true, upsert: true, useFindAndModify: false },
          (err, secondStockDocument) => {
            secondStock = secondStockDocument.toJSON();

            if (secondStock.ips.includes(ip)) {
              if (!like) {
                secondStock.ips = secondStock.ips.filter(value => value !== ip);

                Stock.findOneAndUpdate(
                  { stock: secondStock.stock },
                  { ips: secondStock.ips, likes: secondStock.ips.length },
                  { new: true, upsert: true, useFindAndModify: false },
                  (err, resultTwo) => {
                    if (!err && resultTwo) {
                      console.log(
                        "like substracted from " +
                          ip +
                          " for stock " +
                          secondStock.stock
                      );
                      let stockDataOne = resultOne.toJSON();
                      let stockDataTwo = resultTwo.toJSON();
                      delete stockDataOne._id;
                      delete stockDataOne.__v;
                      delete stockDataOne.ips;
                      delete stockDataTwo._id;
                      delete stockDataTwo.__v;
                      delete stockDataTwo.ips;
                      let stockData = [];
                      if (stockDataOne.likes > stockDataTwo.likes) {
                        stockDataOne["rel_likes"] =
                          stockDataOne.likes - stockDataTwo.likes;
                        stockDataTwo["rel_likes"] =
                          stockDataTwo.likes - stockDataOne.likes;
                      } else {
                        stockDataTwo["rel_likes"] =
                          stockDataTwo.likes - stockDataOne.likes;
                        stockDataOne["rel_likes"] =
                          stockDataOne.likes - stockDataTwo.likes;
                      }
                      delete stockDataTwo.likes;
                      delete stockDataOne.likes;
                      stockData.push(stockDataOne);
                      stockData.push(stockDataTwo);
                      res.json({ stockData });
                    }
                  }
                );
              } else {
                Stock.findOneAndUpdate(
                  { stock: secondStock.stock },
                  { ips: secondStock.ips, likes: secondStock.ips.length },
                  { new: true, upsert: true, useFindAndModify: false },
                  (err, resultTwo) => {
                    if (!err && resultTwo) {
                      console.log(
                        "like added from " +
                          ip +
                          " for stock " +
                          secondStock.stock
                      );
                      let stockDataOne = resultOne.toJSON();
                      let stockDataTwo = resultTwo.toJSON();
                      delete stockDataOne._id;
                      delete stockDataOne.__v;
                      delete stockDataOne.ips;
                      delete stockDataTwo._id;
                      delete stockDataTwo.__v;
                      delete stockDataTwo.ips;
                      let stockData = [];
                      if (stockDataOne.likes > stockDataTwo.likes) {
                        stockDataOne["rel_likes"] =
                          stockDataOne.likes - stockDataTwo.likes;
                        stockDataTwo["rel_likes"] =
                          stockDataTwo.likes - stockDataOne.likes;
                      } else {
                        stockDataTwo["rel_likes"] =
                          stockDataTwo.likes - stockDataOne.likes;
                        stockDataOne["rel_likes"] =
                          stockDataOne.likes - stockDataTwo.likes;
                      }
                      delete stockDataTwo.likes;
                      delete stockDataOne.likes;
                      stockData.push(stockDataOne);
                      stockData.push(stockDataTwo);
                      res.json({ stockData });
                    }
                  }
                );
              }
            }
          }
        );
      }
    }

    if (typeof stockNames === "string") {
      let stockData = {};

      stockData = await getStock(stockNames.toUpperCase());

      if (stockData) {
        verifyStock(stockData);
      }
    } else if (typeof stockNames === "object") {
      let firstStock, secondStock;

      firstStock = await getStock(stockNames[0].toUpperCase());
      secondStock = await getStock(stockNames[1].toUpperCase());

      verifyStocks(firstStock, secondStock);
    }
  });
};
