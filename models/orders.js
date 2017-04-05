var mongoose = require('mongoose');
var Schema = mongoose.Schema

var order = new Schema({

  vehicleNo:String,
  slotId:String,
  inTime:Date,
  status:String,
  outTime:Date,
  mobileNo:String,
  amount:Number,
  facilityId:String,
  clientId:String,
  

})

// module.exports allows us to pass this to other files when it is called
module.exports = mongoose.model('orders',order);

