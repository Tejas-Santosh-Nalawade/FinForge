"""
Main entry point for Financial Audit, Analytics, Historical Baseline & 4Q/8Q Rolling Forecast Engine.
Pipeline Flow:
Input Excel Dataset -> JSON Ingestion -> MathEngine -> Deliverables:
1. Deliverable A: audit_tieouts_report.json & audit_tieouts_report.pdf (Deterministic Math & Tie-Outs)
2. Deliverable B: fpa_analytics_report.json & fpa_analytics_report.pdf (Stage 3 Financial Analytics & Historical Baseline)
3. Deliverables 4Q/8Q: forecast_4q.json, forecast_8q.json, strategic_planning_recommendations.json, fpa_strategic_planning_recommendations.pdf
4. Audit Trail Log: result/audit_run_history.json
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from schema import FinancialStatementsIngestionSchema
from math_engine import MathEngine
from math_engine.ingestion import load_dataset_from_folder
from reporters import (
    generate_audit_tieouts_pdf,
    generate_fpa_analytics_pdf,
    generate_strategic_pdf_report,
    generate_excel_workpaper,
)
from forecasting import ForecastingEngine, generate_all_forecasting_charts


def find_sub_datasets(data_path: Path) -> list:
    """
    Inspects data_path to determine if it contains nested sub-datasets (e.g., True_data and/or Error_data)
    or if it is a single standalone dataset directory.
    Returns a list of tuples: (dataset_dir_path, relative_sub_dir_name_or_None)
    """
    if not data_path.exists():
        raise FileNotFoundError(f"Dataset directory '{data_path}' does not exist.")

    sub_dirs = []
    for child in data_path.iterdir():
        if child.is_dir():
            if (child / "current_data").exists() or (child / "balance_sheet.xlsx").exists() or (child / "aob.xlsx").exists():
                sub_dirs.append(child)

    if sub_dirs:
        sub_dirs.sort(key=lambda p: (0 if "true" in p.name.lower() else (1 if "error" in p.name.lower() else 2), p.name.lower()))
        return [(child, child.name.lower()) for child in sub_dirs]

    return [(data_path, None)]


def run_audit_on_dataset(
    data_path: Path,
    result_dir: Path,
    target_dir_override: Path = None,
    remediated: bool = False
) -> dict:
    """
    Ingest Excel dataset, execute MathEngine (Stage 1 -> Stage 2 -> Stage 3),
    and route ALL deliverables strictly into target_dir.
    Updates result/audit_run_history.json log.
    """
    if not data_path.exists():
        raise FileNotFoundError(f"Dataset directory '{data_path}' does not exist.")

    dataset_name = data_path.name.lower()
    target_dir = target_dir_override if target_dir_override else (result_dir / dataset_name)
    target_dir.mkdir(parents=True, exist_ok=True)

    print(f"\n[INFO] Ingesting Excel dataset from '{data_path}' -> Output Target: '{target_dir}'...")
    
    # 1. Load Excel statement files into schema model
    report_schema = load_dataset_from_folder(data_path)

    # 2. Convert loaded Excel data to JSON dict & validate schema
    ingestion_json_dict = report_schema.model_dump()
    validated_schema = FinancialStatementsIngestionSchema(**ingestion_json_dict)

    # 3. Run MathEngine (Stage 1 Gate -> Stage 2 Check -> Stage 3 Analytics + Historical Engine)
    engine = MathEngine(validated_schema)
    structured_report = engine.generate_structured_audit_report()

    # Deliverable PDF Paths & Workpaper Paths
    audit_pdf_path = target_dir / "audit_tieouts_report.pdf"
    fpa_pdf_path = target_dir / "fpa_analytics_report.pdf"
    excel_workpaper_path = target_dir / "audit_workpaper_wp514.xlsx"
    target_strat_pdf = target_dir / "fpa_strategic_planning_recommendations.pdf"

    # 4. Construct In-Memory Audit & Analytics Payloads
    det_procs = [
        p for p in structured_report.get("procedures", [])
        if any(str(p.get("reference", "")).startswith(prefix) for prefix in ("MATH_", "TIEOUT_", "PY_"))
        or (str(p.get("reference", "")).startswith("NOTE_") and not str(p.get("reference", "")).startswith("NOTE_GUARD_"))
    ]
    det_passed = sum(1 for p in det_procs if p.get("status") == "PASS")

    audit_payload = {
        "engagement": structured_report.get("engagement"),
        "procedures": det_procs,
        "findings": structured_report.get("findings"),
        "conclusion": {
            "overall_status": structured_report.get("conclusion", {}).get("overall_status", "CLEARED"),
            "total_procedures_run": len(det_procs),
            "procedures_passed": det_passed,
            "text": f"Deterministic Mechanical Audit Rules (28 Rules): {det_passed} / {len(det_procs)} passed."
        },
    }

    fpa_payload = {
        "engagement": structured_report.get("engagement"),
        "analytics": structured_report.get("analytics"),
        "findings": structured_report.get("findings"),
        "conclusion": structured_report.get("conclusion"),
    }

    # 5. Generate Deliverable A PDF (Deterministic Math & Tie-Outs)
    generate_audit_tieouts_pdf(structured_report, audit_pdf_path)
    print(f"[SUCCESS] Deliverable A PDF saved to '{audit_pdf_path}'")

    # 6. Generate Deliverable B PDF (Financial Analytics & FP&A Intelligence)
    generate_fpa_analytics_pdf(structured_report, fpa_pdf_path)
    print(f"[SUCCESS] Deliverable B PDF saved to '{fpa_pdf_path}'")

    # 7. Dynamically generate WP-514 Supporting Excel Workpaper in memory
    generate_excel_workpaper(audit_payload, fpa_payload, excel_workpaper_path)
    print(f"[SUCCESS] Dynamic WP-514 Supporting Excel Workpaper saved to '{excel_workpaper_path}'")

    # 8. Execute 4Q & 8Q Rolling Forecast Engine & Generate Strategic PDF
    print(f"[INFO] Executing 4Q & 8Q Rolling Forecast Engine for '{data_path}'...")
    forecaster = ForecastingEngine(report=report_schema)
    full_forecasting_data = forecaster.run_projections(total_quarters=8)
    chart_dir = target_dir / "charts"
    curr_code = getattr(report_schema.metadata, "currency", "USD")
    chart_paths = generate_all_forecasting_charts(full_forecasting_data["projections"], chart_dir, currency=curr_code)

    generate_strategic_pdf_report(full_forecasting_data, chart_paths, target_strat_pdf)
    print(f"[SUCCESS] Saved Strategic Planning PDF Deliverable to '{target_strat_pdf}'")

    # Clean up legacy/unneeded JSON files or old WP-514 PDF files if present in target_dir
    for legacy_file in [
        "audit_tieouts_report.json",
        "fpa_analytics_report.json",
        "forecast_4q.json",
        "forecast_8q.json",
        "strategic_planning_recommendations.json",
        "WP-514_Audit_Report_2026-03-31.pdf",
    ]:
        legacy_path = target_dir / legacy_file
        if legacy_path.exists():
            legacy_path.unlink()

    # Clean up wp514_output subdirectory if present
    wp514_dir = target_dir / "wp514_output"
    if wp514_dir.exists():
        import shutil
        shutil.rmtree(wp514_dir, ignore_errors=True)

    return structured_report


def main():
    parser = argparse.ArgumentParser(description="FinForge Enterprise Audit, Analytics & Forecasting Engine CLI")
    parser.add_argument(
        "--dataset",
        choices=["error", "error_data", "true", "true_data", "both"],
        default="both",
        help="Select dataset to audit: 'error' / 'error_data', 'true' / 'true_data', or 'both' (default: both)",
    )
    parser.add_argument(
        "--data-dir",
        type=str,
        default=None,
        help="Custom directory path to Excel dataset (e.g. --data-dir path/to/custom_excel_data)",
    )
    parser.add_argument(
        "--result-dir",
        type=str,
        default="result",
        help="Directory path to store output results (default: result)",
    )
    parser.add_argument(
        "--export-all",
        action="store_true",
        help="Export all 6 deliverables across target dataset directories",
    )
    parser.add_argument(
        "--remediate",
        action="store_true",
        help="Flag run as a remediated audit trial run in audit_run_history.json",
    )
    args = parser.parse_args()

    result_dir = Path(args.result_dir)

    # 1. Custom --data-dir execution
    if args.data_dir:
        custom_path = Path(args.data_dir)
        sub_datasets = find_sub_datasets(custom_path)
        
        for dataset_dir, sub_name in sub_datasets:
            if sub_name:
                target_dir = result_dir / custom_path.name / sub_name
            else:
                target_dir = result_dir / dataset_dir.name.lower()

            run_audit_on_dataset(
                data_path=dataset_dir,
                result_dir=result_dir,
                target_dir_override=target_dir,
                remediated=args.remediate,
            )
        return

    # 2. Pre-configured dataset selection
    error_path = Path("Data/Error_data")
    true_path = Path("Data/True_data")

    dataset_choice = args.dataset.lower()
    if dataset_choice in ["error", "error_data", "both"]:
        if error_path.exists():
            run_audit_on_dataset(data_path=error_path, result_dir=result_dir, remediated=args.remediate)
        elif dataset_choice in ["error", "error_data"]:
            print(f"[ERROR] '{error_path}' directory not found.")
            sys.exit(1)

    if dataset_choice in ["true", "true_data", "both"]:
        if true_path.exists():
            run_audit_on_dataset(data_path=true_path, result_dir=result_dir, remediated=args.remediate)
        elif dataset_choice in ["true", "true_data"]:
            print(f"[ERROR] '{true_path}' directory not found.")
            sys.exit(1)


if __name__ == "__main__":
    main()
