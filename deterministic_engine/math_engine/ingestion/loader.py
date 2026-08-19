"""
Excel Dataset Loader for MathEngine.
Parses financial statement Excel files from data folders (e.g., Data/Error_data, Data/True_data, Data/Google_Global)
and constructs validated FinancialStatementsIngestionSchema models with dynamic metadata.
"""

import re
import json
from pathlib import Path
from typing import Any, Dict, Union, Tuple, Optional
import openpyxl

from schema import (
    FinancialStatementsIngestionSchema,
    Metadata,
    PriorData,
    CurrentData,
    BalanceSheetValues,
    IncomeStatementValues,
    CashFlowValues,
    StockholdersEquity,
    Footnotes,
    AccountsReceivableAging,
    PPESchedule,
    DebtMaturities,
)


BALANCE_SHEET_ALIASES = {
    "cash_and_cash_equivalents": [
        "cash & cash equivalents", "cash and cash equivalents", "cash & equivalents", "cash and equivalents", "cash"
    ],
    "accounts_receivable_net": [
        "accounts receivable, net", "accounts receivable net", "accounts receivable", "trade receivables", "net accounts receivable", "ar net"
    ],
    "inventory": [
        "inventory", "inventories", "total inventory", "ending inventory"
    ],
    "prepaid_expenses": [
        "prepaid expenses & other current assets", "prepaid expenses and other current assets", "prepaid expenses", "other current assets"
    ],
    "total_current_assets": [
        "total current assets", "current assets total"
    ],
    "ppe_net": [
        "property, plant & equipment, net", "property plant & equipment net", "property, plant and equipment, net", "property plant and equipment net", "ppe, net", "net ppe", "property, plant & equipment"
    ],
    "intangible_assets": [
        "intangible assets", "intangibles", "intangibles net", "goodwill and intangibles"
    ],
    "total_assets": [
        "total assets", "assets total"
    ],
    "accounts_payable": [
        "accounts payable", "trade payables", "ap"
    ],
    "accrued_expenses": [
        "accrued liabilities", "accrued expenses", "accrued expenses & liabilities", "other current liabilities"
    ],
    "short_term_debt": [
        "short-term debt", "short term debt", "bank overdraft", "short term borrowings"
    ],
    "current_portion_of_lt_debt": [
        "current portion of long-term debt", "current portion of long term debt", "current portion of lt debt"
    ],
    "total_current_liabilities": [
        "total current liabilities", "current liabilities total"
    ],
    "long_term_debt": [
        "long-term debt", "long term debt", "non-current debt", "long term borrowings"
    ],
    "total_liabilities": [
        "total liabilities", "liabilities total"
    ],
    "common_stock": [
        "common stock", "share capital", "ordinary shares"
    ],
    "additional_paid_in_capital": [
        "additional paid-in capital", "additional paid in capital", "apic", "share premium"
    ],
    "retained_earnings": [
        "retained earnings", "retained profit", "accumulated deficit"
    ],
    "total_equity": [
        "total equity", "total stockholders' equity", "total stockholders equity", "total shareholders' equity", "stockholders' equity"
    ],
}

INCOME_STATEMENT_ALIASES = {
    "revenue": [
        "revenue", "total revenue", "sales", "gross revenue", "turnover", "operating revenue", "net revenue"
    ],
    "cogs": [
        "cost of goods sold", "cost of sales", "cogs", "direct costs", "cost of revenue", "cost of revenues", "direct cost"
    ],
    "gross_profit": [
        "gross profit", "gross margin", "gross income"
    ],
    "sga_expense": [
        "selling, general & administrative", "selling general & administrative", "selling, general and administrative", "sg&a", "sga", "operating expense - sga"
    ],
    "rd_expense": [
        "research & development", "research and development", "r&d", "rnd"
    ],
    "depreciation_amortization": [
        "depreciation & amortization", "depreciation and amortization", "d&a", "depreciation expense"
    ],
    "total_operating_expenses": [
        "total operating expenses", "total opex", "opex", "operating expenses"
    ],
    "operating_income": [
        "operating income", "operating profit", "ebit"
    ],
    "interest_expense": [
        "interest expense", "finance costs", "interest cost"
    ],
    "non_operating_income": [
        "non-operating income / (expense)", "non-operating income", "non operating income", "other income / (expense)", "other income"
    ],
    "income_tax_expense": [
        "income tax expense", "tax expense", "provision for income taxes", "income tax"
    ],
    "net_income": [
        "net income", "net profit", "profit after tax", "net earnings"
    ],
}

