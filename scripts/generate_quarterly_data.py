#!/usr/bin/env python3
"""
Generate quarterly variations of business unit data for Enterprise Audit Dashboard.

This script reads Q3 2024 baseline data and generates realistic quarterly variations
for Q4 2023, Q1 2024, Q2 2024, and Q4 2024.

Usage:
    python generate_quarterly_data.py
"""

import json
import os
import random
import copy
from pathlib import Path
from datetime import datetime

# Configuration
BASE_QUARTER = "q3-2024"
TARGET_QUARTERS = ["q4-2023", "q1-2024", "q2-2024", "q4-2024"]
DATA_DIR = Path(__file__).parent.parent / "data" / "business-units"

# Trend configurations (relative to Q3 2024 baseline = 0)
# Negative quarters are in the past, positive are in the future
QUARTER_TRENDS = {
    "q4-2023": -3,  # 3 quarters before baseline
    "q1-2024": -2,  # 2 quarters before baseline
    "q2-2024": -1,  # 1 quarter before baseline
    "q3-2024": 0,   # baseline
    "q4-2024": 1    # 1 quarter after baseline
}


class QuarterlyDataGenerator:
    """Generate realistic quarterly variations of business unit data."""

    def __init__(self, baseline_data, quarter, business_unit_name):
        self.data = copy.deepcopy(baseline_data)
        self.quarter = quarter
        self.business_unit_name = business_unit_name
        self.trend_offset = QUARTER_TRENDS[quarter]

    def generate(self):
        """Apply all transformations to generate quarterly data."""
        print(f"  Generating {self.quarter} data for {self.business_unit_name}...")

        # Update metadata
        self.update_metadata()

        # Apply variations to different sections
        self.vary_executive_scorecard()
        self.vary_compliance_metrics()
        self.vary_risk_metrics()
        self.vary_operational_metrics()
        self.vary_audit_findings()

        return self.data

    def update_metadata(self):
        """Update quarter and date metadata."""
        self.data["quarter"] = self.quarter.upper()

        # Update date based on quarter
        quarter_dates = {
            "q4-2023": "2023-12-31",
            "q1-2024": "2024-03-31",
            "q2-2024": "2024-06-30",
            "q3-2024": "2024-09-30",
            "q4-2024": "2024-12-31"
        }
        self.data["date"] = quarter_dates[self.quarter]

    def vary_value(self, value, improvement_trend=True, volatility=0.03, min_val=0, max_val=100):
        """
        Apply realistic variation to a numeric value.

        Args:
            value: Base value to vary
            improvement_trend: If True, values improve over time (past=worse, future=better)
            volatility: Random variation range (0.03 = ±3%)
            min_val: Minimum allowed value
            max_val: Maximum allowed value
        """
        if value is None:
            return None

        # Trend component: gradual improvement/degradation over quarters
        trend_direction = 1 if improvement_trend else -1
        trend_factor = self.trend_offset * 0.015 * trend_direction  # 1.5% per quarter

        # Random component: quarter-to-quarter volatility
        random_factor = random.uniform(-volatility, volatility)

        # Apply variations
        varied = value * (1 + trend_factor + random_factor)

        # Clamp to valid range
        return max(min_val, min(max_val, varied))

    def vary_count(self, count, improvement_trend=True, volatility=0.1):
        """Vary integer counts with realistic variations."""
        if count is None or count == 0:
            return count

        varied = self.vary_value(count, improvement_trend, volatility, min_val=0, max_val=999999)
        return int(round(varied))

    def vary_executive_scorecard(self):
        """Vary executive scorecard metrics."""
        scorecard = self.data.get("executiveScorecard", {})

        # Overall score improves over time
        if "overallScore" in scorecard and "value" in scorecard["overallScore"]:
            scorecard["overallScore"]["value"] = self.vary_value(
                scorecard["overallScore"]["value"],
                improvement_trend=True,
                volatility=0.02,
                min_val=60,
                max_val=95
            )

        # Risk metrics (lower is better, so improvement_trend=False means they decrease)
        risk_metrics = scorecard.get("riskMetrics", {})
        for key in ["amlCompliance", "fraudRisk", "operationalRisk", "cyberSecurity"]:
            if key in risk_metrics:
                risk_metrics[key] = self.vary_value(
                    risk_metrics[key],
                    improvement_trend=True,
                    volatility=0.025
                )

        # Alert counts (should decrease over time)
        alerts = scorecard.get("alerts", {})
        for severity in ["critical", "high", "medium", "low"]:
            if severity in alerts:
                alerts[severity] = self.vary_count(
                    alerts[severity],
                    improvement_trend=False,  # Fewer alerts over time
                    volatility=0.15
                )

    def vary_compliance_metrics(self):
        """Vary compliance metrics."""
        compliance = self.data.get("complianceMetrics", {})

        # Training completion improves over time
        training = compliance.get("training", {})
        if "completion" in training and "overall" in training["completion"]:
            training["completion"]["overall"] = self.vary_value(
                training["completion"]["overall"],
                improvement_trend=True,
                volatility=0.02,
                min_val=80,
                max_val=99
            )

        # SAR Filing metrics
        regulatory = compliance.get("regulatory", {})
        sar = regulatory.get("sarFiling", {})
        if "timeliness" in sar:
            sar["timeliness"] = self.vary_value(sar["timeliness"], improvement_trend=True, volatility=0.02)
        if "quality" in sar:
            sar["quality"] = self.vary_value(sar["quality"], improvement_trend=True, volatility=0.02)
        if "volume" in sar:
            sar["volume"] = self.vary_count(sar["volume"], improvement_trend=False, volatility=0.1)

        # Policy metrics
        policy = compliance.get("policy", {})
        if "distribution" in policy and "acknowledgment" in policy["distribution"]:
            policy["distribution"]["acknowledgment"] = self.vary_value(
                policy["distribution"]["acknowledgment"],
                improvement_trend=True,
                volatility=0.025
            )

    def vary_risk_metrics(self):
        """Vary risk metrics."""
        risk = self.data.get("riskMetrics", {})

        # AML Monitoring
        aml = risk.get("amlMonitoring", {})
        if "alertVolume" in aml and "total" in aml["alertVolume"]:
            aml["alertVolume"]["total"] = self.vary_count(
                aml["alertVolume"]["total"],
                improvement_trend=False,  # Fewer alerts is better
                volatility=0.12
            )

        effectiveness = aml.get("effectiveness", {})
        for metric in ["modelAccuracy", "falsePositiveRate", "reviewEfficiency"]:
            if metric in effectiveness:
                # falsePositiveRate should decrease
                trend = False if metric == "falsePositiveRate" else True
                effectiveness[metric] = self.vary_value(
                    effectiveness[metric],
                    improvement_trend=trend,
                    volatility=0.03
                )

        # Fraud metrics
        fraud = risk.get("fraudMetrics", {})
        if "losses" in fraud and "rate" in fraud["losses"]:
            fraud["losses"]["rate"] = self.vary_value(
                fraud["losses"]["rate"],
                improvement_trend=False,  # Lower fraud rate is better
                volatility=0.08,
                min_val=0.0001,
                max_val=0.01
            )

        # Sanctions screening
        sanctions = risk.get("sanctionsScreening", {})
        if "coverage" in sanctions and "transactions" in sanctions["coverage"]:
            sanctions["coverage"]["transactions"] = self.vary_value(
                sanctions["coverage"]["transactions"],
                improvement_trend=True,
                volatility=0.01,
                min_val=95,
                max_val=100
            )

    def vary_operational_metrics(self):
        """Vary operational metrics."""
        ops = self.data.get("operationalMetrics", {})

        # KYC metrics
        kyc = ops.get("kycCdd", {})
        if "completion" in kyc and "new" in kyc["completion"]:
            kyc["completion"]["new"] = self.vary_value(
                kyc["completion"]["new"],
                improvement_trend=True,
                volatility=0.025
            )
        if "periodicReview" in kyc and "onTime" in kyc["periodicReview"]:
            kyc["periodicReview"]["onTime"] = self.vary_value(
                kyc["periodicReview"]["onTime"],
                improvement_trend=True,
                volatility=0.03
            )

        # AML monitoring
        aml_mon = ops.get("amlMonitoring", {})
        if "effectiveness" in aml_mon:
            for metric in ["modelAccuracy", "falsePositiveRate", "reviewEfficiency"]:
                if metric in aml_mon["effectiveness"]:
                    trend = False if metric == "falsePositiveRate" else True
                    aml_mon["effectiveness"][metric] = self.vary_value(
                        aml_mon["effectiveness"][metric],
                        improvement_trend=trend,
                        volatility=0.025
                    )

    def vary_audit_findings(self):
        """Vary audit findings."""
        findings = self.data.get("auditFindings", {})

        # Summary counts (should improve/decrease over time)
        summary = findings.get("summary", {})
        if "total" in summary:
            summary["total"] = self.vary_count(
                summary["total"],
                improvement_trend=False,  # Fewer findings is better
                volatility=0.15
            )

        # By severity
        by_severity = summary.get("bySeverity", {})
        for severity in ["critical", "high", "medium", "low"]:
            if severity in by_severity:
                # Critical and high should decrease more aggressively
                vol = 0.2 if severity in ["critical", "high"] else 0.15
                by_severity[severity] = self.vary_count(
                    by_severity[severity],
                    improvement_trend=False,
                    volatility=vol
                )

        # Recalculate total from severity breakdown
        if by_severity:
            summary["total"] = sum(by_severity.values())

        # Testing results (pass rate should improve)
        testing = findings.get("testing", {})
        results = testing.get("results", {})
        if "pass" in results:
            results["pass"] = self.vary_value(
                results["pass"],
                improvement_trend=True,
                volatility=0.025,
                min_val=75,
                max_val=98
            )

        # Individual findings list
        findings_list = findings.get("findings", [])
        for finding in findings_list:
            # Vary dates slightly
            # Randomly close some findings in future quarters
            if self.trend_offset > 0 and finding.get("status") == "Open":
                if random.random() < 0.3:  # 30% chance to close
                    finding["status"] = "Closed"

            # Reopen some findings in past quarters
            if self.trend_offset < 0 and finding.get("status") == "Closed":
                if random.random() < 0.2:  # 20% chance to reopen
                    finding["status"] = "Open"


