#!/usr/bin/python3
import pyautogui as pg
import sys
import time
import os
import datetime
searchImage = sys.argv[1]
xCoordinate = int(sys.argv[2])
yCoordinate = int(sys.argv[3])
hight = int(sys.argv[4])
width = int(sys.argv[5])
timeOut = int(sys.argv[6])

start_time = time.time()
dir_path = os.path.dirname(os.path.realpath(__file__))
date = datetime.datetime.now().strftime("%Y-%m-%d")


def prepareLogsFolder():
    userName = os.environ.get('USER')
    if (not (os.path.isdir("/home/"+userName + "/pythonLogs"))):
        os.mkdir("/home/"+userName + "/pythonLogs")


prepareLogsFolder()
userName = os.environ.get('USER')
logFileLocation = "/home/"+userName + "/pythonLogs/" + '/' + str(date) + ".txt"

logsWritingObject = open(logFileLocation, "a")
logsWritingObject.write("SCRIPT : " + os.path.basename(__file__) + "\n")
logsWritingObject.write("TARGET : " + os.path.basename(searchImage) + "\n")
logsWritingObject.write("X COORDNATE  : " + str(xCoordinate) + "\n")
logsWritingObject.write("Y COORDNATE  : " + str(yCoordinate) + "\n")
logsWritingObject.write("HIGHT  : " + str(hight) + "\n")
logsWritingObject.write("WIDTH  : " + str(width) + "\n")
logsWritingObject.write("TIME OUT  : " + str(timeOut) + "\n")
logsWritingObject.write("START @ " + str(datetime.datetime.now()) + "\n")


def findImage(searchImage):
    x = pg.locateCenterOnScreen(searchImage, confidence=0.75)
    return x


counter = 0
while True:
    current_time = time.time()
    elapsed_time = current_time - start_time
    if elapsed_time >= timeOut:
        break
    x = findImage(searchImage)
    counter += 1
    logsWritingObject.write("ITERATIION # " + str(counter) + "  " + str(time.time() - current_time) + "\n")
    if (x is not None):
        returnValue = 1
        break
    else:
        returnValue = 0
    elapsed_time = current_time - start_time
    time.sleep(0.25)


print(returnValue, ',', elapsed_time)
logsWritingObject.write("END " + str(datetime.datetime.now()) + "\n")
logsWritingObject.write("TOTAL TIME  " + str(time.time() - start_time) + "\n")
logsWritingObject.write("RESULT " + str(returnValue) + "\n")
del returnValue, elapsed_time, current_time, x, searchImage, start_time, time, pg, sys
del xCoordinate, yCoordinate, hight, width, timeOut, counter, os, datetime, logsWritingObject, userName, logFileLocation
