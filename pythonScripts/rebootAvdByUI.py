#!/usr/bin/python3
import pyautogui as pg
import datetime
import os
import time
timeOut = 10


def prepareLogsFolder():
    userName = os.environ.get('USER')
    if(not(os.path.isdir("/home/"+userName + "/pythonLogs"))):
        os.mkdir("/home/"+userName + "/pythonLogs")


prepareLogsFolder()
userName = os.environ.get('USER')
date = datetime.datetime.now().strftime("%Y-%m-%d")
logFileLocation = "/home/"+userName + \
    "/pythonLogs/" + '/' + str(date) + ".txt"

logsWritingObject = open(logFileLocation, "a")
logsWritingObject.write("SCRIPT : " + os.path.basename(__file__) + "\n")
logsWritingObject.write("TARGET : " + "REBOOT AVD" + "\n")
logsWritingObject.write("START @ " + str(datetime.datetime.now()) + "\n")

pg.moveTo(483, 72)
pg.dragTo(483, 72, 2, button='left')


def findImage(image):
    x = pg.locateCenterOnScreen(image, confidence=0.75)
    return x


counter = 0
searchImage = '/home/'+os.environ.get('USER')+'/7eet-saby-whatsapp-ubuntu20/saby/includes/img/restartAvdButton.png'
start_time = time.time()
while True:
    current_time = time.time()
    logsWritingObject.write("ITERATIION # " + str(counter) + "\n")
    x = findImage(searchImage)
    if (x is not None):
        pg.click(x[0], x[1])
        break
    counter += 1
    elapsed_time = current_time - start_time
    if elapsed_time >= timeOut:
        break

logsWritingObject.write("END " + str(datetime.datetime.now()) + "\n")
del searchImage, os, pg, x, datetime, counter, logFileLocation, logsWritingObject
