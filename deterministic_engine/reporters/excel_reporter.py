"""
reporters/excel_reporter.py
Dynamic Excel Workpaper Generator for FinForge.
Ingests audit_tieouts_report JSON dict and fpa_analytics_report JSON dict to build
a multi-tab WP-514 supporting Excel workbook:
1. WP-514 Review (Control procedures, statuses, conclusions)
2. Financial Analytics (YoY income statement & balance sheet variances)
3. Ratio Analysis (Key financial ratios & benchmarks)
4. Findings & Exceptions (Deduplicated audit findings & evidence)
5. Supporting Analytics (Relationship disconnects, BvA, cash runway)
"""

import re
from pathlib import Path
from typing import Dict, Any, List
import openpyxl
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Border, Side, Alignment


NAVY = '1F4E78'
NAVY2 = '17365D'
BLUE = 'D9EAF7'
PALE = 'F5F8FC'
GRID = 'B8C6D1'
GREEN = 'E2F0D9'
AMBER = 'FCE4D6'
RED = 'F4CCCC'
GREY = 'E7E6E6'


def _fmt(v: Any, decimals: int = 2) -> str:
    if v is None or v == '':
        return '-'
    if isinstance(v, bool):
        return 'Yes' if v else 'No'
    if isinstance(v, (int, float)):
        if float(v).is_integer():
            return f'{int(v):,}'
        return f'{v:,.{decimals}f}'
    return str(v)


def _pct(v: Any) -> str:
    if v is None or v == '':
        return '-'
    try:
        return f'{float(v):+.1f}%'
    except Exception:
        return str(v)


def _fill_for(status: Any) -> str:
    s = str(status or '').upper()
    if s in {'PASS', 'CLEARED', 'HEALTHY', 'ON TARGET', 'RESOLVED', 'EXCEEDED'}:
        return GREEN
    if s in {'FLAGGED', 'WARNING', 'REVIEW REQUIRED', 'BELOW TARGET', 'OPEN'}:
        return AMBER
    if s in {'FAIL', 'CRITICAL', 'REJECTED'}:
        return RED
    return GREY


def _finding_key(f: Dict[str, Any]):
    def norm(v):
        if v is None:
            return ''
        if isinstance(v, (int, float)) and not isinstance(v, bool):
            return round(float(v), 8)
        if isinstance(v, list):
            return tuple(sorted(str(x).strip().lower() for x in v))
        return re.sub(r'\s+', ' ', str(v).strip().lower())
    return (norm(f.get('description')), norm(f.get('expected')), norm(f.get('actual')), norm(f.get('difference')))


def _merge_findings(audit_findings: List[Dict[str, Any]], analytics_findings: List[Dict[str, Any]]):
    merged = []
    by_key = {}
    for source, items in [('Mechanical Audit', audit_findings or []), ('Analytics Review', analytics_findings or [])]:
        for f in items:
            key = _finding_key(f)
            if key in by_key:
                entry = by_key[key]
                if source not in entry['sources']:
                    entry['sources'].append(source)
                ev = list(entry['finding'].get('evidence', []) or [])
                seen = {str(x).strip() for x in ev}
                for x in (f.get('evidence', []) or []):
                    if str(x).strip() not in seen:
                        ev.append(x)
                        seen.add(str(x).strip())
                entry['finding']['evidence'] = ev
            else:
                copied = dict(f)
                copied['evidence'] = list(f.get('evidence', []) or [])
                entry = {'sources': [source], 'finding': copied}
                by_key[key] = entry
                merged.append(entry)
    return merged


def _title(ws, rng, text, size=16):
    ws.merge_cells(rng)
    c = ws[rng.split(':')[0]]
    c.value = text
    c.fill = PatternFill('solid', fgColor=NAVY)
    c.font = Font(color='FFFFFF', bold=True, size=size)
    c.alignment = Alignment(vertical='center')
    ws.row_dimensions[c.row].height = 28


def _section(ws, row, title, end_col):
    ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=end_col)
    c = ws.cell(row, 1, title)
    c.fill = PatternFill('solid', fgColor=BLUE)
    c.font = Font(color=NAVY2, bold=True, size=11)
    c.alignment = Alignment(vertical='center')
    ws.row_dimensions[row].height = 21
    return row + 1


