var mongoose = require("mongoose");

var StockSchema = new mongoose.Schema({
  ticker: {
    type: String,
    required: true,
    trim: true,
    minlength: 4,
    unique: true
  },
  likes: Number,
  ips: [String]
});

exports.Stock = mongoose.model("Stock", StockSchema);