CASH_FLOW_ALIASES = {
    "net_income_starting": ["net income", "net income starting", "starting net income"],
    "depreciation_addback": ["depreciation & amortization add-back", "depreciation and amortization add-back", "depreciation addback", "d&a addback"],
    "working_capital_changes": ["working capital changes", "change in working capital", "delta working capital"],
    "operating_cash_flow": ["operating cash flow", "cash flow from operations", "cash provided by operating activities"],
    "capital_expenditures": ["capital expenditures", "capex", "additions to ppe"],
    "investing_cash_flow": ["investing cash flow", "cash flow from investing activities"],
    "debt_repayments_or_borrowings": ["debt borrowings / (repayments)", "debt repayments", "debt borrowings", "net debt financing"],
    "dividends_paid": ["dividends paid", "dividends"],
    "financing_cash_flow": ["financing cash flow", "cash flow from financing activities"],
    "net_cash_change": ["net cash change", "net change in cash", "change in cash"],
    "beginning_cash": ["beginning cash", "beginning cash & cash equivalents", "cash at start of period"],
    "ending_cash": ["ending cash", "ending cash & cash equivalents", "cash at end of period"],
}


from spell_checker import spell_checker


def _norm_str(s: Any) -> str:
    if s is None:
        return ""
    return re.sub(r"\s+", " ", str(s)).strip().lower()


def _get_mapped_value(data: Dict[str, float], aliases: Dict[str, list], field: str, default: float = 0.0) -> float:
    if field in data and isinstance(data[field], (int, float)):
        return float(data[field])

    norm_data = {_norm_str(k): float(v) for k, v in data.items() if isinstance(v, (int, float))}
    for alias in aliases.get(field, []):
        norm_alias = _norm_str(alias)
        if norm_alias in norm_data:
            return norm_data[norm_alias]

    # Fuzzy spell-checker fallback for misspelled Excel line-items/attributes
    for raw_k, val in data.items():
        if isinstance(val, (int, float)):
            res = spell_checker.check_and_correct(raw_k)
            if res.get("corrected_canonical") == field:
                return float(val)

    return default


def parse_excel_key_values(filepath: Path) -> Dict[str, float]:
    """Extract key-value pairs from standard two-column financial statement Excel sheets."""
    if not filepath.exists():
        return {}

    wb = openpyxl.load_workbook(filepath, data_only=True)
    sheet = wb.active
    data = {}
    for row in sheet.iter_rows(values_only=True):
        if not row or len(row) < 2:
            continue
        key, val = row[0], row[1]
        if key is not None and val is not None and isinstance(val, (int, float)):
            data[str(key).strip()] = float(val)
    return data


def parse_trial_balance(filepath: Path) -> Dict[str, Any]:
    """Parse trial balance excel into dictionary structure."""
    if not filepath.exists():
        return {}

    wb = openpyxl.load_workbook(filepath, data_only=True)
    sheet = wb.active
    rows = []
    header_found = False
    for row in sheet.iter_rows(values_only=True):
        if not row or not any(row):
            continue
        first_col = str(row[0]).strip() if row[0] is not None else ""
        if first_col == "Account Code":
            header_found = True
            continue
        if header_found and len(row) >= 7:
            rows.append({
                "account_code": str(row[0]),
                "account_name": str(row[1]),
                "fsli": str(row[2]),
                "account_type": str(row[3]),
                "debit": float(row[4]) if row[4] is not None else 0.0,
                "credit": float(row[5]) if row[5] is not None else 0.0,
                "ending_balance": float(row[6]) if row[6] is not None else 0.0,
            })
    return {"accounts": rows}


