from PIL import Image
import numpy as np
import os

# Create directory for test images
os.makedirs("test_images/clean", exist_ok=True)
os.makedirs("test_images/steg", exist_ok=True)

def hide_in_lsb1(image, message):
    # Convert message to binary string
    binary_message = ''.join(format(ord(char), '08b') for char in message) + '00000000'

    # Get pixel data
    pixels = np.array(image)
    if pixels.ndim != 3 or pixels.shape[2] != 3:
        raise ValueError("Image must be RGB.")

    height, width, _ = pixels.shape
    flat_pixels = pixels.reshape(-1, 3)

    required_bits = len(binary_message)
    available_bits = flat_pixels.shape[0] * 3

    if required_bits > available_bits:
        raise ValueError("Image not large enough to hide the message.")

    # Step 1: Normalize RGB values (set LSBs to 0)
    flat_pixels[:, 0] &= 0b11111110  # R
    flat_pixels[:, 1] &= 0b11111110  # G
    flat_pixels[:, 2] &= 0b11111110  # B

    # Step 2: Hide message bits in LSBs
    bit_index = 0
    for i in range(flat_pixels.shape[0]):
        for channel in range(3):  # R, G, B
            if bit_index < required_bits:
                bit = int(binary_message[bit_index])
                flat_pixels[i, channel] |= bit
                bit_index += 1

    # Reconstruct image
    encoded_pixels = flat_pixels.reshape((height, width, 3))
    return Image.fromarray(encoded_pixels.astype('uint8'))

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
steg_blank = hide_in_lsb1(blank_steg, message)
steg_blank.save('test_images/steg/steg_blank.png')

message = "I love Pitt CSC"

# Hide message in gradient image
gradient_steg = Image.open('test_images/clean/gradient.png')
steg_gradient = hide_in_lsb1(gradient_steg, message)
steg_gradient.save('test_images/steg/steg_gradient.png')

message = "What you know about Nij Patel?"

# Hide message in pattern image
pattern_steg = Image.open('test_images/clean/pattern.png')
steg_pattern = hide_in_lsb1(pattern_steg, message)
steg_pattern.save('test_images/steg/steg_pattern.png')

message = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."


# Hide message in photo-like image
photo_steg = Image.open('test_images/clean/photo_like.png')
steg_photo = hide_in_lsb1(photo_steg, message)
steg_photo.save('test_images/steg/steg_photo.png')

print("Created test images in test_images directory:")
print("- Clean images: blank.png, gradient.png, pattern.png, photo_like.png")
print("- Images with hidden data: steg_blank.png, steg_gradient.png, steg_pattern.png, steg_photo.png")
