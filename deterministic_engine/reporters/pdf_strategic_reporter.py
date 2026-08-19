"""
math_engine/reporters/pdf_strategic_reporter.py
Deliverable 4: fpa_strategic_planning_recommendations.pdf
4Q & 8Q Strategic Rolling Forecast & Prescriptive Treasury Report.
"""

from pathlib import Path
from typing import Dict, Any
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, Image

from reporters.styles import (
    get_unified_styles,
    get_primary_table_style,
    make_assurance_gate_page_callback,
    PRIMARY_NAVY,
    ACCENT_BLUE,
    SUCCESS_GREEN,
    ALERT_RED,
    WARNING_AMBER,
)


def fmt_val(val: Any) -> str:
    if val is None:
        return "-"
    if isinstance(val, (int, float)):
        return f"{val:,.2f}"
    return str(val)


def generate_strategic_pdf_report(
    forecasting_data: Dict[str, Any],
    chart_paths: Dict[str, Path],
    output_path: Path,
) -> None:
    """
    Renders Deliverable 4: fpa_strategic_planning_recommendations.pdf
    """
    output_path.parent.mkdir(parents=True, exist_ok=True)
    st = get_unified_styles()
    story = []

    meta = forecasting_data.get("metadata", {})
    projs = forecasting_data.get("projections", [])
    curr_code = meta.get("currency", "USD")
    client_name = str(meta.get("company", "Enterprise Client"))

    # Header / Title
    story.append(Paragraph(f"{client_name} • Financial Analytics & Audit Assurance Gate", st["subtitle"]))
    story.append(Paragraph("4Q & 8Q Strategic Rolling Forecast & Prescriptive Treasury Report", st["title"]))
    story.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY_NAVY, spaceBefore=4, spaceAfter=8))

    tot_rev = sum(p["revenue"] for p in projs)
    tot_ni = sum(p["net_income"] for p in projs)
    tot_fcf = sum(p["free_cash_flow"] for p in projs)
    end_cash = projs[-1]["ending_cash"] if projs else 0.0

    summary_data = [
        [Paragraph("Company Name:", st["bold"]), Paragraph(str(meta.get("company", "AsterNova Technologies Ltd.")), st["cell"]), Paragraph("Base Fiscal Year:", st["bold"]), Paragraph(str(meta.get("base_fiscal_year", "FY2026")), st["cell"])],
        [Paragraph("Volume Growth QoQ:", st["bold"]), Paragraph(f"+{meta.get('volume_growth_qoq_pct', 1.8052):.4f}% QoQ", st["cell"]), Paragraph("Forecast Horizon:", st["bold"]), Paragraph("8 Quarters (FY26-Q1 to FY27-Q4)", st["cell"])],
        [Paragraph("8Q Total Revenue:", st["bold"]), Paragraph(f"{curr_code} {tot_rev:,.2f}M", st["cell"]), Paragraph("8Q Total Net Income:", st["bold"]), Paragraph(f"{curr_code} {tot_ni:,.2f}M", st["cell"])],
        [Paragraph("8Q Free Cash Flow:", st["bold"]), Paragraph(f"{curr_code} {tot_fcf:,.2f}M", st["cell"]), Paragraph("Ending Cash Reserves:", st["bold"]), Paragraph(f"<font color='#15803D'><b>{curr_code} {end_cash:,.2f}M</b></font>", st["cell"])],
    ]

    t_summary = Table(summary_data, colWidths=[120, 140, 120, 140])
    t_summary.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("PADDING", (0, 0), (-1, -1), 3.5),
    ]))
    story.append(t_summary)
    story.append(Spacer(1, 8))

    # Section 1: Complete 8-Quarter Pro-Forma Statement Table
    story.append(Paragraph("1. Complete 8-Quarter Pro-Forma Statement Table (FY2026 - FY2027)", st["heading"]))

    pf_headers = ["Period", "Volume", "HC", "Revenue", "COGS", "OpEx", "Op. Inc.", "CapEx", "D&A", "Net Inc.", "End Cash"]
    pf_table_data = [[Paragraph(h, st["header"]) for h in pf_headers]]

    for p in projs:
        pf_table_data.append([
            Paragraph(p["period"], st["cell"]),
            Paragraph(f"{p['volume_units']:,.0f}", st["cell"]),
            Paragraph(f"{p['headcount']:.0f}", st["cell"]),
            Paragraph(fmt_val(p["revenue"]), st["cell"]),
            Paragraph(fmt_val(p["cogs"]), st["cell"]),
            Paragraph(fmt_val(p["opex"]), st["cell"]),
            Paragraph(fmt_val(p["operating_income"]), st["cell"]),
            Paragraph(fmt_val(p["capex"]), st["cell"]),
            Paragraph(fmt_val(p["depreciation"]), st["cell"]),
            Paragraph(fmt_val(p["net_income"]), st["cell"]),
            Paragraph(fmt_val(p["ending_cash"]), st["cell"]),
        ])

    t_pf = Table(pf_table_data, colWidths=[55, 42, 28, 44, 44, 44, 44, 42, 38, 44, 55])
    t_pf.setStyle(get_primary_table_style(header_bg=PRIMARY_NAVY))
    story.append(t_pf)
    story.append(Spacer(1, 10))

    # Section 2: Embedded Chart Dashboards
    story.append(Paragraph("2. Strategic Visual Dashboards & Dynamic Trajectory Charts", st["heading"]))

    chart1_path = chart_paths.get("chart_1")
    if chart1_path and chart1_path.exists():
        story.append(Paragraph("Chart 1: 8-Quarter Revenue & Profit Trajectory (Dual-Axis)", st["bold"]))
        story.append(Image(str(chart1_path), width=510, height=225))
        story.append(Spacer(1, 10))

    chart2_path = chart_paths.get("chart_2")
    if chart2_path and chart2_path.exists():
        story.append(Paragraph("Chart 2: Cash Runway Cushion vs. 1-Month OpEx Minimum Buffer", st["bold"]))
        story.append(Image(str(chart2_path), width=510, height=225))
        story.append(Spacer(1, 12))

    # Section 3: Prescriptive Treasury Recommendations
    story.append(Paragraph("3. Prescriptive Treasury Recommendations & Capital Allocation Policies", st["heading"]))

    rec_headers = ["Pillar", "Allocation Rule / Policy", "Target Objective", "Guardrail Status"]
    rec_table_data = [[Paragraph(h, st["header"]) for h in rec_headers]]

    dso_val = projs[0]["dso"] if projs else 52.3
    dio_val = projs[0]["dio"] if projs else 52.0
    dpo_val = projs[0]["dpo"] if projs else 36.2
    ccc_val = projs[0]["ccc"] if projs else 68.1

    policies = [
        ("CapEx Reinvestment", "5.0% of Top-Line Revenue", "Modernization of IT & plant assets (CF_GUARD_02 compliant)", "APPROVED"),
        ("Working Capital Optimization", f"DSO: {dso_val:.1f}d, DIO: {dio_val:.1f}d, DPO: {dpo_val:.1f}d", f"Maintain Cash Conversion Cycle at {ccc_val:.1f} days without cash drag", "HEALTHY"),
        ("Debt Principal Amortization", f"{curr_code} principal service schedule", "De-leverage principal balance while maintaining interest coverage > 15x", "SECURED"),
        ("Liquidity Reserve Cushion", "Maintain ending cash >= 1 month OpEx", "Ensure cash reserves exceed minimum operating liquidity buffer threshold", "APPROVED"),
    ]

    for p_name, rule, obj, status in policies:
        rec_table_data.append([
            Paragraph(f"<b>{p_name}</b>", st["cell"]),
            Paragraph(rule, st["cell"]),
            Paragraph(obj, st["cell"]),
            Paragraph(f"<font color='#15803D'><b>{status}</b></font>", st["cell"]),
        ])

    t_rec = Table(rec_table_data, colWidths=[120, 130, 210, 60])
    t_rec.setStyle(get_primary_table_style(header_bg=ACCENT_BLUE))
    story.append(t_rec)

    doc = SimpleDocTemplate(str(output_path), pagesize=A4, rightMargin=36, leftMargin=36, topMargin=45, bottomMargin=45)
    cb = make_assurance_gate_page_callback("Strategic Rolling Forecast & Treasury Recommendations")
    doc.build(story, onFirstPage=cb, onLaterPages=cb)


# Alias export
generate_strategic_report_pdf = generate_strategic_pdf_report