def map_balance_sheet(data: Dict[str, float]) -> BalanceSheetValues:
    c = _get_mapped_value(data, BALANCE_SHEET_ALIASES, "cash_and_cash_equivalents")
    ar = _get_mapped_value(data, BALANCE_SHEET_ALIASES, "accounts_receivable_net")
    inv = _get_mapped_value(data, BALANCE_SHEET_ALIASES, "inventory")
    prep = _get_mapped_value(data, BALANCE_SHEET_ALIASES, "prepaid_expenses")
    calc_ca = c + ar + inv + prep
    tot_ca = _get_mapped_value(data, BALANCE_SHEET_ALIASES, "total_current_assets", default=calc_ca)

    ppe = _get_mapped_value(data, BALANCE_SHEET_ALIASES, "ppe_net")
    intang = _get_mapped_value(data, BALANCE_SHEET_ALIASES, "intangible_assets")
    tot_nca = ppe + intang
    calc_ta = tot_ca + tot_nca
    tot_assets = _get_mapped_value(data, BALANCE_SHEET_ALIASES, "total_assets", default=calc_ta)

    ap = _get_mapped_value(data, BALANCE_SHEET_ALIASES, "accounts_payable")
    acc = _get_mapped_value(data, BALANCE_SHEET_ALIASES, "accrued_expenses")
    st_debt = _get_mapped_value(data, BALANCE_SHEET_ALIASES, "short_term_debt")
    cp_lt = _get_mapped_value(data, BALANCE_SHEET_ALIASES, "current_portion_of_lt_debt")
    calc_cl = ap + acc + st_debt + cp_lt
    tot_cl = _get_mapped_value(data, BALANCE_SHEET_ALIASES, "total_current_liabilities", default=calc_cl)

    lt_debt = _get_mapped_value(data, BALANCE_SHEET_ALIASES, "long_term_debt")
    calc_tl = tot_cl + lt_debt
    tot_liab = _get_mapped_value(data, BALANCE_SHEET_ALIASES, "total_liabilities", default=calc_tl)

    cs = _get_mapped_value(data, BALANCE_SHEET_ALIASES, "common_stock")
    apic = _get_mapped_value(data, BALANCE_SHEET_ALIASES, "additional_paid_in_capital")
    re = _get_mapped_value(data, BALANCE_SHEET_ALIASES, "retained_earnings")
    calc_eq = cs + apic + re
    tot_eq = _get_mapped_value(data, BALANCE_SHEET_ALIASES, "total_equity", default=calc_eq)

    return BalanceSheetValues(
        cash_and_cash_equivalents=c,
        accounts_receivable_net=ar,
        inventory=inv,
        prepaid_expenses=prep,
        total_current_assets=tot_ca,
        ppe_net=ppe,
        intangible_assets=intang,
        total_non_current_assets=tot_nca,
        total_assets=tot_assets,
        accounts_payable=ap,
        accrued_expenses=acc,
        short_term_debt=st_debt,
        current_portion_of_lt_debt=cp_lt,
        total_current_liabilities=tot_cl,
        long_term_debt=lt_debt,
        total_non_current_liabilities=lt_debt,
        total_liabilities=tot_liab,
        common_stock=cs,
        additional_paid_in_capital=apic,
        retained_earnings=re,
        total_equity=tot_eq,
    )


def map_income_statement(data: Dict[str, float]) -> IncomeStatementValues:
    rev = _get_mapped_value(data, INCOME_STATEMENT_ALIASES, "revenue")
    cogs = _get_mapped_value(data, INCOME_STATEMENT_ALIASES, "cogs")
    gp = _get_mapped_value(data, INCOME_STATEMENT_ALIASES, "gross_profit", default=rev - cogs)
    sga = _get_mapped_value(data, INCOME_STATEMENT_ALIASES, "sga_expense")
    rd = _get_mapped_value(data, INCOME_STATEMENT_ALIASES, "rd_expense")
    da = _get_mapped_value(data, INCOME_STATEMENT_ALIASES, "depreciation_amortization")
    tot_opex = _get_mapped_value(data, INCOME_STATEMENT_ALIASES, "total_operating_expenses", default=sga + rd + da)
    op_inc = _get_mapped_value(data, INCOME_STATEMENT_ALIASES, "operating_income", default=gp - tot_opex)
    interest = _get_mapped_value(data, INCOME_STATEMENT_ALIASES, "interest_expense")
    non_op = _get_mapped_value(data, INCOME_STATEMENT_ALIASES, "non_operating_income")
    tax = _get_mapped_value(data, INCOME_STATEMENT_ALIASES, "income_tax_expense")
    net_inc = _get_mapped_value(data, INCOME_STATEMENT_ALIASES, "net_income", default=op_inc + non_op - interest - tax)

    return IncomeStatementValues(
        revenue=rev,
        cogs=cogs,
        gross_profit=gp,
        sga_expense=sga,
        rd_expense=rd,
        depreciation_amortization=da,
        total_operating_expenses=tot_opex,
        operating_income=op_inc,
        interest_expense=interest,
        non_operating_income=non_op,
        income_tax_expense=tax,
        net_income=net_inc,
    )


