#!/usr/bin/env python3
"""
Create placeholder assets for Expo project
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename, bg_color=(52, 152, 219), text="D"):
    """Create a simple icon with text."""
    img = Image.new('RGB', (size, size), color=bg_color)
    draw = ImageDraw.Draw(img)
    
    # Try to use a nice font, fall back to default
    try:
        font_size = size // 2
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    # Calculate text position (centered)
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    position = ((size - text_width) // 2, (size - text_height) // 2)
    
    draw.text(position, text, fill='white', font=font)
    
    img.save(filename)
    print(f"✓ Created {filename}")

def create_splash(width, height, filename):
    """Create a simple splash screen."""
    img = Image.new('RGB', (width, height), color=(52, 152, 219))
    draw = ImageDraw.Draw(img)
    
    try:
        font = ImageFont.truetype("arial.ttf", 120)
    except:
        font = ImageFont.load_default()
    
    text = "Demus"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    position = ((width - text_width) // 2, (height - text_height) // 2)
    
    draw.text(position, text, fill='white', font=font)
    
    img.save(filename)
    print(f"✓ Created {filename}")

def main():
    """Create all required assets."""
    print("\n========================================")
    print("Creating Expo Assets")
    print("========================================\n")
    
    # Ensure assets directory exists
    os.makedirs('assets', exist_ok=True)
    
    # Create icons
    create_icon(1024, 'assets/icon.png')
    create_icon(1024, 'assets/adaptive-icon.png')
    create_icon(48, 'assets/favicon.png')
    
    # Create splash screen
    create_splash(1284, 2778, 'assets/splash.png')
    
    print("\n========================================")
    print("✅ All assets created!")
    print("========================================\n")

if __name__ == '__main__':
    try:
        main()
    except ImportError:
        print("\n❌ Error: PIL (Pillow) not installed")
        print("\nPlease run: pip install Pillow")
        print("Then run this script again.")
        exit(1)
