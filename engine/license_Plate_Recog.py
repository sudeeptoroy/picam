import cv2
import imutils
import numpy as np
import pytesseract
from PIL import Image

import argparse, sys
import asyncio
import os
import signal
from nats.aio.client import Client as NATS

import base64
import io
import json

async def run(loop):
        nc = NATS()
    
        async def error_cb(e):
                print("Error:", e)
    
        async def closed_cb():
                print("Connection to NATS is closed.")
                await asyncio.sleep(0.1, loop=loop)
                loop.stop()
    
        async def reconnected_cb():
                print("Connected to NATS at {}...".format(nc.connected_url.netloc))
    
        async def subscribe_handler(msg):
                subject = msg.subject
                reply = msg.reply
                data = msg.data.decode()
                message = None
                message = json.loads(msg.data.decode())
                num_plate = process_image(message['file'])
                resp = {
                        'jobno': message['jobno'],
                        'plate': num_plate
                }
                s1 = json.dumps(resp)
                d2 = json.loads(s1)
                await nc.publish("num_plate", s1.encode('utf-8'))
    
        options = {
                "io_loop": loop,
                "error_cb": error_cb,
                "closed_cb": closed_cb,
                "reconnected_cb": reconnected_cb
        }
    
        #if len(args.creds) > 0:
        #    options["user_credentials"] = args.creds
    
        try:
                server = "nats://192.168.0.145:4222"
                options['servers'] = server
            #if len(args.servers) > 0:
            #    options['servers'] = args.servers
    
                await nc.connect(**options)
        except Exception as e:
                print(e)
            #show_usage_and_die()
    
        print("Connected to NATS at {}...".format(nc.connected_url.netloc))
        def signal_handler():
                if nc.is_closed:
                        return
                print("Disconnecting...")
                loop.create_task(nc.close())
    
        for sig in ('SIGINT', 'SIGTERM'):
                loop.add_signal_handler(getattr(signal, sig), signal_handler)
    
        subject = 'captures'
        queue = 'workers'
        await nc.subscribe(subject, queue, subscribe_handler)

# Take in base64 string and return PIL image
def stringToImage(base64_string):
    imgdata = base64.b64decode(base64_string)
    return Image.open(io.BytesIO(imgdata))

# convert PIL Image to an RGB image( technically a numpy array ) that's compatible with opencv
def toRGB(image):
    return cv2.cvtColor(np.array(image), cv2.COLOR_BGR2RGB)

def process_image(data):
#    img = cv2.imread('3.jpg',cv2.IMREAD_COLOR)
#    img = cv2.resize(img, (620,480) )
#    
    img = stringToImage(data)
    img = toRGB(img)
    #cv2.imwrite("reconstructed.jpg", img)
    img = cv2.resize(img, (620,480) )
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) #convert to grey scale
    gray = cv2.bilateralFilter(gray, 11, 17, 17) #Blur to reduce noise
    edged = cv2.Canny(gray, 30, 200) #Perform Edge detection
    
    # find contours in the edged image, keep only the largest
    # ones, and initialize our screen contour
    cnts = cv2.findContours(edged.copy(), cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    cnts = imutils.grab_contours(cnts)
    cnts = sorted(cnts, key = cv2.contourArea, reverse = True)[:10]
    screenCnt = None
    
    # loop over our contours
    for c in cnts:
            # approximate the contour
            peri = cv2.arcLength(c, True)
            approx = cv2.approxPolyDP(c, 0.018 * peri, True)
     
            # if our approximated contour has four points, then
            # we can assume that we have found our screen
            if len(approx) == 4:
                    screenCnt = approx
                    break
    
    if screenCnt is None:
            detected = 0
            print ("No contour detected")
            return "cannot recognize"
    else:
            detected = 1
    
    if detected == 1:
            cv2.drawContours(img, [screenCnt], -1, (0, 255, 0), 3)
    
    # Masking the part other than the number plate
    mask = np.zeros(gray.shape,np.uint8)
    new_image = cv2.drawContours(mask,[screenCnt],0,255,-1,)
    new_image = cv2.bitwise_and(img,img,mask=mask)
    
    # Now crop
    (x, y) = np.where(mask == 255)
    (topx, topy) = (np.min(x), np.min(y))
    (bottomx, bottomy) = (np.max(x), np.max(y))
    Cropped = gray[topx:bottomx+1, topy:bottomy+1]
    
    #Read the number plate
    text = pytesseract.image_to_string(Cropped, config='--psm 11')
    print("Detected Number is:",text)
    return text
    
    #cv2.imshow('image',img)
    #cv2.imshow('Cropped',Cropped)
    
    #cv2.waitKey(0)
    #cv2.destroyAllWindows()
    
if __name__ == '__main__':
        loop = asyncio.get_event_loop()
        loop.run_until_complete(run(loop))
        try:
            loop.run_forever()
        finally:
            loop.close()
