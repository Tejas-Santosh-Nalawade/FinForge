"""
spell_checker.py
Financial Statement Line-Item & Attribute Name Spell-Checker for FinForge.
Ingests raw attribute/line-item strings from Excel files and detects, corrects, and maps
spelling mistakes, typos, and naming variations to standardized canonical attributes.
"""

import re
import difflib
from typing import Dict, Any, List, Tuple, Optional


STANDARD_LINE_ITEM_CATALOG: Dict[str, Dict[str, Any]] = {
    # Income Statement Items
    "revenue": {
        "canonical": "revenue",
        "standard_label": "Revenue",
        "category": "Income Statement",
        "aliases": ["revenue", "sales", "total revenue", "gross revenue", "turnover", "net revenue", "operating revenue", "net sales", "revnue", "revenu"]
    },
    "cogs": {
        "canonical": "cogs",
        "standard_label": "Cost of Goods Sold",
        "category": "Income Statement",
        "aliases": ["cost of goods sold", "cost of sales", "cogs", "direct costs", "direct cost", "cost of revenue", "cost of revenues", "cost of goods sol"]
    },
    "gross_profit": {
        "canonical": "gross_profit",
        "standard_label": "Gross Profit",
        "category": "Income Statement",
        "aliases": ["gross profit", "gross margin", "gross income", "gros profit", "gross profit/loss"]
    },
    "sga_expense": {
        "canonical": "sga_expense",
        "standard_label": "SG&A Expense",
        "category": "Income Statement",
        "aliases": ["selling, general & administrative", "selling general & administrative", "selling, general and administrative", "sg&a", "sga", "operating expense - sga", "selling & administrative", "sga expense"]
    },
    "rd_expense": {
        "canonical": "rd_expense",
        "standard_label": "R&D Expense",
        "category": "Income Statement",
        "aliases": ["research & development", "research and development", "r&d", "rnd", "research & development expense", "research and dev"]
    },
    "depreciation_amortization": {
        "canonical": "depreciation_amortization",
        "standard_label": "Depreciation & Amortization",
        "category": "Income Statement",
        "aliases": ["depreciation & amortization", "depreciation and amortization", "d&a", "depreciation expense", "amortization expense", "depreciaton & amortiztion"]
    },
    "total_operating_expenses": {
        "canonical": "total_operating_expenses",
        "standard_label": "Total Operating Expenses",
        "category": "Income Statement",
        "aliases": ["total operating expenses", "total opex", "opex", "operating expenses", "total operating expense"]
    },
    "operating_income": {
        "canonical": "operating_income",
        "standard_label": "Operating Income",
        "category": "Income Statement",
        "aliases": ["operating income", "operating profit", "ebit", "income from operations", "operatng income"]
    },
    "interest_expense": {
        "canonical": "interest_expense",
        "standard_label": "Interest Expense",
        "category": "Income Statement",
        "aliases": ["interest expense", "finance costs", "interest cost", "finance expense", "intrest expense"]
    },
    "non_operating_income": {
        "canonical": "non_operating_income",
        "standard_label": "Non-Operating Income",
        "category": "Income Statement",
        "aliases": ["non-operating income / (expense)", "non-operating income", "non operating income", "other income / (expense)", "other income"]
    },
    "income_tax_expense": {
        "canonical": "income_tax_expense",
        "standard_label": "Income Tax Expense",
        "category": "Income Statement",
        "aliases": ["income tax expense", "provision for income taxes", "tax expense", "income taxes", "tax provision"]
    },
    "net_income": {
        "canonical": "net_income",
        "standard_label": "Net Income",
        "category": "Income Statement",
        "aliases": ["net income", "net profit", "net earnings", "bottom line", "net profit/loss"]
    },

    # Balance Sheet Items
    "cash_and_cash_equivalents": {
        "canonical": "cash_and_cash_equivalents",
        "standard_label": "Cash & Cash Equivalents",
        "category": "Balance Sheet",
        "aliases": ["cash & cash equivalents", "cash and cash equivalents", "cash & equivalents", "cash and equivalents", "cash", "cash & bank", "cash and bank balances"]
    },
    "accounts_receivable_net": {
        "canonical": "accounts_receivable_net",
        "standard_label": "Accounts Receivable, net",
        "category": "Balance Sheet",
        "aliases": ["accounts receivable, net", "accounts receivable net", "accounts receivable", "trade receivables", "net accounts receivable", "ar net", "acounts receivable", "trade debtors"]
    },
    "inventory": {
        "canonical": "inventory",
        "standard_label": "Inventory",
        "category": "Balance Sheet",
        "aliases": ["inventory", "inventories", "total inventory", "ending inventory", "merchandise inventory", "inventorys", "stock in trade"]
    },
    "prepaid_expenses": {
        "canonical": "prepaid_expenses",
        "standard_label": "Prepaid Expenses",
        "category": "Balance Sheet",
        "aliases": ["prepaid expenses & other current assets", "prepaid expenses and other current assets", "prepaid expenses", "other current assets", "prepaid expenss", "prepaids"]
    },
    "total_current_assets": {
        "canonical": "total_current_assets",
        "standard_label": "Total Current Assets",
        "category": "Balance Sheet",
        "aliases": ["total current assets", "current assets total", "total current asset"]
    },
    "ppe_net": {
        "canonical": "ppe_net",
        "standard_label": "PP&E, net",
        "category": "Balance Sheet",
        "aliases": ["property, plant & equipment, net", "property plant & equipment net", "property, plant and equipment, net", "ppe, net", "net ppe", "property plant & equipment", "property, plant & equipment"]
    },
    "intangible_assets": {
        "canonical": "intangible_assets",
        "standard_label": "Intangible Assets",
        "category": "Balance Sheet",
        "aliases": ["intangible assets", "intangibles", "intangibles net", "goodwill and intangibles", "intangible asset"]
    },
    "total_assets": {
        "canonical": "total_assets",
        "standard_label": "Total Assets",
        "category": "Balance Sheet",
        "aliases": ["total assets", "assets total", "total asset"]
    },
    "accounts_payable": {
        "canonical": "accounts_payable",
        "standard_label": "Accounts Payable",
        "category": "Balance Sheet",
        "aliases": ["accounts payable", "trade payables", "ap", "acounts payable", "trade creditors"]
    },
    "accrued_expenses": {
        "canonical": "accrued_expenses",
        "standard_label": "Accrued Expenses",
        "category": "Balance Sheet",
        "aliases": ["accrued liabilities", "accrued expenses", "accrued expenses & liabilities", "other current liabilities", "accrued expenss"]
    },
    "short_term_debt": {
        "canonical": "short_term_debt",
        "standard_label": "Short-term Debt",
        "category": "Balance Sheet",
        "aliases": ["short-term debt", "short term debt", "bank overdraft", "short term borrowings"]
    },
    "current_portion_of_lt_debt": {
        "canonical": "current_portion_of_lt_debt",
        "standard_label": "Current Portion of Long-term Debt",
        "category": "Balance Sheet",
        "aliases": ["current portion of long-term debt", "current portion of long term debt", "current portion of lt debt"]
    },
    "total_current_liabilities": {
        "canonical": "total_current_liabilities",
        "standard_label": "Total Current Liabilities",
        "category": "Balance Sheet",
        "aliases": ["total current liabilities", "current liabilities total"]
    },
    "long_term_debt": {
        "canonical": "long_term_debt",
        "standard_label": "Long-term Debt",
        "category": "Balance Sheet",
        "aliases": ["long-term debt", "long term debt", "non-current debt", "long term borrowings"]
    },
    "total_liabilities": {
        "canonical": "total_liabilities",
        "standard_label": "Total Liabilities",
        "category": "Balance Sheet",
        "aliases": ["total liabilities", "liabilities total"]
    },
    "common_stock": {
        "canonical": "common_stock",
        "standard_label": "Common Stock",
        "category": "Balance Sheet",
        "aliases": ["common stock", "share capital", "ordinary shares"]
    },
    "additional_paid_in_capital": {
        "canonical": "additional_paid_in_capital",
        "standard_label": "Additional Paid-in Capital",
        "category": "Balance Sheet",
        "aliases": ["additional paid-in capital", "additional paid in capital", "apic", "share premium"]
    },
    "retained_earnings": {
        "canonical": "retained_earnings",
        "standard_label": "Retained Earnings",
        "category": "Balance Sheet",
        "aliases": ["retained earnings", "retained profit", "accumulated deficit", "retaned earnings"]
    },
    "total_equity": {
        "canonical": "total_equity",
        "standard_label": "Total Equity",
        "category": "Balance Sheet",
        "aliases": ["total equity", "total stockholders' equity", "total stockholders equity", "total shareholders' equity", "stockholders' equity"]
    },

    # Operational Drivers & AOB
    "headcount": {
        "canonical": "headcount",
        "standard_label": "Headcount",
        "category": "Operational Drivers",
        "aliases": ["headcount", "employees", "head count", "total headcount", "headcount_employees", "hedcount"]
    },
    "operating_volume": {
        "canonical": "operating_volume",
        "standard_label": "Operating Volume",
        "category": "Operational Drivers",
        "aliases": ["operating volume", "units", "operating volume units", "volume", "production volume", "operatng volume"]
    },
    "capex": {
        "canonical": "capex",
        "standard_label": "Capital Expenditure",
        "category": "Cash Flow / CapEx",
        "aliases": ["capital expenditure", "capex", "capital expenditures", "additions to ppe"]
    },
}


