"""
math_engine.math sub-package.
Provides deterministic mechanical accounting rules, footnote tie-outs, and input assumption guardrails.
"""

from math_engine.math.assertions import run_complete_audit_suite, run_assertion_rules
from math_engine.math.guardrails import run_input_guardrails_suite, run_all_guardrails

__all__ = [
    "run_complete_audit_suite",
    "run_assertion_rules",
    "run_input_guardrails_suite",
    "run_all_guardrails",
]
