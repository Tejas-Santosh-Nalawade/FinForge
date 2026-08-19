"""
analytics package.
Provides Stage 3 FP&A performance, ratio analytics, relationship disconnect triggers, and multi-period trend engines.
"""

from analytics.analytics import (
    run_financial_analytics,
    calculate_yoy_variances,
    calculate_common_size_analytics,
    calculate_financial_ratios,
    evaluate_relationship_disconnects,
    calculate_bva_attainment,
    calculate_cash_runway_velocity,
)
from analytics.historical_analytics import (
    run_historical_analytics,
    HistoricalAnalyticsEngine,
    calculate_historical_baseline_analytics,
)
from analytics.analytics_charts import (
    generate_analytics_chart_1_ratios,
    generate_analytics_chart_2_income_statement,
    generate_all_analytics_charts,
)

__all__ = [
    "run_financial_analytics",
    "run_historical_analytics",
    "calculate_yoy_variances",
    "calculate_common_size_analytics",
    "calculate_financial_ratios",
    "evaluate_relationship_disconnects",
    "calculate_bva_attainment",
    "calculate_cash_runway_velocity",
    "HistoricalAnalyticsEngine",
    "calculate_historical_baseline_analytics",
    "generate_analytics_chart_1_ratios",
    "generate_analytics_chart_2_income_statement",
    "generate_all_analytics_charts",
]
