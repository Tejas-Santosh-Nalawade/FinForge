from pathlib import Path
import random
import pandas as pd

COMPANY = "AsterNova Technologies Ltd."
CURRENCY = "INR"
SCALE = "MILLIONS"
UNIT = "₹ million"

HISTORICAL_REVENUE = 1354.66
HISTORICAL_COGS = 532.49
HISTORICAL_SGA = 379.27
HISTORICAL_RD = 127.30
HISTORICAL_DA = 28.45


def round2(val: float) -> float:
    return round(float(val), 2)


def generate_aob(company: str = COMPANY) -> pd.DataFrame:
    """Generate Annual Operating Budget dataframe adhering to schema/aob_schema.json."""
    growth = 0.08
    rev = HISTORICAL_REVENUE * (1.0 + growth)
    cogs = rev * (HISTORICAL_COGS / HISTORICAL_REVENUE)
    sga = rev * (HISTORICAL_SGA / HISTORICAL_REVENUE)
    rd = rev * (HISTORICAL_RD / HISTORICAL_REVENUE)
    da = rev * (HISTORICAL_DA / HISTORICAL_REVENUE)
    opex = sga + rd + da
    capex = rev * 0.08
    net_inc = rev - cogs - opex

    rows = [
        [company, "FY2026", "Revenue", "REVENUE", "Revenue", round2(rev), UNIT],
        [company, "FY2026", "Cost of Goods Sold", "COGS", "Direct Cost", round2(cogs), UNIT],
        [company, "FY2026", "Selling, General & Administrative", "SGA", "Operating Expense", round2(sga), UNIT],
        [company, "FY2026", "Research & Development", "RND", "Operating Expense", round2(rd), UNIT],
        [company, "FY2026", "Depreciation & Amortization", "DA", "Operating Expense", round2(da), UNIT],
        [company, "FY2026", "Total Operating Expenses", "OPEX", "Operating Expense", round2(opex), UNIT],
        [company, "FY2026", "Capital Expenditure", "CAPEX", "Capital Expenditure", round2(capex), UNIT],
        [company, "FY2026", "Net Income", "NET_INCOME", "Tax", round2(net_inc), UNIT],
        [company, "FY2026", "Headcount", "HEADCOUNT", "Operating Driver", 520, "employees"],
        [company, "FY2026", "Operating Volume", "OPERATING_VOLUME", "Operating Driver", 108000, "units"],
    ]
    cols = ["Company", "Period", "Metric", "Canonical Code", "Category", "Amount", "Unit"]
    return pd.DataFrame(rows, columns=cols)


def generate_operational_drivers(company: str = COMPANY) -> pd.DataFrame:
    """Generate Operational Drivers dataframe adhering to templates/operational_drivers_schema.json."""
    rows = [
        [company, "FY2026", "HEADCOUNT", "Headcount", 520, "employees", "ANNUAL", "OPEX"],
        [company, "FY2026", "VOLUME", "Operating Volume", 108000, "units", "ANNUAL", "REVENUE"],
        [company, "FY2027", "HEADCOUNT", "Headcount", 550, "employees", "ANNUAL", "OPEX"],
        [company, "FY2027", "VOLUME", "Operating Volume", 116000, "units", "ANNUAL", "REVENUE"],
    ]
    cols = [
        "Company",
        "Period",
        "Driver Type",
        "Driver Name",
        "Value",
        "Unit",
        "Granularity",
        "Associated Financial Metric",
    ]
    return pd.DataFrame(rows, columns=cols)


def derive_company_name(target_dir: str | Path, company: str = None) -> str:
    if company and company != COMPANY:
        return company
    
    p = Path(target_dir)
    folder_name = p.name
    if folder_name.lower() in ("true_data", "error_data", "current_data", "prior_data") and p.parent.name not in ("Data", "fin", ".", ""):
        folder_name = p.parent.name
    
    if folder_name and folder_name.lower() not in ("data", "true_data", "error_data", "fin", ".", ""):
        return folder_name.replace("_", " ").strip()
    return company or COMPANY


def generate_planning_excel(target_dir: str | Path = "Data/True_data", seed: int = 42, company: str = None):
    """
    Generates separate aob.xlsx and operational_drivers.xlsx files under target_dir.
    """
    random.seed(seed)
    output_dir = Path(target_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    company_name = derive_company_name(output_dir, company)

    aob_df = generate_aob(company=company_name)
    drivers_df = generate_operational_drivers(company=company_name)

    aob_path = output_dir / "aob.xlsx"
    drivers_path = output_dir / "operational_drivers.xlsx"

    with pd.ExcelWriter(aob_path, engine="openpyxl") as writer:
        aob_df.to_excel(writer, sheet_name="AOB", index=False)

    with pd.ExcelWriter(drivers_path, engine="openpyxl") as writer:
        drivers_df.to_excel(writer, sheet_name="Operational_Drivers", index=False)

    print(f"[SUCCESS] Generated: {aob_path}")
    print(f"[SUCCESS] Generated: {drivers_path}")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Planning Files Generator")
    parser.add_argument("--output-dir", type=str, default="Data/True_data", help="Output directory path")
    parser.add_argument("--company", type=str, default=None, help="Company Name")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    args = parser.parse_args()
    generate_planning_excel(target_dir=args.output_dir, seed=args.seed, company=args.company)


