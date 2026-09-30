from typing import List, Dict, Any
import numpy as np

def predict_batch_forecast(series_list: List[List[int]]) -> List[Dict[str, float]]:
    results = []
    for counts in series_list:
        if not counts:
            results.append({"velocity": 0.0, "forecast_next_hour": 0.0})
            continue

        if len(counts) < 2:
            results.append({"velocity": 0.0, "forecast_next_hour": float(counts[0])})
            continue

        curr = counts[-1]
        prev = counts[-2]
        vel = round((curr - prev) / max(prev, 1), 2)

        alpha = 0.6
        fc = float(counts[0])
        for c in counts[1:]:
            fc = alpha * c + (1 - alpha) * fc

        if len(counts) >= 4:
            x = np.arange(len(counts))
            y = np.array(counts)
            slope, _ = np.polyfit(x, y, 1)
            fc += slope * 0.5

        results.append({
            "velocity": vel,
            "forecast_next_hour": round(max(fc, 0.0), 1)
        })

    return results
