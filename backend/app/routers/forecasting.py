from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.services.forecasting import generate_demand_forecast

router = APIRouter(prefix="/api/forecasting", tags=["Demand Forecasting"])

@router.get("")
def get_forecast(
    commodity: str = Query("Organic Strawberries"),
    destination: str = Query("Bay Area Produce Terminal"),
    horizon_days: int = Query(5)
):
    return generate_demand_forecast(commodity=commodity, destination=destination, horizon_days=horizon_days)