def map_cash_flow_statement(data: Dict[str, float]) -> CashFlowValues:
    ni = _get_mapped_value(data, CASH_FLOW_ALIASES, "net_income_starting")
    da = _get_mapped_value(data, CASH_FLOW_ALIASES, "depreciation_addback")
    wc = _get_mapped_value(data, CASH_FLOW_ALIASES, "working_capital_changes")
    ocf = _get_mapped_value(data, CASH_FLOW_ALIASES, "operating_cash_flow", default=ni + da - wc)
    capex = _get_mapped_value(data, CASH_FLOW_ALIASES, "capital_expenditures")
    icf = _get_mapped_value(data, CASH_FLOW_ALIASES, "investing_cash_flow", default=capex)
    debt_flow = _get_mapped_value(data, CASH_FLOW_ALIASES, "debt_repayments_or_borrowings")
    divs = _get_mapped_value(data, CASH_FLOW_ALIASES, "dividends_paid")
    fcf = _get_mapped_value(data, CASH_FLOW_ALIASES, "financing_cash_flow", default=debt_flow - divs)
    net_change = _get_mapped_value(data, CASH_FLOW_ALIASES, "net_cash_change", default=ocf + icf + fcf)
    beg_cash = _get_mapped_value(data, CASH_FLOW_ALIASES, "beginning_cash")
    end_cash = _get_mapped_value(data, CASH_FLOW_ALIASES, "ending_cash", default=beg_cash + net_change)

    return CashFlowValues(
        net_income_starting=ni,
        depreciation_addback=da,
        working_capital_changes=wc,
        operating_cash_flow=ocf,
        capital_expenditures=capex,
        investing_cash_flow=icf,
        debt_repayments_or_borrowings=debt_flow,
        dividends_paid=divs,
        financing_cash_flow=fcf,
        net_cash_change=net_change,
        beginning_cash=beg_cash,
        ending_cash=end_cash,
    )


def map_equity_statement(data: Dict[str, float]) -> StockholdersEquity:
    divs = data.get("Dividends Declared", 0.0)
    return StockholdersEquity(
        beginning_retained_earnings=data.get("Beginning Retained Earnings", 0.0),
        net_income=data.get("Net Income", 0.0),
        dividends_declared=abs(divs),
        ending_retained_earnings=data.get("Ending Retained Earnings", 0.0),
    )


