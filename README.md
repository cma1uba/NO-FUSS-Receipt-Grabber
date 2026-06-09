# NO-FUSS-Receipt-Grabber

[https://no-fuss-receipt-grabber.netlify.app/]

A lightweight receipt capture app that uploads receipt images to a backend AI engine for text extraction and stores the parsed vendor, date, and amount in a local ledger.

## Features

- Drag-and-drop or camera upload for receipt images
- Backend OCR-style processing using Google Gemini generative AI
- Automatic extraction into structured JSON: merchant name, date, and total amount
- Local ledger saved in browser storage
- Editable rows and delete support
- Designed for deployment as a static front-end and Node backend

## Project Structure

- `index.html` – front-end UI and upload interface
- `app.js` – client-side logic, image upload, fetch API calls, and ledger rendering
- `server.js` – Express backend route for receiving receipt images and forwarding them to Gemini AI
- `package.json` – Node dependency and start script

## Requirements

- Node.js 18+ / npm
- A valid `GEMINI_API_KEY` for the Google Generative AI client

## Setup

1. Clone the repository
   ```bash
   git clone https://github.com/your-org/NO-FUSS-Receipt-Grabber.git
   cd NO-FUSS-Receipt-Grabber
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env` file in the project root with:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. Start the Node backend
   ```bash
   npm start
   ```

5. Open `index.html` in a browser or serve the static files via a simple HTTP server.

## Usage

- Choose or drag an image file into the receipt drop zone
- The front-end sends the file to `POST /api/scan`
- The backend forwards the image to Gemini AI and parses the returned JSON
- Parsed receipt entries appear in the interactive ledger

## Configuration

- `server.js` uses `multer` memory storage and accepts files up to 10MB
- The upload field name is `receipt`
- The front-end currently calls the API using a hard-coded URL variable:
  ```js
  const API_URL = 'https://no-fuss-receipt-grabber.onrender.com';
  ```
  Update this value when deploying to a different backend URL or local environment.

## Deployment Notes

- The app is designed with a static UI and a separate Node backend.
- Netlify can host the static `index.html` + `app.js`, but the backend must be deployed independently (for example, Render or Vercel).
- Ensure the backend URL in `app.js` matches the deployed backend endpoint.
- Set `GEMINI_API_KEY` in the backend host environment.

## Troubleshooting

- If the backend exits on startup, verify `GEMINI_API_KEY` is set.
- If image uploads return errors, confirm the `receipt` form field is present and the backend route is reachable.
- For AI parsing failures, inspect backend logs for JSON parse errors and model response formatting.

## License

This project is provided as-is.
