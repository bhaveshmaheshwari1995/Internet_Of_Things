import paho.mqtt.client as mqtt

# The callback for when the client receives a CONNACK response from the server.
def on_connect(client, userdata, flags, rc):
    print("Connected with result code "+str(rc))
    client.subscribe("server/ameyashukla")
    # Subscribing in on_connect() means that if we lose the connection and
    # reconnect then subscriptions will be renewed.

# The callback for when a PUBLISH message is received from the server.
def on_message(client, userdata, msg):
    print("*********************msg****************************")
    print(msg.payload)
    if msg.payload == 'glow_led':
        client.publish("client/ameyashukla/glowLed", "The led is switched off")
    if msg.payload == 'ldrData':
        client.publish("client/ameyashukla/glowLed", "The led is switched off")
        for i  in range(1,150):
            client.publish("client/ameyashukla/ldrData",i)    



client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message

client.connect("localhost", 1883, 60)

# Blocking call that processes network traffic, dispatches callbacks and
# handles reconnecting.
# Other loop*() functions are available that give a threaded interface and a
# manual interface.
client.loop_forever()