from typing import Dict, Any, List

def simulate_cold_chain_profile(commodity: str, batch_code: str, scenario_type: str = "normal") -> Dict[str, Any]:
    """
    Generates a realistic temperature monitoring time series for perishable produce.
    Explicitly labeled: SIMULATED COLD-CHAIN TELEMETRY.
    Applies Arrhenius/Q10 biological respiration decay rule when temperature excursions occur.
    """
    specs = {
        "Organic Strawberries": {"target": 2.5, "min": 1.0, "max": 4.5, "tolerance": "1°C - 4.5°C"},
        "Baby Spinach": {"target": 3.0, "min": 1.0, "max": 4.0, "tolerance": "1°C - 4°C"},
        "Vine Tomatoes": {"target": 12.0, "min": 10.0, "max": 15.0, "tolerance": "10°C - 15°C"},
        "Haas Avocados": {"target": 7.0, "min": 5.0, "max": 9.0, "tolerance": "5°C - 9°C"},
        "Sweet Peaches": {"target": 4.0, "min": 2.0, "max": 6.0, "tolerance": "2°C - 6°C"},
        "Artisan Soft Cheeses": {"target": 3.5, "min": 2.0, "max": 5.0, "tolerance": "2°C - 5°C"}
    }
    spec = specs.get(commodity, {"target": 4.0, "min": 2.0, "max": 6.0, "tolerance": "2°C - 6°C"})

    readings: List[Dict[str, Any]] = []
    has_alert = False
    max_excursion = 0.0

    # 12 telemetry hourly intervals
    for hour in range(12, 0, -1):
        time_label = f"-{hour}h ago"
        base_temp = spec["target"]

        if scenario_type == "excursion" and 3 <= hour <= 7:
            # Simulated refrigeration reefer compressor malfunction
            temp = round(base_temp + 5.2 + (hour % 2) * 0.4, 1)
        elif scenario_type == "freeze" and 4 <= hour <= 6:
            # Cold-spot freeze event
            temp = round(spec["min"] - 2.1, 1)
        else:
            # Normal small fluctuation around setpoint
            fluctuation = (0.3 if hour % 2 == 0 else -0.2)
            temp = round(base_temp + fluctuation, 1)

        is_alert = temp > spec["max"] or temp < spec["min"]
        alert_msg = None
        if temp > spec["max"]:
            has_alert = True
            diff = temp - spec["max"]
            max_excursion = max(max_excursion, diff)
            alert_msg = f"High Temp Alert: {temp}°C exceeds {spec['max']}°C threshold (+{diff:.1f}°C excursion)."
        elif temp < spec["min"]:
            has_alert = True
            diff = spec["min"] - temp
            alert_msg = f"Low Temp Alert: {temp}°C below {spec['min']}°C chill threshold."

        readings.append({
            "timestamp": time_label,
            "temperature_c": temp,
            "is_alert": is_alert,
            "alert_message": alert_msg
        })

    # Respiration Q10 decay calculation
    # Respiration roughly doubles every 5°C increase (Q10 = 2.0)
    if max_excursion > 0:
        spoilage_multiplier = round(1.0 + (max_excursion / 5.0) * 1.0, 2)
        status = "CRITICAL ALERT: EXCURSION DETECTED"
        explanation = (
            f"Simulated reefer fluctuation exceeded critical {spec['max']}°C threshold by up to {max_excursion:.1f}°C. "
            f"Modeled respiration rate increased by {spoilage_multiplier}x, accelerating remaining shelf-life consumption. "
            f"Immediate dispatch priority recommendation triggered."
        )
    else:
        spoilage_multiplier = 1.0
        status = "OPTIMAL: WITHIN TOLERANCE"
        explanation = f"All simulated cold-chain readings remained within optimal {spec['tolerance']} window. Normal shelf-life decay applies."

    return {
        "batch_code": batch_code,
        "commodity": commodity,
        "target_temp_c": spec["target"],
        "tolerance_range": spec["tolerance"],
        "status": status,
        "spoilage_rate_multiplier": spoilage_multiplier,
        "readings": readings,
        "explanation": explanation
    }
