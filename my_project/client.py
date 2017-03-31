import paho.mqtt.client as mqtt
import base64
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
    if msg.payload == 'ultraSonicData':
            client.publish("client/ameyashukla/ultraSonicData",i)    

def sendData():
        client.publish('client/smartPark/ultraSonicData/occupied','{"sensor_id":"S1","key":"ocrimages/2017/03/index.png"}')
    # while (count < 9):
    #     print 'The count is:', count
    #     count = count + 1
    #     client.publish("client/ameyashukla/ultraSonicData","how it is")

def sendData1():
    client.publish('client/smartPark/ultraSonicData/available','{"sensor_id":"S1"}')


client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message


client.connect("localhost", 1883, 60)
if __name__ == '__main__':
    sendData1()

# Blocking call that processes network traffic, dispatches callbacks and
# handles reconnecting.
# Other loop*() functions are available that give a threaded interface and a
# manual interface.
client.loop_forever()