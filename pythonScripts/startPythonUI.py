#!/usr/bin/python3
import pyautogui as pg


def alertBox():
    pg.alert(text='WELCOME PYTHON AUTO GUI TOOL', title='', timeout=2000)


alertBox()
del pg
