/*
 *
 *
 *       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
 *       -----[Keep the tests in the same order!]-----
 *       (if additional are added, keep them at the very end!)
 */

var chaiHttp = require("chai-http");
var chai = require("chai");
var assert = chai.assert;
var server = require("../server");

chai.use(chaiHttp);

suite("Functional Tests", function() {
  suite("GET /api/stock-prices => stockData object", function() {
    test("1 stock", function(done) {
      chai
        .request(server)
        .get("/api/stock-prices")
        .query({ stock: "GOOG" })
        .end(function(err, res) {
          assert.equal(res.body.stockData.stock, "GOOG");
          assert.isNotNull(res.body.stockData.price);
          assert.isNotNull(res.body.stockData.likes);

          done();
        });
    });

    test("1 stock with like", function(done) {
      chai
        .request(server)
        .get("/api/stock-prices")
        .query({ stock: "GOOG", like: true })
        .end(function(err, res) {
          assert.equal(res.body.stockData.stock, "GOOG");
          assert.isNotNull(res.body.stockData.price);
          assert.isNotNull(res.body.stockData.likes);
          assert.equal(res.body.stockData.likes, 1);

          done();
        });
    });

    test("1 stock with like again (ensure likes arent double counted)", function(done) {
      chai
        .request(server)
        .get("/api/stock-prices")
        .query({ stock: "GOOG", like: true })
        .end(function(err, res) {
          assert.equal(res.body.stockData.stock, "GOOG");
          assert.isNotNull(res.body.stockData.price);
          assert.isNotNull(res.body.stockData.likes);
          assert.equal(res.body.stockData.likes, 1);

          done();
        }); 
    });

    test("2 stocks", function(done) {
      chai
        .request(server)
        .get("/api/stock-prices")
        .query({ stock: ["GOOG", "MSFT"] })
        .end(function(err, res) {
          let stockData = res.body.stockData;
          assert.equal(stockData[0].stock, "GOOG");
          assert.equal(stockData[1].stock, "MSFT");
          assert.isNotNull(stockData[0].price);
          assert.isNotNull(stockData[1].price);
          assert.isNotNull(stockData[0].rel_likes);
          assert.isNotNull(stockData[1].rel_likes);
          assert.equal(stockData[0].rel_likes, 0);
          assert.equal(stockData[1].rel_likes, 0);

          done();
        });
    });

    test("2 stocks with like", function(done) {
      chai
        .request(server)
        .get("/api/stock-prices")
        .query({ stock: ["GOOG", "MSFT"], like: true })
        .end(function(err, res) {
          let stockData = res.body.stockData;
          assert.equal(stockData[0].stock, "GOOG");
          assert.equal(stockData[1].stock, "MSFT");
          assert.isNotNull(stockData[0].price);
          assert.isNotNull(stockData[1].price);
          assert.isNotNull(stockData[0].rel_likes);
          assert.isNotNull(stockData[1].rel_likes);    
          assert.equal(stockData[0].rel_likes, 0);
          assert.equal(stockData[1].rel_likes, 0);

          done();
        });
    });
  });
});
