#!/usr/bin/python3
import pyautogui as pg
import sys
x = sys.argv[1]
pg.write(x, interval=0.5)
del pg, sys, x
