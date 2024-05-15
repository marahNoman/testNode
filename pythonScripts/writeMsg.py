#!/usr/bin/python3
import pyautogui as pg
import sys
x = sys.argv[1]
y =sys.argv[2]
pg.write(x, interval=y)
del pg, sys, x
