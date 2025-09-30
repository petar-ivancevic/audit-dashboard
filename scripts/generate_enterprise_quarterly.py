#!/usr/bin/env python3
"""
Generate quarterly variations of enterprise dashboard data.

This script reads the Q3 2024 baseline enterprise dashboard and generates
realistic quarterly variations for Q4 2023, Q1 2024, Q2 2024, and Q4 2024.

Usage:
    python generate_enterprise_quarterly.py
"""

import json
import random
from pathlib import Path

# Configuration
BASE_QUARTER = "q3-2024"
TARGET_QUARTERS = ["q4-2023", "q1-2024", "q2-2024", "q4-2024"]
DATA_DIR = Path(__file__).parent.parent / "data"

# Trend configurations (relative to Q3 2024 baseline = 0)
QUARTER_TRENDS = {
    "q4-2023": -3,  # 3 quarters before baseline
    "q1-2024": -2,  # 2 quarters before baseline
    "q2-2024": -1,  # 1 quarter before baseline
    "q3-2024": 0,   # baseline
    "q4-2024": 1    # 1 quarter after baseline
}


def vary_value(value, trend_offset, improvement_trend=True, volatility=0.03, min_val=0, max_val=100):
    """
    Apply realistic variation to a numeric value.

    Args:
        value: Base value to vary
        trend_offset: Number of quarters from baseline (negative = past, positive = future)
        improvement_trend: If True, values improve over time
        volatility: Random variation range
        min_val: Minimum allowed value
        max_val: Maximum allowed value
    """
    if value is None:
        return None

    # Trend component
    trend_direction = 1 if improvement_trend else -1
    trend_factor = trend_offset * 0.015 * trend_direction  # 1.5% per quarter

    # Random component
    random_factor = random.uniform(-volatility, volatility)

    # Apply variations
    varied = value * (1 + trend_factor + random_factor)

    # Clamp to valid range
    return max(min_val, min(max_val, varied))


def vary_count(count, trend_offset, improvement_trend=True, volatility=0.1):
    """Vary integer counts with realistic variations."""
    if count is None or count == 0:
        return count

    varied = vary_value(count, trend_offset, improvement_trend, volatility, min_val=0, max_val=999999)
    return int(round(varied))


def generate_quarterly_enterprise_data(baseline_data, quarter):
    """Generate quarterly variation of enterprise dashboard data."""
    print(f"Generating {quarter.upper()} enterprise data...")

    data = json.loads(json.dumps(baseline_data))  # Deep copy
    trend_offset = QUARTER_TRENDS[quarter]

    # Update metadata
    data["reportingPeriod"] = quarter.upper()
    quarter_dates = {
        "q4-2023": "2023-12-31",
        "q1-2024": "2024-03-31",
        "q2-2024": "2024-06-30",
        "q3-2024": "2024-09-30",
        "q4-2024": "2024-12-31"
    }
    data["generatedDate"] = quarter_dates[quarter]

    # Vary executive scorecard metrics
    if "executiveScorecard" in data:
        scorecard = data["executiveScorecard"]

        # Enterprise risk score improves over time
        if "enterpriseRiskScore" in scorecard:
            scorecard["enterpriseRiskScore"] = vary_value(
                scorecard["enterpriseRiskScore"],
                trend_offset,
                improvement_trend=True,
                volatility=0.02,
                min_val=60,
                max_val=95
            )

        # Compliance rate improves
        if "complianceRate" in scorecard:
            scorecard["complianceRate"] = vary_value(
                scorecard["complianceRate"],
                trend_offset,
                improvement_trend=True,
                volatility=0.015,
                min_val=80,
                max_val=99
            )

        # Active findings decrease
        if "activeFindings" in scorecard:
            scorecard["activeFindings"] = vary_count(
                scorecard["activeFindings"],
                trend_offset,
                improvement_trend=False,
                volatility=0.15
            )

    return data


def main():
    """Main execution function."""
    print("=" * 70)
    print("Enterprise Dashboard - Quarterly Data Generator")
    print("=" * 70)
    print()

    # Load baseline enterprise data
    baseline_path = DATA_DIR / f"enterprise-dashboard-{BASE_QUARTER}.json"

    if not baseline_path.exists():
        print(f"Error: Baseline file not found: {baseline_path}")
        return

    with open(baseline_path, 'r', encoding='utf-8') as f:
        baseline_data = json.load(f)

    print(f"Loaded baseline: {baseline_path.name}")
    print()

    # Generate quarterly variations
    for quarter in TARGET_QUARTERS:
        quarterly_data = generate_quarterly_enterprise_data(baseline_data, quarter)

        output_path = DATA_DIR / f"enterprise-dashboard-{quarter}.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(quarterly_data, f, indent=2)

        print(f"  Created: {output_path.name}")

    print()
    print("=" * 70)
    print(f"Successfully generated {len(TARGET_QUARTERS)} enterprise dashboard files")
    print("=" * 70)


if __name__ == "__main__":
    # Set random seed for reproducibility
    random.seed(42)
    main()