def clean_string(raw_str: str) -> str:
    """Normalizes string by stripping special chars, extra whitespace, and lowercasing."""
    if not raw_str:
        return ""
    s = str(raw_str).strip().lower()
    s = re.sub(r'[\t\n\r]', ' ', s)
    s = re.sub(r'\s+', ' ', s)
    return s


class LineItemSpellChecker:
    """
    Spell Checker & Fuzzy Attribute Matcher for Financial Statements.
    Ingests raw line-item / attribute names from Excel files and maps them to standard canonical fields.
    """

    def __init__(self, catalog: Dict[str, Dict[str, Any]] = STANDARD_LINE_ITEM_CATALOG, similarity_threshold: float = 0.70):
        self.catalog = catalog
        self.similarity_threshold = similarity_threshold
        
        # Build flattened alias lookup dictionary
        self.alias_lookup: Dict[str, str] = {}
        for canonical, info in self.catalog.items():
            for alias in info.get("aliases", []):
                self.alias_lookup[clean_string(alias)] = canonical

    def check_and_correct(self, raw_input: str) -> Dict[str, Any]:
        """
        Checks raw string spelling against standard catalog.
        Returns a result dictionary:
        {
            "raw_input": str,
            "corrected_canonical": str or None,
            "standard_label": str or None,
            "category": str or None,
            "match_type": "EXACT" | "ALIAS" | "FUZZY" | "UNRESOLVED",
            "similarity_score": float,
            "has_spelling_correction": bool,
        }
        """
        cleaned = clean_string(raw_input)
        if not cleaned:
            return {
                "raw_input": raw_input,
                "corrected_canonical": None,
                "standard_label": None,
                "category": None,
                "match_type": "UNRESOLVED",
                "similarity_score": 0.0,
                "has_spelling_correction": False,
            }

        # 1. Exact canonical key match
        if cleaned in self.catalog:
            info = self.catalog[cleaned]
            return {
                "raw_input": raw_input,
                "corrected_canonical": info["canonical"],
                "standard_label": info["standard_label"],
                "category": info["category"],
                "match_type": "EXACT",
                "similarity_score": 1.0,
                "has_spelling_correction": False,
            }

        # 2. Exact alias match
        if cleaned in self.alias_lookup:
            canonical = self.alias_lookup[cleaned]
            info = self.catalog[canonical]
            is_corrected = (cleaned != clean_string(info["standard_label"]))
            return {
                "raw_input": raw_input,
                "corrected_canonical": canonical,
                "standard_label": info["standard_label"],
                "category": info["category"],
                "match_type": "ALIAS",
                "similarity_score": 1.0,
                "has_spelling_correction": is_corrected,
            }

        # 3. Fuzzy match across all known aliases using SequenceMatcher
        best_canonical = None
        best_alias_match = None
        best_score = 0.0

        for known_alias, canonical in self.alias_lookup.items():
            ratio = difflib.SequenceMatcher(None, cleaned, known_alias).ratio()
            if ratio > best_score:
                best_score = ratio
                best_canonical = canonical
                best_alias_match = known_alias

        if best_score >= self.similarity_threshold and best_canonical:
            info = self.catalog[best_canonical]
            return {
                "raw_input": raw_input,
                "corrected_canonical": best_canonical,
                "standard_label": info["standard_label"],
                "category": info["category"],
                "match_type": "FUZZY",
                "similarity_score": round(best_score, 4),
                "has_spelling_correction": True,
                "matched_alias": best_alias_match,
            }

        # 4. Unresolved
        return {
            "raw_input": raw_input,
            "corrected_canonical": None,
            "standard_label": None,
            "category": None,
            "match_type": "UNRESOLVED",
            "similarity_score": round(best_score, 4),
            "has_spelling_correction": False,
        }

    def batch_check_excel_attributes(self, attribute_list: List[str]) -> List[Dict[str, Any]]:
        """Checks spelling and maps a list of attribute strings from an Excel sheet."""
        return [self.check_and_correct(attr) for attr in attribute_list]


# Global singleton instance for convenient imports
spell_checker = LineItemSpellChecker()


def spell_check_line_item(line_item_name: str) -> Optional[str]:
    """Helper function: Returns corrected canonical attribute key or None."""
    res = spell_checker.check_and_correct(line_item_name)
    return res.get("corrected_canonical")


if __name__ == "__main__":
    test_inputs = [
        "Revenue",
        "Revnue",
        "Cost of Goods Sol",
        "Acounts Receivable",
        "Retaned Earnings",
        "Depreciaton & Amortiztion",
        "Hedcount",
        "Operatng Volum",
        "Prepaid Expenss",
        "Unknown Custom Line Item"
    ]
    print("=== FinForge Line-Item Spell Checker Test ===")
    for inp in test_inputs:
        res = spell_checker.check_and_correct(inp)
        status = f"CORRECTED ({res['match_type']}, score={res['similarity_score']})" if res['has_spelling_correction'] else res['match_type']
        print(f"Input: {inp:<30} -> Canonical: {str(res['corrected_canonical']):<30} [{status}]")
