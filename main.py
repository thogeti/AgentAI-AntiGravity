from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import requests
import os

app = FastAPI()

# Serve static files
# Ensure the static directory exists
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def read_root():
    return FileResponse("static/index.html")

@app.get("/currencies")
async def get_currencies():
    try:
        # Using a free API for exchange rates
        response = requests.get("https://api.exchangerate-api.com/v4/latest/USD")
        response.raise_for_status()
        data = response.json()
        return {"currencies": list(data["rates"].keys())}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/convert")
async def convert_currency(from_currency: str, to_currency: str, amount: float):
    try:
        # Fetch latest rates based on from_currency
        url = f"https://api.exchangerate-api.com/v4/latest/{from_currency}"
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        
        rates = data["rates"]
        if to_currency not in rates:
            raise HTTPException(status_code=400, detail="Invalid target currency")
            
        rate = rates[to_currency]
        converted_amount = amount * rate
        
        return {
            "from": from_currency,
            "to": to_currency,
            "amount": amount,
            "rate": rate,
            "result": converted_amount
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
