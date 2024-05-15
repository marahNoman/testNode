#!/usr/bin/python3
import os
import speech_recognition as sr

r = sr.Recognizer()

# Expand the ~ to the full home directory path
home_directory = os.path.expanduser("~")
wav_file_path = os.path.join(home_directory, "output.wav")

with sr.AudioFile(wav_file_path) as source:
    audio = r.record(source)

try:
    s = r.recognize_google(audio)
    print("Text: " + s)
except Exception as e:
    print("Exception: " + str(e))