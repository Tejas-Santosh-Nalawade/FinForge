"""
forecasting/forecasting_charts.py
High-Resolution Executive Financial Chart Generation Engine for 4Q & 8Q Strategic PDF Report.
Generates 2 spacious, multi-axis, executive-grade analytical visuals:
1. Chart 1: 8-Quarter Revenue & Profit Trajectory (Dual-Axis Revenue/Gross Profit Bars & Operating/Net Margin Lines)
2. Chart 2: Cash Flow Dynamics, CapEx Investment & Liquidity Runway (OCF vs CapEx Bars, Cash Reserve Fill & Runway Month Callouts)
"""

from pathlib import Path
from typing import List, Dict, Any
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np


def set_chart_style():
    plt.rcParams.update({
        "font.family": "sans-serif",
        "font.sans-serif": ["Segoe UI", "Helvetica", "DejaVu Sans", "Arial"],
        "axes.edgecolor": "#CBD5E1",
        "axes.linewidth": 1.0,
        "axes.labelsize": 9.5,
        "axes.titlesize": 11.5,
        "xtick.labelsize": 8.5,
        "ytick.labelsize": 8.5,
        "grid.color": "#F1F5F9",
        "grid.linestyle": "--",
        "grid.linewidth": 0.7,
        "legend.fontsize": 9.0,
        "figure.facecolor": "#FFFFFF",
        "axes.facecolor": "#FAFAFA",
    })


def generate_chart_1_revenue_net_income(projections: List[Dict[str, Any]], output_path: Path, currency: str = "USD") -> Path:
    """
    Chart 1: 8-Quarter Revenue, Net Income & Margin Trajectory.
    Dual-Axis: Revenue & Gross Profit Bars (Left Axis) vs Operating & Net Margin % Lines (Right Axis).
    """
    set_chart_style()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    periods = [p["period"] for p in projections]
    revenues = [p["revenue"] for p in projections]
    gross_profits = [p["gross_profit"] for p in projections]

    op_margins = [(p["operating_income"] / p["revenue"] * 100.0) if p["revenue"] > 0 else 0.0 for p in projections]
    net_margins = [(p["net_income"] / p["revenue"] * 100.0) if p["revenue"] > 0 else 0.0 for p in projections]

    x = np.arange(len(periods))
    width = 0.34

    fig, ax1 = plt.subplots(figsize=(8.5, 4.0), dpi=300)

    # Primary Bars: Revenue & Gross Profit
    rects1 = ax1.bar(x - width/2, revenues, width, label=f"Revenue ({currency}M)", color="#1E3A8A", alpha=0.90)
    rects2 = ax1.bar(x + width/2, gross_profits, width, label=f"Gross Profit ({currency}M)", color="#0284C7", alpha=0.85)

    ax1.set_ylabel(f"Financial Value ({currency} Millions)", color="#0F172A", fontweight="bold", labelpad=8)
    ax1.set_xticks(x)
    ax1.set_xticklabels(periods, rotation=0, ha="center", fontweight="semibold")
    ax1.grid(True, axis="y", linestyle="--", alpha=0.6)

    # Primary Axis Y-Lim padding to prevent text overlap
    max_rev = max(revenues) if revenues else 100.0
    ax1.set_ylim(0, max_rev * 1.18)

    # Value Annotations on Top of Revenue Bars
    for rect in rects1:
        height = rect.get_height()
        ax1.annotate(
            f"{height:.1f}",
            xy=(rect.get_x() + rect.get_width() / 2, height),
            xytext=(0, 3),
            textcoords="offset points",
            ha="center",
            va="bottom",
            fontsize=7.5,
            fontweight="bold",
            color="#1E3A8A"
        )

    # Secondary Axis: Margins %
    ax2 = ax1.twinx()
    ax2.plot(x, op_margins, color="#059669", marker="o", linewidth=2.2, label="Operating Margin (%)")
    ax2.plot(x, net_margins, color="#7C3AED", marker="s", linestyle="--", linewidth=2.0, label="Net Margin (%)")

    ax2.set_ylabel("Margin (%)", color="#0F172A", fontweight="bold", labelpad=8)
    ax2.tick_params(axis="y", labelcolor="#0F172A")
    min_m = min(min(net_margins), 0) - 5
    max_m = max(max(op_margins), 20) + 12
    ax2.set_ylim(min_m, max_m)

    # Endpoint Margin Callout Badges
    if op_margins:
        ax2.annotate(f"{op_margins[-1]:.1f}%", xy=(x[-1], op_margins[-1]), xytext=(6, 0), textcoords="offset points", fontweight="bold", color="#059669", fontsize=8.5)
    if net_margins:
        ax2.annotate(f"{net_margins[-1]:.1f}%", xy=(x[-1], net_margins[-1]), xytext=(6, 0), textcoords="offset points", fontweight="bold", color="#7C3AED", fontsize=8.5)

    # Unified Legend at Top Left
    lines1, labels1 = ax1.get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    ax1.legend(lines1 + lines2, labels1 + labels2, loc="upper left", frameon=True, facecolor="#F8FAFC", edgecolor="#CBD5E1", ncol=2)

    # Title with Dynamic Growth Summary
    rev_growth = ((revenues[-1] - revenues[0]) / revenues[0] * 100.0) if revenues[0] > 0 else 0.0
    plt.title(f"8-Quarter Revenue & Margin Expansion Trajectory (Projected Growth: +{rev_growth:.1f}%)", fontweight="bold", pad=12, color="#0F172A")

    fig.tight_layout()
    plt.savefig(output_path, format="png", bbox_inches="tight", dpi=300)
    plt.close(fig)
    return output_path


