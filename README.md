# Dumb Drop

A stupid simple file upload application that provides a clean, modern interface for dragging and dropping files. Built with Node.js and vanilla JavaScript.

![image](https://github.com/user-attachments/assets/2e39d8ef-b250-4689-9553-a580f11c06a7)


No auth (unless you want it now!), no storage, no nothing. Just a simple file uploader to drop dumb files into a dumb folder.

## Features

- Drag and drop file uploads
- Multiple file selection
- Clean, responsive UI
- File size display
- Docker support
- Dark Mode toggle
- Configurable file size limits
- Drag and Drop Directory Support (Maintains file structure in upload)
- Optional PIN protection

## Environment Variables

| Variable      | Description                | Default | Required |
|--------------|----------------------------|---------|----------|
| PORT         | Server port                | 3000    | No       |
| MAX_FILE_SIZE| Maximum file size in MB    | 1024    | No       |
| DUMBDROP_PIN | 4-digit PIN for protection | None    | No       |

# Future Features
- Camera Upload for Mobile
- Enhanced Progress Features (upload speed display, time remaining estimation)


## Quick Start

### Running Locally

1. Install dependencies:
```bash
npm install
```

2. Set environment variables in `.env`:
```env
PORT=3000                  # Port to run the server on
MAX_FILE_SIZE=1024        # Maximum file size in MB (default: 1024 MB / 1 GB)
DUMBDROP_PIN=1234         # Optional PIN protection (leave empty to disable)
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
docker run -p 3000:3000 -v $(pwd)/local_uploads:/app/uploads -e DUMBDROP_PIN=1234 abite3/dumbdrop:latest

# For Windows PowerShell:
docker run -p 3000:3000 -v "${PWD}\local_uploads:/app/uploads" -e DUMBDROP_PIN=1234 abite3/dumbdrop:latest
```

#### Build Locally
1. Build the Docker image:
```bash
docker build -t dumbdrop .
```

2. Run the container:
```bash
# For Linux/Mac:
docker run -p 3000:3000 -v $(pwd)/local_uploads:/app/uploads -e DUMBDROP_PIN=1234 dumbdrop

# For Windows PowerShell:
docker run -p 3000:3000 -v "${PWD}\local_uploads:/app/uploads" -e DUMBDROP_PIN=1234 dumbdrop
```

## Usage

1. Open your browser and navigate to `http://localhost:3000` (unless another domain has been setup)
2. If PIN protection is enabled, enter the 4-digit PIN
3. Drag and drop files into the upload area or click "Browse Files"
4. Select one or multiple files
5. Click "Upload Files"
6. Files will be saved to:
   - Local development: `./uploads` directory
   - Docker/Unraid: The directory you mapped to `/app/uploads` in the container

## Technical Details

- Backend: Node.js with Express
- Frontend: Vanilla JavaScript with modern drag-and-drop API
- File handling: Chunked file uploads with configurable size limits
- Security: Optional PIN protection for uploads
- Containerization: Docker with automated builds via GitHub Actions