def map_footnotes(curr_dir: Path) -> Footnotes:
    footnotes_dir = curr_dir / "footnotes"
    ar_data = parse_excel_key_values(footnotes_dir / "ar_aging.xlsx")
    ppe_data = parse_excel_key_values(footnotes_dir / "ppe_sched.xlsx")
    debt_data = parse_excel_key_values(footnotes_dir / "debt_maturity.xlsx")

    ar_aging = AccountsReceivableAging(
        current=ar_data.get("Current", 0.0),
        days_1_30=ar_data.get("1-30 Days", 0.0),
        days_31_60=ar_data.get("31-60 Days", 0.0),
        days_61_90=ar_data.get("61-90 Days", 0.0),
        days_over_90=ar_data.get("Over 90 Days", 0.0),
        gross_ar=ar_data.get("Gross Accounts Receivable", 0.0),
        allowance_for_credit_losses=abs(ar_data.get("Allowance for Credit Losses", 0.0)),
        net_ar=ar_data.get("Net Accounts Receivable", 0.0),
    ) if ar_data else None

    ppe_sched = PPESchedule(
        gross_ppe=ppe_data.get("Gross PP&E", 0.0),
        accumulated_depreciation=abs(ppe_data.get("Accumulated Depreciation", 0.0)),
        net_ppe=ppe_data.get("Net PP&E", 0.0),
        additions_capex=ppe_data.get("Additions / CapEx", 0.0),
        disposals=abs(ppe_data.get("Disposals", 0.0)),
        depreciation_expense=abs(ppe_data.get("Depreciation Expense", 0.0)),
    ) if ppe_data else None

    debt_maturity = DebtMaturities(
        year_1=debt_data.get("Year 1", 0.0),
        year_2=debt_data.get("Year 2", 0.0),
        year_3=debt_data.get("Year 3", 0.0),
        year_4=debt_data.get("Year 4", 0.0),
        year_5=debt_data.get("Year 5", 0.0),
        thereafter=debt_data.get("Thereafter", 0.0),
        total_debt=debt_data.get("Total Debt", 0.0),
    ) if debt_data else None

    return Footnotes(
        ar_aging=ar_aging,
        ppe_sched=ppe_sched,
        debt_maturity=debt_maturity,
    )


def extract_metadata_from_folder(folder: Path) -> Metadata:
    """Extract metadata (company name, period, currency, scale) dynamically from Excel files or folder path."""
    client_name = None
    period = "2026-03-31"
    currency = "USD"
    scale = "EXACT"

    # 1. Check aob.xlsx or operational_drivers.xlsx if present
    aob_path = folder / "aob.xlsx"
    if not aob_path.exists() and (folder / "True_data" / "aob.xlsx").exists():
        aob_path = folder / "True_data" / "aob.xlsx"

    if aob_path.exists():
        try:
            wb = openpyxl.load_workbook(aob_path, data_only=True)
            sheet = wb.active
            rows = list(sheet.iter_rows(values_only=True))
            if len(rows) >= 2 and len(rows[1]) >= 7:
                candidate_company = str(rows[1][0]).strip()
                if candidate_company and candidate_company != "Company":
                    client_name = candidate_company
                unit_str = str(rows[1][6]).strip() if rows[1][6] else ""
                if "₹" in unit_str or "INR" in unit_str:
                    currency = "INR"
                elif "$" in unit_str or "USD" in unit_str:
                    currency = "USD"
                elif "€" in unit_str or "EUR" in unit_str:
                    currency = "EUR"
                elif "£" in unit_str or "GBP" in unit_str:
                    currency = "GBP"

                if "million" in unit_str.lower():
                    scale = "MILLIONS"
                elif "thousand" in unit_str.lower():
                    scale = "THOUSANDS"
                elif "billion" in unit_str.lower():
                    scale = "BILLIONS"
        except Exception:
            pass

    # 2. Check title blocks in current balance sheet or income statement
    curr_bs_path = folder / "current_data" / "balance_sheet.xlsx"
    if not curr_bs_path.exists() and (folder / "True_data" / "current_data" / "balance_sheet.xlsx").exists():
        curr_bs_path = folder / "True_data" / "current_data" / "balance_sheet.xlsx"

    if curr_bs_path.exists():
        try:
            wb = openpyxl.load_workbook(curr_bs_path, data_only=True)
            sheet = wb.active
            rows = list(sheet.iter_rows(values_only=True))
            if rows:
                if not client_name and rows[0] and rows[0][0]:
                    cell_val = str(rows[0][0]).strip()
                    if cell_val and "balance sheet" not in cell_val.lower():
                        client_name = cell_val

                for r in rows[:5]:
                    if r and r[0]:
                        line_text = str(r[0])
                        if "₹" in line_text or "INR" in line_text:
                            currency = "INR"
                        elif "$" in line_text or "USD" in line_text:
                            currency = "USD"
                        elif "€" in line_text or "EUR" in line_text:
                            currency = "EUR"
                        elif "£" in line_text or "GBP" in line_text:
                            currency = "GBP"

                        if "million" in line_text.lower():
                            scale = "MILLIONS"
                        elif "thousand" in line_text.lower():
                            scale = "THOUSANDS"

                        # Extract year
                        m = re.search(r"FY(\d{4})|20\d{2}", line_text)
                        if m:
                            yr = m.group(0)
                            if len(yr) == 4:
                                period = f"{yr}-03-31"
        except Exception:
            pass

    # 3. Fallback Company Name from Folder Name if client_name is missing or generic/default
    dir_name = folder.name
    if dir_name.lower() in ("true_data", "error_data", "current_data", "prior_data"):
        dir_name = folder.parent.name

    if dir_name and dir_name.lower() not in ("data", "fin", "."):
        clean_name = dir_name.replace("_", " ").strip()
        if clean_name.lower() == "google global":
            client_name = "Google Global"
        elif not client_name or client_name in ("Company", "Apex Global Technologies Inc.", "AsterNova Technologies Ltd."):
            client_name = clean_name.title()

    if not client_name:
        client_name = "AsterNova Technologies Ltd."

    return Metadata(
        client_name=client_name,
        period=period,
        currency=currency,
        scale=scale,
        framework="US GAAP / IFRS",
        review_stage="CY_DRAFT_FS",
    )


