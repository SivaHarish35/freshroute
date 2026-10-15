from fastapi import APIRouter, Query
from app.services.cold_chain import simulate_cold_chain_profile

router = APIRouter(prefix="/api/cold-chain", tags=["Cold-Chain Telemetry"])

@router.get("")
def get_cold_chain_telemetry(
    commodity: str = Query("Organic Strawberries"),
    batch_code: str = Query("BATCH-STR-101"),
    scenario_type: str = Query("normal") # normal, excursion, freeze
):
    return simulate_cold_chain_profile(commodity=commodity, batch_code=batch_code, scenario_type=scenario_type)
