var mqtt = require('mqtt');
var client  = mqtt.connect('mqtt://localhost:1883');
var express = require('express');  
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io')(server);
var mongoose = require('mongoose');
var cors = require('cors')
var config =require('./config');
var parkingFacility_model = require('./models/parkingFacility');
var parkingSlot_model = require('./models/parkingSlot');
var tessocr = require('tessocr');
var tess = tessocr.tess()
var morgan = require('morgan');
var tesseract = require('node-tesseract');
app.use(morgan('dev'));
var fs = require('fs');
//..for connecting to mongoose..//
mongoose.connect(config.url);

app.use(cors());
app.use(express.static(__dirname + '/SmartPark/public/'));   
client.on('connect', function () {

})

pictures = [];
//******************************************all the api end points***************************//
app.get('/glowLed/:userName', function (req, res) {
	client.subscribe('client/'+req.params.userName+'/glowLed')
	client.publish('server/'+req.params.userName,"glow_led")
	client.on('message', function (topic, message) {
		if(topic === 'client/'+req.params.userName+'/glowLed'){
			res.json({state:message.toString()})
			console.log("led glowing");
			console.log(message.toString())
		}
	})
})

function reconstructBase64String(chunk) {
  console.log(chunk);
    pChunk = JSON.parse(chunk);

    //creates a new picture object if receiving a new picture, else adds incoming strings to an existing picture 
    if (pictures[pChunk["pic_id"]]==null) {
        pictures[pChunk["pic_id"]] = {"count":0, "total":pChunk["size"], pieces: {}, "pic_id": pChunk["pic_id"]};

        pictures[pChunk["pic_id"]].pieces[pChunk["pos"]] = pChunk["data"];

    }

    else {
        pictures[pChunk["pic_id"]].pieces[pChunk["pos"]] = pChunk["data"];
        pictures[pChunk["pic_id"]].count += 1;


        if (pictures[pChunk["pic_id"]].count == pictures[pChunk["pic_id"]].total) {
        console.log("Image reception compelete");
        var str_image=""; 

        for (var i = 0; i <= pictures[pChunk["pic_id"]].total; i++) 
            str_image = str_image + pictures[pChunk["pic_id"]].pieces[i];

        var source = 'data:image/jpeg;base64,'+str_image;
console.log(source);
        }

    }

}
app.post('/addFacility',function(req,res){

	var facility = new parkingFacility_model({
		name: "A",
		fid: "A",
		capacity:10
	});
	facility.save(function(err){
		if(err){
			console.log(err);
		}
		else{
			console.log("added SuccessFully")
		}
	})
});



app.get('/', function(req, res,next) {  
    res.sendFile(__dirname + '/index.html');
});

app.get('/smartPark/', function(req, res,next) {  
    res.json({success:true,message:"This is a Smart PArk App"});
});



app.get('/parkingInfo',function(req,res){
	var data = [
				{slot:"A1",block:"A",facility:"Aspire",status:'full'},
                {slot:"A2",block:"A",facility:"Aspire",status:'available'},
                {slot:"B1",block:"B",facility:"Aspire",status:'full'},
                {slot:"B2",block:"B",facility:"Aspire",status:'full'},
                {slot:"C1",block:"C",facility:"Aspire",status:'available'},
                {slot:"C2",block:"C",facility:"Aspire",status:'full'},
                {slot:"A1",block:"A",facility:"Info",status:'available'},
                {slot:"A2",block:"A",facility:"Info",status:'full'},
                {slot:"B1",block:"B",facility:"Info",status:'full'},
                {slot:"B2",block:"B",facility:"Info",status:'available'}
    ];
    res.json({success:true,data:data});
});

client.subscribe('client/ameyashukla/ultraSonicData')

function decodeBase64Image(dataString) 
        {
          var matches = dataString;
          var response = {};

          if (matches.length !== 3) 
          {
            return new Error('Invalid input string');
          }

          response.type = matches[1];
          response.data = new Buffer(matches[2], 'base64');

          return response;
        }
client.on('message', function (topic, message) {
console.log(message);
    if(topic === 'client/ameyashukla/ultraSonicData'){
                 console.log("ultra data");
		reconstructBase64String(message);
                    }
});


app.get('/parkingStatus/:userName',function(req,res){
	console.log(req.params.userName)
	var user = req.params.userName;
 	io.emit(user,{"slot_no":"A2","reg_no":"TN 14 H 08895","in_time":new Date(),status:"full"});
 	res.json("Hogata")

})

var options = {
    l: 'eng',
    psm: 6,
    binary: '/usr/local/bin/tesseract'
};
tesseract.process('file.jpeg',options,function(err, text) {
    if(err) {
        console.error(err);
    } else {
        console.log(text);
        console.log("finished")
    }
});

//**************************************Web Socket******************************************//
io.on('connection', function(client_socket) {
    client_socket.on('ultraSonicData', function(data) {
    	client.subscribe('client/'+data+'/ldrData')
    	client.publish('server/'+data,"ldrData")
    	client.on('message', function (topic, message) {
		if(topic === 'client/'+data+'/ldrData'){
			console.log("ldr data");
			console.log(message.toString())
        	io.emit("server",'hey client');
			}
		})
        console.log(data);
    });
});
server.listen(4200);  
