# Demus Mobile - Manual Directory Setup

## This file lists all directories that need to be created

To set up the project structure, create these directories:

```
tests/
tests/__mocks__/
src/
src/types/
src/api/
assets/
```

## Commands to create (Windows):

```cmd
mkdir tests
mkdir tests\__mocks__
mkdir src
mkdir src\types
mkdir src\api
mkdir assets
```

## Commands to create (Unix/Mac):

```bash
mkdir -p tests/__mocks__ src/types src/api assets
```

After creating directories, run:
- `python complete-setup.py` (recommended)
- OR `node complete-setup.js`

This will create all files and make the 3 required git commits.
