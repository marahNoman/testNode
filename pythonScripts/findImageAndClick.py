#!/usr/bin/python3
import os
import datetime
import pyautogui as pg
import time
import sys

pg.FAILSAFE = False

# Extracting command line arguments
searchImage = sys.argv[1]
xCoordinate = int(sys.argv[2])
yCoordinate = int(sys.argv[3])
height = int(sys.argv[4])
width = int(sys.argv[5])
timeOut = int(sys.argv[6])

# Set up logging
userName = os.environ.get('USER')
date = datetime.datetime.now().strftime("%Y-%m-%d")
logFileLocation = f"/home/{userName}/pythonLogs/{date}.txt"

def prepareLogsFolder():
    if not os.path.isdir(f"/home/{userName}/pythonLogs"):
        os.mkdir(f"/home/{userName}/pythonLogs")

prepareLogsFolder()

def write_log(message):
    with open(logFileLocation, "a") as logsWritingObject:
        logsWritingObject.write(message + "\n")

# Write initial information to log
write_log(f"SCRIPT : {os.path.basename(__file__)}")
write_log(f"TARGET : {os.path.basename(searchImage)}")
write_log(f"X COORDINATE  : {xCoordinate}")
write_log(f"Y COORDINATE  : {yCoordinate}")
write_log(f"HEIGHT  : {height}")
write_log(f"WIDTH  : {width}")
write_log(f"TIME OUT  : {timeOut}")
write_log(f"START @ {datetime.datetime.now()}")

# Function to find image on the screen
def findImage(image):
    try:
        x = pg.locateCenterOnScreen(image, confidence=0.80)
        return x
    except pg.ImageNotFoundException:
        return None

# Main loop with timeout
start_time = time.time()
current_time=None
while time.time() - start_time < timeOut:
    current_time = time.time()
    x = findImage(searchImage)
    if x is not None:
        pg.click(x[0], x[1])
        write_log(f"Image found at coordinates: {x}")
        returnValue = 1
        break
    else:
        write_log(f"Image not found, iteration took {time.time() - current_time} seconds")
        returnValue = 0
    time.sleep(0.25)

print(returnValue, ',', current_time)
# Write results to log
write_log(f"END {datetime.datetime.now()}")
write_log(f"TOTAL TIME  {time.time() - start_time}")
write_log(f"RESULT {returnValue}")
