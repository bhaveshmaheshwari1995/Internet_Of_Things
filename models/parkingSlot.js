var mongoose = require('mongoose');
var Schema = mongoose.Schema

var parkingSlot = new Schema({
  name:String,
  slotId:String,
  status:String,
  regNo:String,
  inTime:Date,
  clientId:String,
  facilityId:String

})

// module.exports allows us to pass this to other files when it is called
module.exports = mongoose.model('parkingSlot',parkingSlot);

