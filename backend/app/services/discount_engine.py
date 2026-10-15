from typing import List, Dict, Any

def compute_batch_risk_status(remaining_shelf_life_hours: float) -> str:
    if remaining_shelf_life_hours <= 24.0:
        return 'Critical-Risk'
    elif remaining_shelf_life_hours <= 48.0:
        return 'At-Risk'
    return 'Healthy'

def generate_discount_recommendations(batches, destinations, demands) -> List[Dict[str, Any]]:
    recommendations = []
    # Build average market price per commodity
    price_map = {}
    for dem in demands:
        if dem.commodity not in price_map:
            price_map[dem.commodity] = []
        price_map[dem.commodity].append((dem.market_price_per_kg, dem.destination_id))

    for b in batches:
        r_status = compute_batch_risk_status(b.remaining_shelf_life_hours)
        if r_status in ['At-Risk', 'Critical-Risk']:
            base_prices = price_map.get(b.commodity, [(4.0, None)])
            avg_price = sum(p[0] for p in base_prices) / len(base_prices)
            best_dest_id = base_prices[0][1] if base_prices else None

            if r_status == 'Critical-Risk':
                discount_pct = 30.0 # 30% markdown
                reason = f'Batch {b.batch_code} ({b.commodity}) has only {b.remaining_shelf_life_hours:.1f}h shelf-life remaining (Critical-Risk). A 30% markdown accelerates stock clearance before full expiry, mitigating a /kg write-off.'
            else:
                discount_pct = 15.0 # 15% markdown
                reason = f'Batch {b.batch_code} ({b.commodity}) has {b.remaining_shelf_life_hours:.1f}h shelf-life remaining (At-Risk). A 15% promotional markdown secures early dispatch and prevents entering critical spoilage window.'

            discounted_price = round(avg_price * (1.0 - discount_pct / 100.0), 2)
            salvage_revenue = discounted_price * b.current_quantity_kg
            spoilage_avoided = b.spoilage_cost_per_kg * b.current_quantity_kg
            net_gain_vs_spoilage = salvage_revenue + spoilage_avoided

            tradeoff = {
                'original_price': round(avg_price, 2),
                'discounted_price': discounted_price,
                'quantity_kg': b.current_quantity_kg,
                'salvage_gross_revenue': round(salvage_revenue, 2),
                'avoided_spoilage_penalty': round(spoilage_avoided, 2),
                'net_economic_benefit': round(net_gain_vs_spoilage, 2),
                'shelf_life_hours': b.remaining_shelf_life_hours,
                'risk_status': r_status
            }

            recommendations.append({
                'batch_id': b.id,
                'batch_code': b.batch_code,
                'commodity': b.commodity,
                'remaining_shelf_life_hours': b.remaining_shelf_life_hours,
                'original_price_per_kg': round(avg_price, 2),
                'discount_pct': discount_pct,
                'discounted_price_per_kg': discounted_price,
                'recommended_destination_id': best_dest_id,
                'reason': reason,
                'economic_tradeoff': tradeoff
            })

    return recommendations
