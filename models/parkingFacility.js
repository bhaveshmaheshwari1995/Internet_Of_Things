var mongoose = require('mongoose');
var Schema = mongoose.Schema

var parkingFacility = new Schema({
  name:String,
  clientId:String,
  createdAt:Date
})

// module.exports allows us to pass this to other files when it is called
module.exports = mongoose.model('parkingFacility',parkingFacility);

