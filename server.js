var mqtt = require('mqtt');
var client = mqtt.connect('mqtt://localhost:1883');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var mongoose = require('mongoose');
var cors = require('cors')
var config = require('./config');
var parkingClient_model = require('./models/parkingClient');
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


apiRoutes.post('/facility', function(req, res) {
    var facility = new parkingFacility_model({
        name: req.body.name,
        clientId: req.body.client,
        createdAt:new Date()
    });
    facility.save(function(err) {
        if (err) {
            console.log(err);
            res.json({success:false,code:0,message:err});
        } else {
            res.json({success:true,code:1,message:"facility added"});
            console.log("added SuccessFully")
        }
    })
});
apiRoutes.get('/facility/:clientId', function(req, res, next) {
    parkingFacility_model.find({clientId:req.params.clientId},function(err,facilities){
        if(err){
            res.json({"success":false,code:0,err:err})
        }else{
            res.json({"success":true,code:1,facilities:facilities})
        }
    })
});
apiRoutes.post('/clients', function(req, res) {
    var client = new parkingClient_model({
        clientId:req.body.clientId,
        defaultFacility: req.body.defaultFacility,
        createdAt:new Date()
    });
    client.save(function(err) {
        if (err) {
            res.json({success:false,code:0,message:err});
        } else {
                var facility = new parkingFacility_model({
                    name: req.body.defaultFacility,
                    clientId: req.body.clientId,
                    createdAt:new Date()
                });
                facility.save(function(err) {
                    if (err) {
                        res.json({success:false,code:0,message:err});
                    } else {
                        res.json({success:true,code:1,message:"client added"});
                        console.log("added SuccessFully")
                    }
    })
            
            /*res.json({success:true,code:1,message:"facility added"});
            console.log("added SuccessFully")*/
        }
    })
});

apiRoutes.get('/reports/:toDate/:fromDate', function(req, res, next) {
    toDate = new Date(req.params.toDate.split(" - ")[0]);
    toDate.setHours(req.params.toDate.split(" - ")[1].split(":")[0]);
    toDate.setMinutes(req.params.toDate.split(" - ")[1].split(":")[1])
    console.log(toDate);
    fromDate = new Date(req.params.fromDate.split(" - ")[0]);
    fromDate.setHours(req.params.fromDate.split(" - ")[1].split(":")[0]);
    fromDate.setMinutes(req.params.fromDate.split(" - ")[1].split(":")[1]);
    console.log(fromDate);
    tempArray = [];

    orders_model.find({inTime: { $gt:toDate, $lt:fromDate},status:"close"},function(err,orders){
        if(err){
            res.json({"success":false,code:0,message:err})
        }
        else{
            console.log(orders)
                res.json({"success":true,code:1,orders:orders});
        
        }
    })
});

apiRoutes.get('/clients', function(req, res, next) {
    parkingClient_model.find({},function(err,clients){
        if(err){
            res.json({"success":false,code:0,err:err})
        }else{
            res.json({"success":true,code:1,clients:clients})
        }
    })
});


apiRoutes.get('/history/:mobileNo', function(req, res, next) {
    orders_model.find({mobileNo:req.params.mobileNo,status:"close"},function(err,orders){
        if(err){
            res.json({"success":false,code:0,err:err})
        }else{
            res.json({"success":true,code:1,orders:orders})
        }
    })
});


apiRoutes.get('/', function(req, res, next) {
    res.sendFile(__dirname + '/index.html');
});

apiRoutes.post('/slots', function(req, res) {
 
    flag = 0;
    for(var i=0;i<req.body.slot.length;i++){
        var slot = new parkingSlot_model({
            name: req.body.slot[i].name,
            slotId: req.body.slot[i].sensorId,
            facilityId:req.body.slot[i].facility,
            clientId:req.body.client,
            regNo:null,
            inTime:null,
            status: "available",
            createdAt:new Date()
        });
        slot.save(function(err) {
            if(!err)
                console.log("added SuccessFully")
        })
    }
    res.json({success:true,code:1,message:"slot added"});
    
});

