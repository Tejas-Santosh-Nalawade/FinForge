"""
math_engine package root.
Exports unified public API and high-level orchestrators for deterministic math, ingestion, and reporting.
"""

from math_engine.core import MathEngine

from math_engine.ingestion import (
    load_dataset_from_folder,
    extract_metadata_from_folder,
)

from math_engine.math import (
    run_assertion_rules,
    run_all_guardrails,
    run_complete_audit_suite,
    run_input_guardrails_suite,
)

from analytics import (
    run_financial_analytics,
    run_historical_analytics,
    calculate_yoy_variances,
    calculate_common_size_analytics,
    calculate_financial_ratios,
    evaluate_relationship_disconnects,
    calculate_bva_attainment,
    calculate_cash_runway_velocity,
    HistoricalAnalyticsEngine,
    calculate_historical_baseline_analytics,
)

from forecasting import (
    RollingForecastEngine,
    ForecastingEngine,
    generate_chart_1_revenue_net_income,
    generate_chart_2_cash_runway,
    generate_all_forecasting_charts,
)

from reporters import (
    generate_audit_report_pdf,
    generate_analytics_report_pdf,
    generate_strategic_report_pdf,
    generate_audit_tieouts_pdf,
    generate_fpa_analytics_pdf,
    generate_strategic_pdf_report,
    get_unified_styles,
    get_primary_table_style,
    make_assurance_gate_page_callback,
)

__all__ = [
    "MathEngine",
    # Ingestion
    "load_dataset_from_folder",
    "extract_metadata_from_folder",
    # Math
    "run_assertion_rules",
    "run_all_guardrails",
    "run_complete_audit_suite",
    "run_input_guardrails_suite",
    # Analytics
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
    # Forecasting
    "RollingForecastEngine",
    "ForecastingEngine",
    "generate_chart_1_revenue_net_income",
    "generate_chart_2_cash_runway",
    "generate_all_forecasting_charts",
    # Reporters
    "generate_audit_report_pdf",
    "generate_analytics_report_pdf",
    "generate_strategic_report_pdf",
    "generate_audit_tieouts_pdf",
    "generate_fpa_analytics_pdf",
    "generate_strategic_pdf_report",
    "get_unified_styles",
    "get_primary_table_style",
    "make_assurance_gate_page_callback",
]