def _headers(ws, row, headers):
    thin = Side(style='thin', color=GRID)
    for j, h in enumerate(headers, 1):
        c = ws.cell(row, j, h)
        c.fill = PatternFill('solid', fgColor=NAVY)
        c.font = Font(color='FFFFFF', bold=True, size=9)
        c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        c.border = Border(left=thin, right=thin, top=thin, bottom=thin)
    ws.row_dimensions[row].height = 30
    return row + 1


def _row(ws, row, vals, status_col=None, bold=False):
    thin = Side(style='thin', color=GRID)
    base = 'F7F9FC' if row % 2 == 0 else 'FFFFFF'
    for j, v in enumerate(vals, 1):
        c = ws.cell(row, j, v)
        c.fill = PatternFill('solid', fgColor=base)
        c.font = Font(color='000000', size=9, bold=bold)
        c.alignment = Alignment(vertical='top', wrap_text=True)
        c.border = Border(left=thin, right=thin, top=thin, bottom=thin)
        if status_col == j:
            c.fill = PatternFill('solid', fgColor=_fill_for(v))
            c.font = Font(bold=True, size=9)
            c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    return row + 1


def _widths(ws, vals):
    for col, w in vals.items():
        ws.column_dimensions[col].width = w


def generate_excel_workpaper(audit_payload: Dict[str, Any], analytics_payload: Dict[str, Any], output_path: Path) -> Path:
    """
    Generates dynamic 5-tab WP-514 Excel Workpaper based directly on audit and analytics JSON payloads.
    """
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    eng = audit_payload.get('engagement', {}) or analytics_payload.get('engagement', {}) or {}
    an = analytics_payload.get('analytics', {}) or {}
    wb = Workbook()

    audit_findings = audit_payload.get('findings', []) or []
    analytics_findings = analytics_payload.get('findings', []) or []
    merged_findings = _merge_findings(audit_findings, analytics_findings)

    # 1. WP-514 Review Tab
    ws = wb.active
    ws.title = 'WP-514 Review'
    ws.sheet_view.showGridLines = False
    _title(ws, 'A1:H1', 'WORKPAPER WP-514: FINANCIAL STATEMENT REVIEW')

    # Engagement Header
    labels = [
        ('Client / Entity', eng.get('client_name')),
        ('Period End', eng.get('period')),
        ('Currency', eng.get('currency')),
        ('Scale', eng.get('scale')),
        ('Framework', eng.get('framework')),
        ('Review Stage', eng.get('review_stage'))
    ]
    r = 3
    for i in range(0, len(labels), 2):
        (l1, v1), (l2, v2) = labels[i:i+2]
        ws.cell(r, 1, l1).font = Font(bold=True, color=NAVY2)
        ws.cell(r, 2, v1 or '-')
        ws.cell(r, 4, l2).font = Font(bold=True, color=NAVY2)
        ws.cell(r, 5, v2 or '-')
        ws.merge_cells(start_row=r, start_column=2, end_row=r, end_column=3)
        ws.merge_cells(start_row=r, start_column=5, end_row=r, end_column=8)
        for c in range(1, 9):
            ws.cell(r, c).alignment = Alignment(vertical='center', wrap_text=True)
        r += 1

    ac = audit_payload.get('conclusion', {}) or {}
    xc = analytics_payload.get('conclusion', {}) or {}
    r = _section(ws, r + 1, 'REVIEW STATUS', 8)
    r = _headers(ws, r, ['Mechanical Audit', 'Procedures Run', 'Procedures Passed', 'Analytics Review', 'Analytics Procedures', 'Analytics Passed', 'Audit Findings', 'Analytics Findings'])
    r = _row(ws, r, [
        ac.get('overall_status', 'CLEARED'),
        ac.get('total_procedures_run', len(audit_payload.get('procedures', []))),
        ac.get('procedures_passed', sum(1 for p in audit_payload.get('procedures', []) if p.get('status') == 'PASS')),
        xc.get('overall_status', 'CLEARED'),
        xc.get('total_procedures_run', 0),
        xc.get('procedures_passed', 0),
        len(audit_findings),
        len(analytics_findings)
    ], status_col=1, bold=True)

    r += 1
    r = _section(ws, r, 'FINANCIAL STATEMENT REVIEW & CONTROL PROCEDURES', 8)
    r = _headers(ws, r, ['Step #', 'Category', 'Review Procedure / Control Test', 'Reference', 'Status', 'Issue / Exception', 'Resolution', 'Workpaper Note'])
    for p in audit_payload.get('procedures', []) or []:
        r = _row(ws, r, [
            p.get('step'),
            p.get('category'),
            p.get('procedure'),
            p.get('reference'),
            p.get('status'),
            p.get('issue') or '-',
            p.get('resolution') or '-',
            ''
        ], status_col=5)

    r += 1
    r = _section(ws, r, 'CONCLUSIONS', 8)
    for label, c in [('Mechanical Audit Conclusion', ac), ('Analytics Review Conclusion', xc)]:
        ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=2)
        ws.merge_cells(start_row=r, start_column=3, end_row=r, end_column=8)
        ws.cell(r, 1, label).fill = PatternFill('solid', fgColor=NAVY)
        ws.cell(r, 1).font = Font(color='FFFFFF', bold=True)
        ws.cell(r, 1).alignment = Alignment(wrap_text=True, vertical='top')
        ws.cell(r, 3, f"{c.get('overall_status', '-')} | {c.get('text', '-')}")
        ws.cell(r, 3).alignment = Alignment(wrap_text=True, vertical='top')
        ws.row_dimensions[r].height = 36
        r += 1
    _widths(ws, {'A': 10, 'B': 24, 'C': 55, 'D': 20, 'E': 15, 'F': 38, 'G': 40, 'H': 28})
    ws.freeze_panes = 'A10'

    # 2. Financial Analytics Tab
    ws = wb.create_sheet('Financial Analytics')
    ws.sheet_view.showGridLines = False
    _title(ws, 'A1:G1', f"{str(eng.get('client_name') or 'CLIENT').upper()} - FINANCIAL STATEMENT ANALYTICS")
    ws.merge_cells('A2:G2')
    ws['A2'] = f"Period: {eng.get('period') or '-'} | Currency / Scale: {eng.get('currency') or '-'} / {eng.get('scale') or '-'}"
    ws['A2'].font = Font(italic=True, color='666666', size=9)
    r = 4
    for title, key in [('INCOME STATEMENT - YEAR OVER YEAR', 'income_statement'), ('BALANCE SHEET - YEAR OVER YEAR', 'balance_sheet')]:
        data = an.get(key, []) or []
        if not data:
            continue
        r = _section(ws, r, title, 7)
        r = _headers(ws, r, ['Line Item', 'Prior Period', 'Current Period', 'Variance', 'Variance (%)', 'Threshold Flag', 'Analytical Commentary / Audit Note'])
        for x in data:
            r = _row(ws, r, [
                x.get('line_item'),
                x.get('prior_period'),
                x.get('current_period'),
                x.get('variance'),
                x.get('variance_pct'),
                x.get('threshold_status'),
                x.get('commentary')
            ], status_col=6)
            for col in (2, 3, 4):
                ws.cell(r-1, col).number_format = '#,##0.00;[Red](#,##0.00);-'
            ws.cell(r-1, 5).number_format = '0.0'
        r += 2
    _widths(ws, {'A': 34, 'B': 18, 'C': 18, 'D': 18, 'E': 16, 'F': 18, 'G': 68})
    ws.freeze_panes = 'A5'

    # 3. Ratio Analysis Tab
    ws = wb.create_sheet('Ratio Analysis')
    ws.sheet_view.showGridLines = False
    _title(ws, 'A1:H1', f"{str(eng.get('client_name') or 'CLIENT').upper()} - KEY FINANCIAL RATIOS")
    ws.merge_cells('A2:H2')
    ws['A2'] = f"Period: {eng.get('period') or '-'} | Framework: {eng.get('framework') or '-'}"
    ws['A2'].font = Font(italic=True, color='666666', size=9)
    r = 4
    r = _headers(ws, r, ['Category', 'Ratio / Metric', 'Formula / Methodology', 'Prior Period', 'Current Period', 'Benchmark / Target', 'Status', 'Assessment'])
    for x in an.get('ratios', []) or []:
        r = _row(ws, r, [
            x.get('category'),
            x.get('name'),
            x.get('formula'),
            x.get('prior_period'),
            x.get('current_period'),
            x.get('benchmark'),
            x.get('status'),
            x.get('assessment')
        ], status_col=7)
    _widths(ws, {'A': 22, 'B': 30, 'C': 48, 'D': 16, 'E': 16, 'F': 24, 'G': 15, 'H': 60})
    ws.freeze_panes = 'A5'

    # 4. Findings & Exceptions Tab
    ws = wb.create_sheet('Findings & Exceptions')
    ws.sheet_view.showGridLines = False
    _title(ws, 'A1:J1', 'WP-514 FINDINGS, EXCEPTIONS & EVIDENCE')
    ws.merge_cells('A2:J2')
    ws['A2'] = 'Unique findings from both upstream reports. Exact cross-report duplicates are shown once with combined provenance.'
    ws['A2'].font = Font(italic=True, color='666666', size=9)
    r = 4
    r = _headers(ws, r, ['Finding ID', 'Source', 'Category', 'Severity', 'Description', 'Expected', 'Actual', 'Difference', 'Status', 'Recommended Action / Evidence'])
    for entry in merged_findings:
        f = entry['finding']
        source = ' + '.join(entry.get('sources', []))
        ev = '; '.join(map(str, f.get('evidence', []) or []))
        r = _row(ws, r, [
            f.get('id'),
            source,
            f.get('category'),
            f.get('severity'),
            f.get('description'),
            f.get('expected'),
            f.get('actual'),
            f.get('difference'),
            f.get('status'),
            f"{f.get('recommended_action') or '-'}\nEvidence: {ev or '-'}\nConfidence: {_fmt(f.get('confidence'))}"
        ], status_col=9)
    if r == 5:
        ws.merge_cells('A5:J6')
        ws['A5'] = 'No findings or exceptions were supplied in either input JSON.'
        ws['A5'].alignment = Alignment(horizontal='center', vertical='center')
        ws['A5'].font = Font(italic=True, color='666666')
    _widths(ws, {'A': 20, 'B': 18, 'C': 30, 'D': 12, 'E': 55, 'F': 16, 'G': 16, 'H': 16, 'I': 14, 'J': 62})
    ws.freeze_panes = 'A5'

    # 5. Supporting Analytics Tab
    ws = wb.create_sheet('Supporting Analytics')
    ws.sheet_view.showGridLines = False
    _title(ws, 'A1:F1', 'SUPPORTING ANALYTICS SCHEDULE')
    ws.merge_cells('A2:F2')
    ws['A2'] = 'Supporting FP&A / relationship analytics from the analytics JSON.'
    ws['A2'].font = Font(italic=True, color='666666', size=9)
    r = 4
    rel = an.get('relationship_disconnects', []) or []
    if rel:
        r = _section(ws, r, 'RELATIONSHIP DISCONNECT CHECKS', 6)
        r = _headers(ws, r, ['Rule ID', 'Rule Name', 'Metric Value', 'Threshold', 'Status', 'Audit Implication'])
        for x in rel:
            r = _row(ws, r, [
                x.get('rule_id'),
                x.get('rule_name'),
                x.get('metric_value'),
                x.get('threshold'),
                x.get('status'),
                x.get('audit_implication')
            ], status_col=5)
        r += 2

    bva = an.get('bva_attainment') or {}
    lines = bva.get('bva_line_items', []) or []
    if lines:
        r = _section(ws, r, 'BUDGET VS ACTUAL ATTAINMENT', 6)
        r = _headers(ws, r, ['Line Item', 'Actual', 'Budget', 'Variance', 'Attainment %', 'Status'])
        for x in lines:
            r = _row(ws, r, [
                x.get('line_item'),
                x.get('actual_amount'),
                x.get('budget_amount'),
                x.get('dollar_variance'),
                x.get('attainment_pct'),
                x.get('status')
            ], status_col=6)
        r += 2

    wb.save(output_path)
    return output_path
