var mqtt = require('mqtt')
var client  = mqtt.connect('mqtt://localhost:1883')
var express = require('express');  
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io')(server);


app.use(express.static(__dirname + '/node_modules'));  
 
client.on('connect', function () {

})


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

app.get('/ldr', function(req, res,next) {  
    res.sendFile(__dirname + '/index.html');
});

//**************************************Web Socket******************************************//
io.on('connection', function(client_socket) {
    client_socket.on('ldrData', function(data) {
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

server.listen(3000);  