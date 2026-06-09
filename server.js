import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize the official, stable Google Generative AI client
if (!process.env.GEMINI_API_KEY) {
    console.error('ERROR: GEMINI_API_KEY is not set in .env file');
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Set up the memory storage engine for rapid processing without disk overhead
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// Enable CORS and parse incoming payloads
app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Primary parsing route
app.post('/api/scan', upload.single('receipt'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file uploaded.' });
        }

        // Initialize Gemini 1.5 Flash for multimodal visual extraction
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Convert raw memory buffer to the inline format Gemini expects
        const imagePart = {
            inlineData: {
                data: req.file.buffer.toString('base64'),
                mimeType: req.file.mimetype
            }
        };

        const jsonPrompt = `
            Analyze this receipt image meticulously. Extract the lines and map them strictly to this JSON format:
            {
              "vendor": "Name of the merchant or business. If completely illegible, write 'Unknown Merchant'",
              "date": "Transaction date formatted exactly as YYYY-MM-DD. If missing or unreadable, fall back to today's date: ${new Date().toISOString().split('T')[0]}",
              "totalAmount": "The grand total value as a clean float digit. If no total is found, calculate the sum of visible items. If completely missing, default to 0.00"
            }
            
            CRITICAL RULE: Return only the raw JSON structure. Do not embed it inside markdown headers, backticks, or code fences (\`\`\`).
        `;

        const result = await model.generateContent([imagePart, jsonPrompt]);
        const response = await result.response;
        let rawText = response.text().trim();
        
        // Safety Guard: Remove accidental backticks or block formatting if generated
        rawText = rawText.replace(/```json|```/g, '').trim();

        // Convert string to structured object for transit integrity
        const extractedData = JSON.parse(rawText);
        return res.json(extractedData);

    } catch (error) {
        console.error('Extraction Process Error:', error);
        return res.status(500).json({ 
            error: 'Failed to process receipt image.',
            details: error.message 
        });
    }
});

app.listen(port, () => {
    console.log(`🚀 Fast-Receipt engine running at http://localhost:${port}`);
});