from fastapi import FastAPI

app = FastAPI(

title="ActivityLog",
description="Local network activity logging system",
version="0.1.0"
)

@app.get("/health")

def health_check ():
    return{"status": "OK"}
