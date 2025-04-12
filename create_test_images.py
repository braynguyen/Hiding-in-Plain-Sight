#!/usr/bin/env python3
from PIL import Image
import numpy as np
import os
from stegano import lsb

# Create directory for test images
os.makedirs("test_images/clean", exist_ok=True)
os.makedirs("test_images/steg", exist_ok=True)

# Create a blank white image
blank_img = Image.new('RGB', (300, 300), color=(255, 255, 255))
blank_img.save('test_images/clean/blank.png')

# Create a gradient image
gradient_img = Image.new('RGB', (300, 300))
for i in range(300):
    for j in range(300):
        gradient_img.putpixel((i, j), (i%256, j%256, (i+j)%256))
gradient_img.save('test_images/clean/gradient.png')

# Create a simple pattern image
pattern_img = Image.new('RGB', (300, 300))
for i in range(300):
    for j in range(300):
        if (i//50 + j//50) % 2 == 0:
            pattern_img.putpixel((i, j), (255, 0, 0))
        else:
            pattern_img.putpixel((i, j), (0, 0, 255))
pattern_img.save('test_images/clean/pattern.png')

# Create a photo-like image
photo_img = Image.new('RGB', (300, 300))
for i in range(300):
    for j in range(300):
        r = int(128 + 127 * np.sin(i/30))
        g = int(128 + 127 * np.sin(j/30))
        b = int(128 + 127 * np.sin((i+j)/30))
        photo_img.putpixel((i, j), (r, g, b))
photo_img.save('test_images/clean/photo_like.png')

# Create a copy of each image with hidden data
# Hidden message
message = "The quick brown fox jumps over the lazy dog. 1234567890!@#$%^&*()"

# Hide message in blank image
blank_steg = Image.open('test_images/clean/blank.png')
steg_blank = lsb.hide(blank_steg, message)
steg_blank.save('test_images/steg/steg_blank.png')

message = "I love Pitt CSC"

# Hide message in gradient image
gradient_steg = Image.open('test_images/clean/gradient.png')
steg_gradient = lsb.hide(gradient_steg, message)
steg_gradient.save('test_images/steg/steg_gradient.png')

message = "What you know about Nij Patel?"

# Hide message in pattern image
pattern_steg = Image.open('test_images/clean/pattern.png')
steg_pattern = lsb.hide(pattern_steg, message)
steg_pattern.save('test_images/steg/steg_pattern.png')

message = ":P"

# Hide message in photo-like image
photo_steg = Image.open('test_images/clean/photo_like.png')
steg_photo = lsb.hide(photo_steg, message)
steg_photo.save('test_images/steg/steg_photo.png')

print("Created test images in test_images directory:")
print("- Clean images: blank.png, gradient.png, pattern.png, photo_like.png")
print("- Images with hidden data: steg_blank.png, steg_gradient.png, steg_pattern.png, steg_photo.png")
