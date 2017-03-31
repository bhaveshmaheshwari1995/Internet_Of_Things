var mqtt = require('mqtt');
var client = mqtt.connect('mqtt://localhost:1883');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var mongoose = require('mongoose');
var cors = require('cors')
var config = require('./config');
var parkingFacility_model = require('./models/parkingFacility');
var parkingSlot_model = require('./models/parkingSlot');
var users_model = require('./models/users');
var orders_model = require('./models/orders');
var jwt = require('jsonwebtoken');
var morgan = require('morgan');
var tesseract = require('node-tesseract');
var fs = require('fs');
var apiRoutes = express.Router();
const crypto = require('crypto');
var bodyParser = require('body-parser');
var s3 = require('s3');
app.use(morgan('dev'));
// parse application/x-www-form-urlencoded 
app.use(bodyParser.urlencoded({ extended: false }))
 
// parse application/json 
app.use(bodyParser.json())
//..for connecting to mongoose..//
mongoose.connect(config.url);
app.use(cors());
app.use(express.static(__dirname + '/SmartPark/public/'));
client.on('connect', function() {})
client.subscribe('client/smartPark/ultraSonicData/occupied')
client.subscribe('client/smartPark/ultraSonicData/available')

//******************************************all the api end points***************************//


app.post('/addFacility', function(req, res) {
    var facility = new parkingFacility_model({
        name: "A",
        fid: "A",
        capacity: 10
    });
    facility.save(function(err) {
        if (err) {
            console.log(err);
        } else {
            console.log("added SuccessFully")
        }
    })
});



apiRoutes.get('/', function(req, res, next) {
    res.sendFile(__dirname + '/index.html');
});

app.get('/smartPark/', function(req, res, next) {
    res.json({
        success: true,
        message: "This is a Smart Park App"
    });
});

apiRoutes.get('/currentMeter/:mobileNo',function(req,res){
    getCurrentMeter(req.params.mobileNo,function(order){
        res.json({"success":true,code:1,order:order,message:"current meter Data"});
    })
})

apiRoutes.post('/qrdata', function(req, res) {
    users_model.findOne({mobileNo:req.body.mobileNo},function(err,user){
        if(err){
            console.log(err);
        }
        else{
            orders_model.update({slotId:req.body.slotId,status:"open"}, {$set:{'vehicleNo':user.vehicleNo,'mobileNo':user.mobileNo}}, {multi:false},function(err,raw,data){
                if(err){
                    console.log(err);
                }
                else{
                    if(raw.n == 0){
                        res.json({"success":false,code:1,message:"no car at the given parking"});         
                    }else{
                        if(raw.n == 1 && raw.nModified == 0){
                            res.json({"success":false,code:2,message:"Already Scanned"});  
                        }else{
                            getCurrentMeter(req.body.mobileNo,function(order){
                                res.json({"success":true,code:3,message:"qrcode added",order:order});  
                            });
                        }
                    }
                }
            });
        }
    });    
});

var getCurrentMeter = function(mobileNo,callback){
    orders_model.findOne({mobileNo:mobileNo,status:"open"},function(err,order){
        if(err){
            res.json({"success":false,code:0,message:err})
        }else{
            callback(order);
        }
    })
};

var s3Client = s3.createClient({
  maxAsyncS3: 20,     // this is the default 
  s3RetryCount: 3,    // this is the default 
  s3RetryDelay: 1000, // this is the default 
  multipartUploadThreshold: 20971520, // this is the default (20 MB) 
  multipartUploadSize: 15728640, // this is the default (15 MB) 
  s3Options: {
    accessKeyId: config.s3keyId,
    secretAccessKey: config.s3SecretKey,
  },
});

client.on('message', function(topic, message) {
    switch(topic){
        case 'client/smartPark/ultraSonicData/occupied':
            startMeter(JSON.parse(message.valueOf()), function(responseData){
                console.log(responseData);
            })
            break;
        case 'client/smartPark/ultraSonicData/available':
            console.log(JSON.parse(message.valueOf()))
            stopMeter(JSON.parse(message.valueOf()),function(responseData){
                console.log(responseData);
            })
            break;
    }
});

