#!/usr/bin/python3
import pyautogui as pg
import sys
pg.FAILSAFE = False
xCoordinate = int(sys.argv[1])
yCoordinate = int(sys.argv[2])

pg.click(xCoordinate, yCoordinate)
print("1")
del sys, pg, xCoordinate, yCoordinate
