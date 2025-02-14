const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const uploadDir = './uploads';  // Local development
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '1024') * 1024 * 1024; // Convert MB to bytes

// Validate and set PIN
const validatePin = (pin) => {
    if (!pin) return null;
    const cleanPin = pin.replace(/\D/g, '');  // Remove non-digits
    return cleanPin.length >= 4 && cleanPin.length <= 10 ? cleanPin : null;
};
const PIN = validatePin(process.env.DUMBDROP_PIN);

// Logging helper
const log = {
    info: (msg) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`),
    error: (msg) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`),
    success: (msg) => console.log(`[SUCCESS] ${new Date().toISOString()} - ${msg}`)
};

// Helper function to ensure directory exists
async function ensureDirectoryExists(filePath) {
    const dir = path.dirname(filePath);
    try {
        await fs.promises.mkdir(dir, { recursive: true });
    } catch (err) {
        log.error(`Failed to create directory ${dir}: ${err.message}`);
        throw err;
    }
}

// Ensure upload directory exists
try {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
        log.info(`Created upload directory: ${uploadDir}`);
    }
    fs.accessSync(uploadDir, fs.constants.W_OK);
    log.success(`Upload directory is writable: ${uploadDir}`);
    log.info(`Maximum file size set to: ${maxFileSize / (1024 * 1024)}MB`);
    if (PIN) {
        log.info('PIN protection enabled');
    }
} catch (err) {
    log.error(`Directory error: ${err.message}`);
    log.error(`Failed to access or create upload directory: ${uploadDir}`);
    log.error('Please check directory permissions and mounting');
    process.exit(1);
}

// Middleware
app.use(cors());
app.use(cookieParser());
app.use(express.json());

// Helper function for constant-time string comparison
function safeCompare(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') {
        return false;
    }
    
    // Use Node's built-in constant-time comparison
    return crypto.timingSafeEqual(
        Buffer.from(a.padEnd(32)), 
        Buffer.from(b.padEnd(32))
    );
}

// Pin verification endpoint
app.post('/api/verify-pin', (req, res) => {
    const { pin } = req.body;
    
    // If no PIN is set in env, always return success
    if (!PIN) {
        return res.json({ success: true });
    }

    // Verify the PIN using constant-time comparison
    if (safeCompare(pin, PIN)) {
        // Set secure cookie
        res.cookie('DUMBDROP_PIN', pin, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/'
        });
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, error: 'Invalid PIN' });
    }
});

// Check if PIN is required
app.get('/api/pin-required', (req, res) => {
    res.json({ 
        required: !!PIN,
        length: PIN ? PIN.length : 0
    });
});

// Pin protection middleware
const requirePin = (req, res, next) => {
    if (!PIN) {
        return next();
    }

    const providedPin = req.headers['x-pin'] || req.cookies.DUMBDROP_PIN;
    if (!safeCompare(providedPin, PIN)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// Apply pin protection to all /upload routes
app.use('/upload', requirePin);

// Serve login page and its assets without PIN check
app.use((req, res, next) => {
    if (req.path === '/login.html' || req.path === '/styles.css' || req.path.startsWith('/api/')) {
        return next();
    }

    // Check PIN requirement
    if (!PIN) {
        return next();
    }

    // Check cookie
    const providedPin = req.cookies.DUMBDROP_PIN;
    if (!safeCompare(providedPin, PIN)) {
        // If requesting HTML or root, redirect to login
        if (req.path === '/' || req.path.endsWith('.html')) {
            return res.redirect('/login.html');
        }
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
});

// Serve static files
app.use(express.static('public'));

// Handle root route
app.get('/', (req, res) => {
    if (PIN && !safeCompare(req.cookies.DUMBDROP_PIN, PIN)) {
        return res.redirect('/login.html');
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Store ongoing uploads
const uploads = new Map();

// Routes
app.post('/upload/init', async (req, res) => {
    const { filename, fileSize } = req.body;
    
    // Check file size limit
    if (fileSize > maxFileSize) {
        log.error(`File size ${fileSize} bytes exceeds limit of ${maxFileSize} bytes`);
        return res.status(413).json({ 
            error: 'File too large',
            limit: maxFileSize,
            limitInMB: maxFileSize / (1024 * 1024)
        });
    }

    const uploadId = Date.now().toString();
    const filePath = path.join(uploadDir, filename);
    
    try {
        await ensureDirectoryExists(filePath);
        
        uploads.set(uploadId, {
            filename,
            filePath,
            fileSize,
            bytesReceived: 0,
            writeStream: fs.createWriteStream(filePath)
        });

        log.info(`Initialized upload for ${filename} (${fileSize} bytes)`);
        res.json({ uploadId });
    } catch (err) {
        log.error(`Failed to initialize upload: ${err.message}`);
        res.status(500).json({ error: 'Failed to initialize upload' });
    }
});

app.post('/upload/chunk/:uploadId', express.raw({ 
    limit: '10mb', 
    type: 'application/octet-stream' 
}), (req, res) => {
    const { uploadId } = req.params;
    const upload = uploads.get(uploadId);
    const chunkSize = req.body.length;

    if (!upload) {
        return res.status(404).json({ error: 'Upload not found' });
    }

    try {
        upload.writeStream.write(Buffer.from(req.body));
        upload.bytesReceived += chunkSize;

        const progress = Math.round((upload.bytesReceived / upload.fileSize) * 100);
        log.info(`Received chunk for ${upload.filename}: ${progress}%`);

        res.json({ 
            bytesReceived: upload.bytesReceived,
            progress
        });

        // Check if upload is complete
        if (upload.bytesReceived >= upload.fileSize) {
            upload.writeStream.end();
            uploads.delete(uploadId);
            log.success(`Upload completed: ${upload.filename}`);
        }
    } catch (err) {
        log.error(`Chunk upload failed: ${err.message}`);
        res.status(500).json({ error: 'Failed to process chunk' });
    }
});

app.post('/upload/cancel/:uploadId', (req, res) => {
    const { uploadId } = req.params;
    const upload = uploads.get(uploadId);

    if (upload) {
        upload.writeStream.end();
        fs.unlink(upload.filePath, (err) => {
            if (err) log.error(`Failed to delete incomplete upload: ${err.message}`);
        });
        uploads.delete(uploadId);
        log.info(`Upload cancelled: ${upload.filename}`);
    }

    res.json({ message: 'Upload cancelled' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    log.error(`Unhandled error: ${err.message}`);
    res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Start server
app.listen(port, () => {
    log.info(`Server running at http://localhost:${port}`);
    log.info(`Upload directory: ${uploadDir}`);
    
    // List directory contents
    try {
        const files = fs.readdirSync(uploadDir);
        log.info(`Current directory contents (${files.length} files):`);
        files.forEach(file => {
            log.info(`- ${file}`);
        });
    } catch (err) {
        log.error(`Failed to list directory contents: ${err.message}`);
    }
});
