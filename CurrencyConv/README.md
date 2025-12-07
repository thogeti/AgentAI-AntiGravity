# AgentAI-AntiGravity
Currency Conversion App Implementation Plan
Goal Description
Create a simple currency conversion application using FastAPI for the backend and HTML/CSS/JS for the frontend. The app will allow users to convert amounts between different currencies using real-time (or mocked) exchange rates.

User Review Required
Exchange Rate Source: I plan to use a public, free API (e.g., https://api.exchangerate-api.com/v4/latest/USD) which does not require an API key for simplicity. If this is not acceptable, please specify an alternative.
Proposed Changes
Backend
[MODIFY] 
main.py
Initialize FastAPI app.
Create an endpoint /convert that accepts from_currency, to_currency, and amount.
Create an endpoint /currencies to list available currencies.
Serve static files (frontend).
Frontend
[NEW] 
index.html
Simple UI with input for amount, dropdowns for currencies, and a convert button.
Result display area.
[NEW] 
style.css
Basic styling for a clean look.
[NEW] 
script.js
Fetch available currencies on load.
Handle convert button click to call backend API.
UI Updates
[NEW] 
indian_currency_bg.png
Generate an image of Indian currency notes for the background.
[MODIFY] 
style.css
Add background image to body.
Add an overlay to ensure text readability.
Adjust colors if necessary to match the new theme.
Verification Plan
Automated Tests
I will run the FastAPI server locally.
I will use curl or the browser to test the /convert endpoint.
Manual Verification
Open the web page in the browser.
Perform a conversion (e.g., USD to EUR) and verify the result is displayed.
