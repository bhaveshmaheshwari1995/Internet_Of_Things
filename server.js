var mqtt = require('mqtt')
var client  = mqtt.connect('mqtt://localhost:1883')
 
client.on('connect', function () {
})

var express = require('express')
var app = express()

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

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
