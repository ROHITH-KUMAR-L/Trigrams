import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5002;

// Enable CORS
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../trigram_llm/data');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, 'input.txt'); // Always overwrite input.txt
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
    fileFilter: (req, file, cb) => {
        if (file.originalname.endsWith('.txt')) {
            cb(null, true);
        } else {
            cb(new Error('Only .txt files are allowed'));
        }
    }
});

// Training endpoint with SSE (Server-Sent Events)
app.post('/train', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendProgress = (step, percent) => {
        res.write(`data: ${JSON.stringify({ event: 'progress', step, percent })}\n\n`);
    };

    const sendComplete = (data) => {
        res.write(`data: ${JSON.stringify({ event: 'complete', ...data })}\n\n`);
        res.end();
    };

    const sendError = (message) => {
        res.write(`data: ${JSON.stringify({ event: 'error', message })}\n\n`);
        res.end();
    };

    sendProgress('Preparing training environment...', 10);

    // Path to the C training binary
    const llmDir = path.join(__dirname, '../trigram_llm');
    const binaryPath = path.join(llmDir, 'trigram_llm');
    const modelPath = path.join(llmDir, 'output/model.bin');

    // Check if binary exists
    if (!fs.existsSync(binaryPath)) {
        return sendError('Training binary not found. Please compile trigram_llm first.');
    }

    sendProgress('Starting training process...', 20);

    // Spawn the training process
    const trainProcess = spawn(binaryPath, ['--train'], {
        cwd: llmDir,
        env: { ...process.env }
    });

    let outputBuffer = '';
    let errorBuffer = '';

    // Set a timeout to kill the process if it takes too long (2 minutes)
    const timeout = setTimeout(() => {
        console.error('Training timeout - killing process');
        trainProcess.kill('SIGKILL');
        sendError('Training timed out after 2 minutes. The file might be too large or the process is stuck.');
    }, 120000); // 2 minutes

    trainProcess.stdout.on('data', (data) => {
        const output = data.toString();
        outputBuffer += output;
        console.log('Training output:', output);

        // Parse progress from output
        if (output.includes('Step 1')) {
            sendProgress('Reading and tokenizing input file...', 30);
        } else if (output.includes('Step 2')) {
            sendProgress('Generating trigrams...', 50);
        } else if (output.includes('Step 3')) {
            sendProgress('Building tree-based language model...', 70);
        } else if (output.includes('Step 4')) {
            sendProgress('Saving results...', 85);
        } else if (output.includes('Step 5')) {
            sendProgress('Saving trained model...', 95);
        } else if (output.includes('Model saved successfully')) {
            // Training complete, kill the process to prevent interactive mode hang
            clearTimeout(timeout);
            sendProgress('Training complete!', 100);
            setTimeout(() => {
                trainProcess.kill('SIGTERM');
            }, 500);
        }
    });

    trainProcess.stderr.on('data', (data) => {
        errorBuffer += data.toString();
        console.error('Training error:', data.toString());
    });

    trainProcess.on('close', (code) => {
        clearTimeout(timeout);

        // Check if training was successful by looking for the success message
        const wasSuccessful = outputBuffer.includes('Model saved successfully');

        if (wasSuccessful) {
            // Training successful
            sendProgress('Training complete!', 100);

            // Extract stats from output
            const stats = {
                totalTrigrams: 0,
                uniqueTrigrams: 0,
                uniqueWords: 0
            };

            // Parse stats from output buffer
            const trigramMatch = outputBuffer.match(/Total trigrams: (\d+)/);
            const uniqueMatch = outputBuffer.match(/Generated \d+ trigrams \((\d+) unique\)/);
            const wordsMatch = outputBuffer.match(/Unique first words: (\d+)/);

            if (trigramMatch) stats.totalTrigrams = parseInt(trigramMatch[1]);
            if (uniqueMatch) stats.uniqueTrigrams = parseInt(uniqueMatch[1]);
            if (wordsMatch) stats.uniqueWords = parseInt(wordsMatch[1]);

            sendComplete({
                modelPath: 'output/model.bin',
                stats
            });
        } else {
            sendError(`Training failed: ${errorBuffer || 'Unknown error. Check server logs.'}`);
        }
    });

    trainProcess.on('error', (err) => {
        sendError(`Failed to start training: ${err.message}`);
    });
});

// Download model endpoint
app.get('/download', (req, res) => {
    const modelPath = path.join(__dirname, '../trigram_llm/output/model.bin');

    if (!fs.existsSync(modelPath)) {
        return res.status(404).json({ error: 'Model file not found' });
    }

    res.download(modelPath, 'model.bin', (err) => {
        if (err) {
            console.error('Download error:', err);
            res.status(500).json({ error: 'Failed to download model' });
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'training-server' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎓 Training server running on http://localhost:${PORT}`);
    console.log('   POST /train  - Train model from uploaded .txt file');
    console.log('   GET  /download - Download trained model.bin');
    console.log('   GET  /health - Health check');
});

