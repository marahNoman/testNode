#!/usr/bin/python3
import os
import requests
from PIL import Image
from io import BytesIO
from urllib.parse import urljoin
from datetime import datetime
import sys
import time

curr_dt = datetime.now()
timestamp = int(round(curr_dt.timestamp()))

# Base API endpoint
base_url = "https://this-person-does-not-exist.com/new"

# API parameters
params = {
    "time": "1699789176127",
    "gender": "female",
    "age": "20-29",
    "ethnic": "white"  # corrected typo in "ethnic"
}

# Make the API request
response = requests.get(urljoin(base_url, ""), params=params)

# Check if the request was successful (status code 200)
if response.status_code == 200:
    # Parse the JSON response
    data = response.json()

    # Get the image URL
    image_url = urljoin(base_url, data["src"])

    # Make a request to get the image
    image_response = requests.get(image_url)

    # Check if the image request was successful
    if image_response.status_code == 200:
        # Open the image using PIL
        img = Image.open(BytesIO(image_response.content))

        # Crop the image by 10 pixels
        left = 0
        top = 60
        right = img.width - 0
        bottom = img.height - 60

        cropped_img = img.crop((left, top, right, bottom))

        # Save the cropped image in the main directory
        home_directory = os.path.expanduser("~")
        file_path = os.path.join(home_directory, "cropped_image.jpg")
        cropped_img.save(file_path)
        print(1)
    else:
         print(0)
else:
    print("API Generate photo request failed.")

sys.exit()
