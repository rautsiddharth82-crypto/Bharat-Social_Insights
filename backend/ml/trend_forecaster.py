from typing import List, Dict, Any
import numpy as np

def calculate_velocity_and_forecast(hourly_counts: List[int]) -> Dict[str, float]:
    """
    Computes:
    - velocity: (count_current_hour - count_prev_hour) / max(count_prev_hour, 1)
    - forecast_next_hour: Holt's exponential smoothing or weighted linear regression over hourly buckets.
    """
    if not hourly_counts:
        return {"velocity": 0.0, "forecast_next_hour": 0.0}

    if len(hourly_counts) < 2:
        return {"velocity": 0.0, "forecast_next_hour": float(hourly_counts[0])}

    curr_hour = hourly_counts[-1]
    prev_hour = hourly_counts[-2]

    # Velocity: fractional change compared to last hour
    velocity = round((curr_hour - prev_hour) / max(prev_hour, 1), 2)

    # Exponential smoothing forecast (alpha = 0.6)
    alpha = 0.6
    forecast = float(hourly_counts[0])
    for count in hourly_counts[1:]:
        forecast = alpha * count + (1 - alpha) * forecast

    # Add trend adjustment from linear fit over last 4-6 points if available
    if len(hourly_counts) >= 4:
        x = np.arange(len(hourly_counts))
        y = np.array(hourly_counts)
        slope, _ = np.polyfit(x, y, 1)
        forecast += slope * 0.5  # slight trend adjustment

    forecast_next_hour = round(max(forecast, 0.0), 1)

    return {
        "velocity": velocity,
        "forecast_next_hour": forecast_next_hour
    }
