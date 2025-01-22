# Dumb Drop

A stupidly simple file upload application that provides a clean, modern interface for dragging and dropping files. Built with Node.js and vanilla JavaScript.

No auth, no storage, no nothing. Just a simple file uploader to drop dumb files into a dumb folder.

## Features

- Drag and drop file uploads
- Multiple file selection
- Clean, responsive UI
- File size display
- Docker support
- Configurable upload directory

## Quick Start

### Running Locally

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`:
```env
PORT=3000                  # Port to run the server on
UPLOAD_DIR=/app/file_uploads   # Directory to store uploaded files
```

3. Start the server:
```bash
npm start
```

### Running with Docker

#### Pull from Docker Hub
```bash
# Pull the image
docker pull abite3/dumbdrop:latest

# Run the container
# For Linux/Mac:
docker run -p 3000:3000 -v $(pwd)/local_uploads:/app/file_uploads --env-file .env abite3/dumbdrop:latest

# For Windows PowerShell:
docker run -p 3000:3000 -v "${PWD}\local_uploads:/app/file_uploads" --env-file .env abite3/dumbdrop:latest
```

#### Build Locally
1. Build the Docker image:
```bash
docker build -t dumbdrop .
```

2. Run the container:
```bash
# For Linux/Mac:
docker run -p 3000:3000 -v $(pwd)/local_uploads:/app/file_uploads --env-file .env dumbdrop

# For Windows PowerShell:
docker run -p 3000:3000 -v "${PWD}\local_uploads:/app/file_uploads" --env-file .env dumbdrop
```

## Environment Variables

| Variable    | Description                | Default     |
|------------|----------------------------|-------------|
| PORT       | Server port               | 3000        |
| UPLOAD_DIR | Upload directory path     | /app/file_uploads |

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Drag and drop files into the upload area or click "Browse Files"
3. Select one or multiple files
4. Click "Upload Files"
5. Files will be saved to the configured upload directory

## Technical Details

- Backend: Node.js with Express
- Frontend: Vanilla JavaScript with modern drag-and-drop API
- File handling: Multer middleware
- Containerization: Docker with automated builds via GitHub Actions 