apiRoutes.get('/slots/:clientId', function(req, res, next) {
    parkingSlot_model.find({clientId:req.params.clientId},function(err,slots){
        if(err){
            res.json({"success":false,code:0,err:err})
        }else{
            res.json({"success":true,code:1,slots:slots})
        }
    })
});


app.get('/smartPark/', function(req, res, next) {
    res.json({
        success: true,
        message: "This is a Smart Park App"
    });
});

apiRoutes.get('/currentMeter/:mobileNo',function(req,res){
    getCurrentMeter(req.params.mobileNo,function(order){
        if(order == null){
            res.json({"success":false,code:1,message:"no meter Data"});
        }
        else{    
        totalTime = (new Date() - new Date(order.inTime))/(60*1000); 
        res.json({"success":true,code:2,order:order,totalTime:totalTime,message:"current meter Data"});
        }
    })
})

apiRoutes.post('/qrdata', function(req, res) {
    console.log("body",req.body);
    users_model.findOne({mobileNo:req.body.mobileNo},function(err,user){
        if(err){
            res.json({"success":false,code:0,message:err})
        }
        else{
            console.log("user",user);
            orders_model.update({slotId:req.body.slotId,status:"open"}, {$set:{'vehicleNo':user.vehicleNo,'mobileNo':user.mobileNo,'clientId':req.body.clientId,'facilityId':req.body.facilityId}}, {multi:false},function(err,raw,data){
                if(err){
                    res.json({"success":false,code:0,message:err})
                }
                else{
                    if(raw.n == 0){
                        res.json({"success":false,code:1,message:"no car at the given parking"});         
                    }else{
                        if(raw.n == 1 && raw.nModified == 0){
                            res.json({"success":false,code:2,message:"Already Scanned"});  
                        }else{
                            getCurrentMeter(req.body.mobileNo,function(order){
                                parkingSlot_model.update({slotId:req.body.slotId},{$set:{regNo:user.vehicleNo}},function(err,user){
                                    if(err){
                                        console.log("Some Error",err);
                                    }
                                    else{
                                        console.log("updated");
                                        res.json({"success":true,code:3,message:"qrcode added",order:order}); 
                                    }
                                })
                                 
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
                parkingSlot_model.findOne({slotId:responseData.slotId},function(err,slot){
                    if(err){

                    }else{
                        slot.status = "full",
                        slot.inTime = responseData.inTime,
                        slot.regNo = responseData.vehicleNo
                        slot.save(function(err,user){
                            if(err){
                            }
                            else{
                                console.log(user);
                                io.emit('admin/parkingUpdate',user);
                                console.log("ho gaya")
                            }
                        })
                    }
                })
            })
            break;
        case 'client/smartPark/ultraSonicData/available':
            console.log(JSON.parse(message.valueOf()))
            stopMeter(JSON.parse(message.valueOf()),function(responseData){
                console.log(responseData);
                parkingSlot_model.findOne({slotId:responseData.slotId},function(err,slot){
                    if(err){

                    }else{
                        slot.status = "available",
                        slot.inTime = null,
                        slot.regNo = null
                        slot.save(function(err,user){
                            if(err){
                            }
                            else{
                                console.log(user);
                                io.emit('admin/parkingUpdate',user);
                                console.log("ho gaya")
                            }
                        })
                    }
                })
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

            var options = {
                l: 'eng',
                psm: 6,
                binary: '/usr/local/bin/tesseract'
            };        
            tesseract.process('ocrImages/file.png', options, function(err, text) {
                if (err) {
                    console.error(err);
                } else {
                    console.log(text);
                    text = text.replace(/(\r\n|\n|\r)/gm,"");
                    var newOrder = new orders_model({
                        vehicleNo:text,
                        slotId:data.sensor_id,
                        inTime:new Date(),
                        status:"open",
                    });

                    newOrder.save(function(err,order){
                        if(err){
                            console.log(err);
                        }
                        else{
                            callback(order);
                        }
                    })
                    
                }
            });
        });
}

var stopMeter = function(data,callback){
    console.log(data)
    orders_model.findOne({slotId:data.sensor_id,status:"open"},function(err,order){
        if(err){

        }else{
            order.status = "close";
            order.outTime = new Date();
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


//**************************************Web Socket******************************************//

server.listen(4200);
app.use('/api', apiRoutes);