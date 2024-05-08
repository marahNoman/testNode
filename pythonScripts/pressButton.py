#!/usr/bin/python3
import pyautogui as pg
import sys
button = sys.argv[1]
pg.press(button)

del pg, sys, button
