'use strict';

var mongoose = require('mongoose');
var Promise = require('bluebird');

var StrategySchema = new mongoose.Schema({
  provider: {type: String, required: true, unique: true},
  fields: []
});

function exist (strategies) {
  return this.find({
    provider: {
      $in: strategies
    }
  }, {
    name: 1
  }).then(function (strategiesFound) {
    if (strategiesFound.length !== strategies.length) {
      return Promise.reject();
    }
  });
}

StrategySchema.statics.exist = exist;

module.exports = mongoose.model('Strategy', StrategySchema);
