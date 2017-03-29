var mongoose = require('mongoose');
var Schema = mongoose.Schema

var parkingFacility = new Schema({
  name:String,
  fid:String,
  capacity:Number,
})

// module.exports allows us to pass this to other files when it is called
module.exports = mongoose.model('parkingFacility',parkingFacility);

