var mongoose = require('mongoose');
var Schema = mongoose.Schema

var user = new Schema({
  name:String,
  vehicleNo:String,
  password:String,
  mobileNo:String,
  createdAt:Date

})

// module.exports allows us to pass this to other files when it is called
module.exports = mongoose.model('users',user);

