var mongoose = require('mongoose');
var Schema = mongoose.Schema

var parkingSlot = new Schema({
  name:String,
  sid:String,
  status:Number,
  reg_no:String,
  in_time:Date

})

// module.exports allows us to pass this to other files when it is called
module.exports = mongoose.model('parkingSlot',parkingSlot);