var startMeter = function(data,callback){
    console.log(data);
    var params = {
          localFile: "ocrImages/file.png",
          s3Params: {
            Bucket: "smartparkimage",
            Key: data.key
          },
        };
        var downloader = s3Client.downloadFile(params);
        downloader.on('error', function(err) {
          console.error("unable to download:", err.stack);
        });
        downloader.on('end', function() {
                    console.log("done downloading");
            tesseract.process('ocrImages/file.png', options, function(err, text) {
                if (err) {
                    console.error(err);
                } else {
                    console.log(text);
                    var newOrder = new orders_model({
                        vehicleNo:text,
                        slotId:data.sensor_id,
                        inTime:new Date(),
                        status:"open",
                    });
                    newOrder.save(function(err,user){
                        if(err){
                            console.log(err);
                        }
                        else{
                            console.log(user);
                        }
                    })
                    
                }
            });
        });
}

var stopMeter = function(data,callback){
    console.log(data)
    orders_model.findOne({slotId:data.sensor_id},function(err,order){
        if(err){

        }else{
            order.status = "close";
            order.amount = (new Date()-order.inTime)*config.chargePerMinute/(60*1000);
            order.save(function(err,order){
                if(err){

                }else{
                    callback(order)
                }
            })
        }
    })

}
apiRoutes.post('/register', function(req, res) {
    console.log()
    var newUser = new users_model({
        name:req.body.userName,
        vehicleNo:req.body.userVehicleNo,
        password:crypto.createHmac('sha256', config.secret).update(req.body.userPassword).digest('hex'),
        mobileNo:req.body.userNumber,
        createdAt:new Date()
    });
    users_model.findOne({mobileNo:req.body.userNumber},function(err,user){
        if(err){
            res.json({"success":false,code:0,message:err});
        }
        else{
            if(user == null){
                newUser.save(function(err) {
                    if (err) {
                       res.json({"success":false,code:0,message:err});
                    } else {
                        console.log("added SuccessFully")
                        res.json({"success":true,code:2,message:"User Added SuccessFully"});
                    }
                })
            }
            else{
                res.json({"success":false,code:1,message:"User Already There"});
            }
        }
    });
    
});


apiRoutes.post('/authenticate', function(req, res) {
    users_model.findOne({mobileNo:req.body.userNumber},function(err,user){
        if(err){
            res.json({"success":false,code:0,message:err});
        }
        else{
            if(user == null){
                res.json({"success":false,code:1,message:"No Such User"});
            }
            else{
                if(user.password == crypto.createHmac('sha256', config.secret).update(req.body.userPassword).digest('hex') ){
                    var token = jwt.sign(user,config.secret);
                    res.json({"success":true, code:3,message:"login success",token:token});
                }
                else{
                    res.json({"success":false,code:2,message:"Wrong Password"})
                } 
                    
            }
        }
    });
});



// route middleware to verify a token
apiRoutes.use(function(req, res, next) {
    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['Authorization'];
    // decode token
    if (token) {
        // verifies secret and checks exp
        jwt.verify(token, app.get('superSecret'), function(err, decoded) {
            if (err) {
                return res.json({
                    success: false,
                    message: 'Failed to authenticate token.'
                });
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;
                next();
            }
        });
    } else {
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });
    }
});


app.get('history/:vehicleNumber', function(req, res) {})
app.get('/parkingStatus/:userName', function(req, res) {
    console.log(req.params.userName)
    var user = req.params.userName;
    io.emit(user, {
        "slot_no": "A2",
        "reg_no": "TN 14 H 08895",
        "in_time": new Date(),
        status: "full"
    });
    res.json("Hogata")
});

var options = {
    l: 'eng',
    psm: 6,
    binary: '/usr/local/bin/tesseract'
};
//**************************************Web Socket******************************************//
io.on('connection', function(client_socket) {
    client_socket.on('ultraSonicData', function(data) {
        client.subscribe('client/' + data + '/ldrData')
        client.publish('server/' + data, "ldrData")
        client.on('message', function(topic, message) {
            if (topic === 'client/' + data + '/ldrData') {
                console.log("ldr data");
                console.log(message.toString())
                io.emit("server", 'hey client');
            }
        })
        console.log(data);
    });
});

server.listen(4200);
app.use('/api', apiRoutes);