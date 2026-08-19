"""
math_engine/ingestion/spell_checker.py
Exposes LineItemSpellChecker, spell_check_line_item, and spell_checker for ingestion.
"""

from spell_checker import (
    LineItemSpellChecker,
    spell_checker,
    spell_check_line_item,
    STANDARD_LINE_ITEM_CATALOG,
    clean_string,
)

__all__ = [
    "LineItemSpellChecker",
    "spell_checker",
    "spell_check_line_item",
    "STANDARD_LINE_ITEM_CATALOG",
    "clean_string",
]