def load_baseline_data():
    """Load all Q3 2024 baseline data files."""
    baseline_files = list(DATA_DIR.glob(f"*-{BASE_QUARTER}.json"))

    if not baseline_files:
        raise FileNotFoundError(f"No baseline data files found in {DATA_DIR}")

    print(f"Found {len(baseline_files)} baseline files")
    return baseline_files


def generate_quarterly_data(baseline_file, quarter):
    """Generate quarterly variation of a single business unit."""
    # Load baseline data
    with open(baseline_file, 'r', encoding='utf-8') as f:
        baseline_data = json.load(f)

    business_unit_name = baseline_data.get("name", "Unknown")

    # Generate variation
    generator = QuarterlyDataGenerator(baseline_data, quarter, business_unit_name)
    quarterly_data = generator.generate()

    # Create output filename
    baseline_name = baseline_file.stem  # e.g., "consumer-banking-q3-2024"
    base_name = baseline_name.replace(f"-{BASE_QUARTER}", "")  # e.g., "consumer-banking"
    output_name = f"{base_name}-{quarter}.json"
    output_path = DATA_DIR / output_name

    # Write output file
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(quarterly_data, f, indent=2)

    print(f"  Created: {output_name}")
    return output_path


def main():
    """Main execution function."""
    print("=" * 70)
    print("Enterprise Audit Dashboard - Quarterly Data Generator")
    print("=" * 70)
    print()

    # Ensure output directory exists
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    # Load baseline files
    print("Loading baseline data...")
    baseline_files = load_baseline_data()
    print()

    # Generate quarterly variations
    total_generated = 0
    for quarter in TARGET_QUARTERS:
        print(f"Generating {quarter.upper()} data...")
        for baseline_file in baseline_files:
            generate_quarterly_data(baseline_file, quarter)
            total_generated += 1
        print()

    print("=" * 70)
    print(f"✓ Successfully generated {total_generated} quarterly data files")
    print(f"✓ Data directory: {DATA_DIR}")
    print("=" * 70)


if __name__ == "__main__":
    # Set random seed for reproducibility (optional)
    random.seed(42)
    main()