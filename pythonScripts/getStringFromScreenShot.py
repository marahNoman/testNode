#!/usr/bin/python3
import sys
import time
import datetime
import os
import pyautogui as pg
from PIL import Image
from pytesseract import pytesseract
xCoordinate = int(sys.argv[1])
yCoordinate = int(sys.argv[2])
hight = int(sys.argv[3])
width = int(sys.argv[4])
timeOut = int(sys.argv[5])
stringNeeded = sys.argv[6]
dir_path = os.path.dirname(os.path.realpath('~'))
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
logsWritingObject.write("TARGET : " + stringNeeded + "\n")
logsWritingObject.write("START @ " + str(datetime.datetime.now()) + "\n")
logsWritingObject.write("X COORDNATE  : " + str(xCoordinate) + "\n")
logsWritingObject.write("Y COORDNATE  : " + str(yCoordinate) + "\n")
logsWritingObject.write("HIGHT  : " + str(hight) + "\n")
logsWritingObject.write("WIDTH  : " + str(width) + "\n")
logsWritingObject.write("TIME OUT  : "+ str(timeOut) + "\n")
logsWritingObject.write("TIME OUT  : " + str(timeOut) + "\n")
start_time = time.time()
counter = 0
while True:
    current_time = time.time()
    img = pg.screenshot(region=(xCoordinate, yCoordinate, width, hight))
    counter += 1
    logsWritingObject.write("SCREEN SHOT "+str(time.time()-current_time)+"\n")
    img = img.save(dir_path+"/screenShot.png")
    logsWritingObject.write("SAVING SCREEN SHOT "+str(time.time()- current_time)+ "\n")
    text2 = pytesseract.image_to_string(Image.open(dir_path + '/screenShot.png'), lang="eng")
    logsWritingObject.write("EXTRACT STRING "+str(time.time()-current_time)+"\n")
    logsWritingObject.write("ITRATION # " + str(counter) + " " + str(time.time() - current_time) + "\n")
    os.remove(dir_path+'/screenShot.png')
    stringInImage = text2
    elapsed_time = current_time - start_time
    if elapsed_time >= timeOut:
        break
    if stringNeeded in stringInImage:
        returnValue = 1
        break
    else:
        returnValue = 0
    time.sleep(0.5)

print(returnValue, ',', elapsed_time)
logsWritingObject.write("END " + str(datetime.datetime.now()) + "\n")
logsWritingObject.write("TOTAL TIME  " + str(time.time() - start_time) + "\n")
logsWritingObject.write("RESULT " + str(returnValue) + "\n")
del returnValue, elapsed_time, current_time, start_time, time, pg, sys, xCoordinate, yCoordinate, hight, width, timeOut, counter, os, datetime, logsWritingObject, stringInImage, userName
