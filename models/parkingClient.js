var mongoose = require('mongoose');
var Schema = mongoose.Schema

var parkingClient = new Schema({
  clientId:String,
  defaultFacility:String,
  createdAt:Date,
})

// module.exports allows us to pass this to other files when it is called
module.exports = mongoose.model('parkingClient',parkingClient);

