"""
math_engine.ingestion sub-package.
Provides data models, schemas, and loader utilities for financial statement ingestion.
"""

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
)
from math_engine.ingestion.loader import load_dataset_from_folder, extract_metadata_from_folder
from math_engine.ingestion.spell_checker import LineItemSpellChecker, spell_checker, spell_check_line_item

__all__ = [
    "load_dataset_from_folder",
    "extract_metadata_from_folder",
    "LineItemSpellChecker",
    "spell_checker",
    "spell_check_line_item",
    "FinancialStatementsIngestionSchema",
    "Metadata",
    "PriorData",
    "CurrentData",
    "BalanceSheetValues",
    "IncomeStatementValues",
    "CashFlowValues",
    "StockholdersEquity",
    "Footnotes",
]
