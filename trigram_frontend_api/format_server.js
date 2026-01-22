import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

/**
 * Format Python code using Black (primary) or autopep8 (fallback)
 */
async function formatWithBlack(code) {
    const tempFile = join(tmpdir(), `format_${randomUUID()}.py`);
    
    try {
        // Write code to temp file
        await writeFile(tempFile, code);
        
        // Try Black first
        return new Promise((resolve, reject) => {
            exec(`black --quiet "${tempFile}"`, async (error, stdout, stderr) => {
                if (error) {
                    // Black failed, try autopep8
                    exec(`autopep8 --in-place "${tempFile}"`, async (err2, stdout2, stderr2) => {
                        if (err2) {
                            // Both failed - return original code
                            await unlink(tempFile).catch(() => {});
                            resolve({ formatted: code, error: 'Could not format code' });
                        } else {
                            // autopep8 succeeded
                            const { readFile } = await import('fs/promises');
                            const formatted = await readFile(tempFile, 'utf-8');
                            await unlink(tempFile).catch(() => {});
                            resolve({ formatted, formatter: 'autopep8' });
                        }
                    });
                } else {
                    // Black succeeded
                    const { readFile } = await import('fs/promises');
                    const formatted = await readFile(tempFile, 'utf-8');
                    await unlink(tempFile).catch(() => {});
                    resolve({ formatted, formatter: 'black' });
                }
            });
        });
    } catch (err) {
        await unlink(tempFile).catch(() => {});
        return { formatted: code, error: err.message };
    }
}

/**
 * POST /format
 * Request body: { code: string }
 * Response: { formatted: string, formatter?: string, error?: string }
 */
app.post('/format', async (req, res) => {
    const { code } = req.body;
    
    if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'Code is required' });
    }
    
    try {
        const result = await formatWithBlack(code);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'format-server' });
});

app.listen(PORT, () => {
    console.log(`🔧 Format server running on http://localhost:${PORT}`);
    console.log('   POST /format - Format Python code');
    console.log('   GET /health  - Health check');
});
