#!/usr/bin/python3
import pyautogui as pg
import sys
import time
import datetime
import os
searchImage = sys.argv[1]
xCoordinate = int(sys.argv[2])
yCoordinate = int(sys.argv[3])
hight = int(sys.argv[4])
width = int(sys.argv[5])
timeOut = int(sys.argv[6])

date = datetime.datetime.now().strftime("%Y-%m-%d")


def prepareLogsFolder():
    userName = os.environ.get('USER')
    if(not(os.path.isdir("/home/"+userName + "/pythonLogs"))):
        os.mkdir("/home/"+userName + "/pythonLogs")


prepareLogsFolder()
userName = os.environ.get('USER')
logFileLocation = "/home/"+userName + \
    "/pythonLogs/" + '/' + str(date) + ".txt"

logsWritingObject = open(logFileLocation, "a")
logsWritingObject.write("THE "+__file__+" START IN " + str(datetime.datetime.now()) + " FOR SEARCH ABOUT "+searchImage+"\n")
start_time = time.time()


def findImage(searchImage):
    x = pg.locateCenterOnScreen(searchImage, confidence=0.75, region=(xCoordinate, yCoordinate, hight, width))
    return x


counter = 0
while True:
    current_time = time.time()
    elapsed_time = current_time - start_time
    if elapsed_time >= timeOut:
        break
    x = findImage(searchImage)
    logsWritingObject.write("THE TOTAL TIME FOR FIND IMAGE ATTEMPS IS " + time.time()-current_time + (counter+1) + "\n")
    if (x is not None):
        returnValue = 1
        break
    else:
        returnValue = 0
    time.sleep(2)
    elapsed_time = current_time - start_time


print(returnValue, ',', elapsed_time)
logsWritingObject.write("THE TOTAL TIME FOR FIND IMAGE IS "+str(time.time()-current_time)+"\n")
logsWritingObject.write("THE TOTAL TIME FOR FIND IMAGE ATTEMPS IS" + str(counter) + "\n")
del returnValue, elapsed_time, current_time, x, searchImage, start_time, time, pg, sys, xCoordinate, yCoordinate, hight, width, timeOut, datetime, os, counter, userName
