from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.models.models import *
from app.services.demo_data import seed_demo_database

from app.routers import (
    auth,
    inventory,
    destinations,
    optimization,
    dispatch,
    scenarios,
    forecasting,
    cold_chain,
    reports,
    demo
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Seed demo dataset if database is empty
        seed_demo_database(db, overwrite=False)
    finally:
        db.close()
    yield

app = FastAPI(
    title="FreshRoute API",
    description="Intelligent Decision Support for Perishable Produce Distribution — Google Antigravity Hackathon PS 07",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(inventory.router)
app.include_router(destinations.router)
app.include_router(optimization.router)
app.include_router(dispatch.router)
app.include_router(scenarios.router)
app.include_router(forecasting.router)
app.include_router(cold_chain.router)
app.include_router(reports.router)
app.include_router(demo.router)

@app.get("/")
def root():
    return {
        "app": "FreshRoute API",
        "tagline": "Smarter Routes. Fresher Produce. Less Waste.",
        "version": "1.0.0",
        "status": "online",
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health():
    return {"status": "healthy", "service": "freshroute-backend"}