def load_dataset_from_folder(folder_path: Union[str, Path]) -> FinancialStatementsIngestionSchema:
    """
    Load financial dataset from a folder containing prior_data and current_data subdirectories.
    Supports root folders, subfolders, and dynamic entity extraction.
    """
    folder = Path(folder_path)
    if not folder.exists():
        raise FileNotFoundError(f"Dataset directory '{folder}' does not exist.")

    if not (folder / "current_data").exists():
        if (folder / "True_data" / "current_data").exists():
            folder = folder / "True_data"
        elif (folder / "error_data" / "current_data").exists():
            folder = folder / "error_data"
        elif (folder / "Error_data" / "current_data").exists():
            folder = folder / "Error_data"

    prior_dir = folder / "prior_data"
    curr_dir = folder / "current_data"

    if not curr_dir.exists():
        raise FileNotFoundError(f"Directory '{folder}' does not contain required 'current_data' folder.")

    metadata = extract_metadata_from_folder(folder)

    prior_bs = map_balance_sheet(parse_excel_key_values(prior_dir / "balance_sheet.xlsx"))
    prior_inc = map_income_statement(parse_excel_key_values(prior_dir / "income_statement.xlsx"))
    prior_tb = parse_trial_balance(prior_dir / "final_trial_balance.xlsx")

    prior_data = PriorData(
        balance_sheet=prior_bs,
        income_statement=prior_inc,
        final_trial_balance=prior_tb,
    )

    curr_bs = map_balance_sheet(parse_excel_key_values(curr_dir / "balance_sheet.xlsx"))
    curr_inc = map_income_statement(parse_excel_key_values(curr_dir / "income_statement.xlsx"))
    curr_cf = map_cash_flow_statement(parse_excel_key_values(curr_dir / "cash_flow_statement.xlsx"))
    curr_eq = map_equity_statement(parse_excel_key_values(curr_dir / "equity_statement.xlsx"))
    curr_tb = parse_trial_balance(curr_dir / "preliminary_trial_balance.xlsx")
    footnotes = map_footnotes(curr_dir)

    current_data = CurrentData(
        preliminary_trial_balance=curr_tb,
        balance_sheet=curr_bs,
        income_statement=curr_inc,
        cash_flow_statement=curr_cf,
        equity_statement=curr_eq,
        footnotes=footnotes,
    )

    aob_file = folder / "aob.xlsx"
    drivers_file = folder / "operational_drivers.xlsx"

    if aob_file.exists():
        aob_dict = parse_excel_key_values(aob_file)
        setattr(current_data, "aob", aob_dict)
        setattr(current_data, "annual_operating_budget", aob_dict)

    if drivers_file.exists():
        drv_dict = parse_excel_key_values(drivers_file)
        setattr(current_data, "operational_drivers", drv_dict)
        setattr(current_data, "drivers", drv_dict)

    return FinancialStatementsIngestionSchema(
        metadata=metadata,
        prior_data=prior_data,
        current_data=current_data,
    )

