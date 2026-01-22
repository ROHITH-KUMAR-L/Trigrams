import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { writeFile, unlink, readFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 5001;

// Initialize GROQ client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

app.use(cors());
app.use(express.json());

/**
 * Use GROQ LLM to fix Python syntax (punctuation, indentation)
 */
async function formatWithGroq(code) {
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are a Python code formatter. Your ONLY job is to add missing punctuation and fix indentation.

Rules:
1. Add parentheses for function calls: "range 10" → "range(10)", "print hello" → "print(hello)"
2. Add colons after for/if/while/def/class statements
3. Fix indentation (4 spaces per level)
4. Add missing quotes around string literals
5. DO NOT change the logic or add new code
6. DO NOT add comments or explanations
7. Return ONLY the formatted Python code, nothing else
8. Do not add any extra characters lines
9. just format the current line, do not any extra python keywords`
                },
                {
                    role: "user",
                    content: `Format this Python code (add punctuation and fix indentation only):\n\n${code}`
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.1,
            max_tokens: 2048,
        });

        const formatted = completion.choices[0]?.message?.content || code;
        
        // Clean up any markdown code blocks from the response
        let cleanFormatted = formatted
            .replace(/^```python\n?/gm, '')
            .replace(/^```\n?/gm, '')
            .trim();

        return { formatted: cleanFormatted, formatter: 'groq' };
    } catch (error) {
        console.error('GROQ error:', error.message);
        // Fall back to Black/autopep8
        return null;
    }
}

/**
 * Format with Black/autopep8 (fallback for valid Python)
 */
async function formatWithBlack(code) {
    const tempFile = join(tmpdir(), `format_${randomUUID()}.py`);
    const homedir = process.env.HOME || '/home/raghottam';
    const blackPath = `${homedir}/.local/bin/black`;
    const autopep8Path = `${homedir}/.local/bin/autopep8`;
    
    try {
        await writeFile(tempFile, code);
        
        return new Promise((resolve) => {
            exec(`${blackPath} --quiet "${tempFile}"`, async (error) => {
                if (error) {
                    exec(`${autopep8Path} --in-place "${tempFile}"`, async (err2) => {
                        if (err2) {
                            await unlink(tempFile).catch(() => {});
                            resolve(null);
                        } else {
                            const formatted = await readFile(tempFile, 'utf-8');
                            await unlink(tempFile).catch(() => {});
                            resolve({ formatted, formatter: 'autopep8' });
                        }
                    });
                } else {
                    const formatted = await readFile(tempFile, 'utf-8');
                    await unlink(tempFile).catch(() => {});
                    resolve({ formatted, formatter: 'black' });
                }
            });
        });
    } catch (err) {
        await unlink(tempFile).catch(() => {});
        return null;
    }
}

/**
 * POST /format
 * Uses GROQ to fix syntax, then Black/autopep8 to polish
 */
app.post('/format', async (req, res) => {
    const { code } = req.body;
    
    if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'Code is required' });
    }
    
    try {
        // Step 1: Use GROQ to fix punctuation/syntax
        let result = await formatWithGroq(code);
        
        if (result) {
            // Step 2: Try to polish with Black
            const polished = await formatWithBlack(result.formatted);
            if (polished) {
                result = { formatted: polished.formatted, formatter: `groq + ${polished.formatter}` };
            }
        } else {
            // GROQ failed, try Black directly
            result = await formatWithBlack(code);
        }
        
        if (result) {
            res.json(result);
        } else {
            res.json({ formatted: code, error: 'Could not format code' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /health
 */
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'format-server',
        groq: !!process.env.GROQ_API_KEY 
    });
});

app.listen(PORT, () => {
    console.log(`🔧 Format server running on http://localhost:${PORT}`);
    console.log(`   GROQ API: ${process.env.GROQ_API_KEY ? '✓ Configured' : '✗ Missing'}`);
    console.log('   POST /format - Format Python code');
    console.log('   GET /health  - Health check');
});
