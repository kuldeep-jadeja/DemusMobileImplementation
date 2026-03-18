import os

# Create directories
dirs = ['src/services', 'tests/services']
for dir_path in dirs:
    os.makedirs(dir_path, exist_ok=True)
    print(f'✓ Created: {os.path.abspath(dir_path)}')

print('\nDirectories created successfully!')
