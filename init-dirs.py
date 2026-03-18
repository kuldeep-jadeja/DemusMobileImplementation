import os
import sys

# Get the script directory
script_dir = os.path.dirname(os.path.abspath(__file__))
planning_dir = os.path.join(script_dir, '.planning', 'research')

# Create directories
os.makedirs(planning_dir, exist_ok=True)

print(f"✓ Created directories at: {planning_dir}")
print(f"✓ Ready for research files")

# Return success
sys.exit(0)
