"""
reporters package root.
Provides ReportLab PDF report generators and corporate design system styling for deliverables.
"""

from reporters.styles import (
    get_unified_styles,
    get_primary_table_style,
    make_assurance_gate_page_callback,
)
from reporters.pdf_audit_reporter import generate_audit_tieouts_pdf, generate_audit_report_pdf
from reporters.pdf_analytics_reporter import generate_fpa_analytics_pdf, generate_analytics_report_pdf
from reporters.pdf_strategic_reporter import generate_strategic_pdf_report, generate_strategic_report_pdf
from reporters.excel_reporter import generate_excel_workpaper

__all__ = [
    "get_unified_styles",
    "get_primary_table_style",
    "make_assurance_gate_page_callback",
    "generate_audit_tieouts_pdf",
    "generate_audit_report_pdf",
    "generate_fpa_analytics_pdf",
    "generate_analytics_report_pdf",
    "generate_strategic_pdf_report",
    "generate_strategic_report_pdf",
    "generate_excel_workpaper",
]