def generate_chart_2_cash_runway(projections: List[Dict[str, Any]], output_path: Path, currency: str = "USD") -> Path:
    """
    Chart 2: Cash Flow Dynamics, CapEx Burn & Liquidity Runway.
    Displays OCF vs CapEx Burn bars (Left Axis), Ending Cash Reserve Fill (Right Axis), and dynamic Runway Month annotations.
    """
    set_chart_style()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    periods = [p["period"] for p in projections]
    ocf = [p["operating_cash_flow"] for p in projections]
    capex = [p["capex"] for p in projections]
    ending_cash = [p["ending_cash"] for p in projections]
    min_buffers = [p["min_cash_buffer"] for p in projections]

    runway_months = [round((p["ending_cash"] / (p["opex"] / 3.0)), 1) if p["opex"] > 0 else 0.0 for p in projections]

    x = np.arange(len(periods))
    width = 0.32

    fig, ax1 = plt.subplots(figsize=(8.5, 4.0), dpi=300)

    # Primary Bars: OCF & CapEx
    ax1.bar(x - width/2, ocf, width, label=f"Operating Cash Flow ({currency}M)", color="#059669", alpha=0.85)
    ax1.bar(x + width/2, capex, width, label=f"CapEx Investment ({currency}M)", color="#F59E0B", alpha=0.85)

    ax1.set_ylabel(f"Cash Flow ({currency} Millions)", color="#0F172A", fontweight="bold", labelpad=8)
    ax1.set_xticks(x)
    ax1.set_xticklabels(periods, rotation=0, ha="center", fontweight="semibold")
    ax1.grid(True, axis="y", linestyle="--", alpha=0.6)

    max_cf = max(max(ocf), max(capex)) if ocf and capex else 50.0
    ax1.set_ylim(0, max_cf * 1.25)

    # Secondary Line: Ending Cash Reserves & Minimum Buffer Floor
    ax2 = ax1.twinx()
    ax2.plot(x, ending_cash, color="#1E3A8A", marker="D", linewidth=2.2, label=f"Ending Cash Reserve ({currency}M)")
    ax2.fill_between(x, ending_cash, color="#1E3A8A", alpha=0.08)
    ax2.plot(x, min_buffers, color="#DC2626", linestyle="--", linewidth=1.6, label="1-Month OpEx Buffer Floor")

    ax2.set_ylabel(f"Cash Reserves ({currency}M)", color="#1E3A8A", fontweight="bold", labelpad=8)
    ax2.tick_params(axis="y", labelcolor="#1E3A8A")

    max_c = max(ending_cash) if ending_cash else 100.0
    ax2.set_ylim(0, max_c * 1.25)

    # Annotate Runway Months on Cash Points
    for xi, cash_val, r_months in zip(x, ending_cash, runway_months):
        ax2.annotate(
            f"{r_months}mo",
            xy=(xi, cash_val),
            xytext=(0, 8),
            textcoords="offset points",
            ha="center",
            fontsize=7.5,
            fontweight="bold",
            color="#1E3A8A",
            bbox=dict(boxstyle="round,pad=0.25", facecolor="#EFF6FF", edgecolor="#BFDBFE", alpha=0.85)
        )

    # Unified Legend at Top Left
    lines1, labels1 = ax1.get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    ax1.legend(lines1 + lines2, labels1 + labels2, loc="upper left", frameon=True, facecolor="#F8FAFC", edgecolor="#CBD5E1", ncol=2)

    total_fcf = sum(p["free_cash_flow"] for p in projections)
    plt.title(f"Liquidity Cushion & Cash Flow Generation (8Q Cum. FCF: {currency} {total_fcf:+.1f}M)", fontweight="bold", pad=12, color="#0F172A")

    fig.tight_layout()
    plt.savefig(output_path, format="png", bbox_inches="tight", dpi=300)
    plt.close(fig)
    return output_path


def generate_all_forecasting_charts(projections: List[Dict[str, Any]], chart_dir: Path, currency: str = "USD") -> Dict[str, Path]:
    """Generates the 2 spacious executive financial charts and returns dictionary of file paths."""
    chart_dir.mkdir(parents=True, exist_ok=True)
    path1 = generate_chart_1_revenue_net_income(projections, chart_dir / "chart1_revenue_net_income.png", currency=currency)
    path2 = generate_chart_2_cash_runway(projections, chart_dir / "chart2_cash_runway.png", currency=currency)

    return {
        "chart_1": path1,
        "chart_2": path2,
    }
