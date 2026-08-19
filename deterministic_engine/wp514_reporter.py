from __future__ import annotations
import json, math, re, shutil, textwrap, zipfile
from pathlib import Path
from typing import Any

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether

# NOTE: The delivered runtime script uses openpyxl because the project already uses it.
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Border, Side, Alignment
from openpyxl.utils import get_column_letter

NAVY = '#1F4E78'; NAVY2='#17365D'; BLUE='#D9EAF7'; PALE='#F5F8FC'; GRID='#B8C6D1'
GREEN='#E2F0D9'; AMBER='#FCE4D6'; RED='#F4CCCC'; GREY='#E7E6E6'; WHITE='#FFFFFF'; TEXT='#243444'


def load_json(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))


def schema_to_instance(node):
    if not isinstance(node, dict): return None
    if 'example' in node: return node['example']
    typ=node.get('type')
    if isinstance(typ,list): typ=next((x for x in typ if x!='null'), typ[0] if typ else None)
    if typ=='object' or 'properties' in node:
        out={}
        for k,v in node.get('properties',{}).items():
            val=schema_to_instance(v)
            if val is not None: out[k]=val
        return out
    if typ=='array' or 'items' in node:
        v=schema_to_instance(node.get('items',{}))
        return [] if v is None else [v]
    return None


def normalize(obj):
    if isinstance(obj,dict) and '$schema' in obj and 'properties' in obj:
        return schema_to_instance(obj) or {}, True
    return obj, False


def validate_pair(audit, analytics):
    for k in ('engagement','procedures','findings','conclusion'):
        if k not in audit: raise ValueError(f'Audit JSON missing {k}')
    for k in ('engagement','analytics','findings','conclusion'):
        if k not in analytics: raise ValueError(f'Analytics JSON missing {k}')
    a=audit['engagement']; b=analytics['engagement']
    for k in ('client_name','period','currency','scale','framework','review_stage'):
        if a.get(k) and b.get(k) and a[k]!=b[k]: raise ValueError(f'Engagement mismatch for {k}: {a[k]} != {b[k]}')


def engagement(audit,analytics):
    a=audit.get('engagement',{}); b=analytics.get('engagement',{})
    return {k:(a.get(k) if a.get(k) not in (None,'') else b.get(k)) for k in ('client_name','period','currency','scale','framework','review_stage')}


def fmt(v, decimals=2):
    if v is None or v=='': return '-'
    if isinstance(v,bool): return 'Yes' if v else 'No'
    if isinstance(v,(int,float)):
        if float(v).is_integer(): return f'{int(v):,}'
        return f'{v:,.{decimals}f}'
    return str(v)


def pct(v):
    if v is None or v=='': return '-'
    try: return f'{float(v):+.1f}%'
    except: return str(v)


def fill_for(status):
    s=str(status or '').upper()
    if s in {'PASS','CLEARED','HEALTHY','ON TARGET','RESOLVED','EXCEEDED'}: return GREEN
    if s in {'FLAGGED','WARNING','REVIEW REQUIRED','BELOW TARGET','OPEN'}: return AMBER
    if s in {'FAIL','CRITICAL','REJECTED'}: return RED
    return GREY


def safe(s): return re.sub(r'[^A-Za-z0-9._-]+','-',str(s or 'report')).strip('-') or 'report'


def _finding_key(f):
    """Stable content identity for the same finding repeated by both upstream reports."""
    def norm(v):
        if v is None:
            return ''
        if isinstance(v, (int, float)) and not isinstance(v, bool):
            return round(float(v), 8)
        if isinstance(v, list):
            return tuple(sorted(str(x).strip().lower() for x in v))
        return re.sub(r'\s+', ' ', str(v).strip().lower())
    # Do not rely only on finding ID: independent engines can reuse IDs.
    return (norm(f.get('description')), norm(f.get('expected')), norm(f.get('actual')), norm(f.get('difference')))

def merge_findings(audit_findings, analytics_findings):
    """Deduplicate cross-report repeats while preserving provenance and unique analytics findings."""
    merged=[]
    by_key={}
    for source, items in [('Mechanical Audit', audit_findings or []), ('Analytics Review', analytics_findings or [])]:
        for f in items:
            key=_finding_key(f)
            if key in by_key:
                entry=by_key[key]
                if source not in entry['sources']:
                    entry['sources'].append(source)
                # Preserve evidence from both inputs without duplicating it.
                ev=list(entry['finding'].get('evidence',[]) or [])
                seen={str(x).strip() for x in ev}
                for x in (f.get('evidence',[]) or []):
                    if str(x).strip() not in seen:
                        ev.append(x); seen.add(str(x).strip())
                entry['finding']['evidence']=ev
            else:
                copied=dict(f)
                copied['evidence']=list(f.get('evidence',[]) or [])
                entry={'sources':[source], 'finding':copied}
                by_key[key]=entry; merged.append(entry)
    return merged

def source_label(entry):
    return ' + '.join(entry.get('sources',[]))

# ---------------- Excel ----------------
def _title(ws, rng, text, size=16):
    ws.merge_cells(rng); c=ws[rng.split(':')[0]]; c.value=text
    c.fill=PatternFill('solid', fgColor=NAVY[1:]); c.font=Font(color='FFFFFF',bold=True,size=size)
    c.alignment=Alignment(vertical='center'); ws.row_dimensions[c.row].height=28

def _section(ws,row,title,end_col):
    ws.merge_cells(start_row=row,start_column=1,end_row=row,end_column=end_col)
    c=ws.cell(row,1,title); c.fill=PatternFill('solid',fgColor=BLUE[1:]); c.font=Font(color=NAVY2[1:],bold=True,size=11)
    c.alignment=Alignment(vertical='center'); ws.row_dimensions[row].height=21
    return row+1

def _headers(ws,row,headers):
    thin=Side(style='thin',color=GRID[1:])
    for j,h in enumerate(headers,1):
        c=ws.cell(row,j,h); c.fill=PatternFill('solid',fgColor=NAVY[1:]); c.font=Font(color='FFFFFF',bold=True,size=9)
        c.alignment=Alignment(horizontal='center',vertical='center',wrap_text=True); c.border=Border(left=thin,right=thin,top=thin,bottom=thin)
    ws.row_dimensions[row].height=30; return row+1

def _row(ws,row,vals,status_col=None,bold=False):
    thin=Side(style='thin',color=GRID[1:]); base='F7F9FC' if row%2==0 else 'FFFFFF'
    for j,v in enumerate(vals,1):
        c=ws.cell(row,j,v); c.fill=PatternFill('solid',fgColor=base); c.font=Font(color='000000',size=9,bold=bold)
        c.alignment=Alignment(vertical='top',wrap_text=True); c.border=Border(left=thin,right=thin,top=thin,bottom=thin)
        if status_col==j:
            c.fill=PatternFill('solid',fgColor=fill_for(v)[1:]); c.font=Font(bold=True,size=9); c.alignment=Alignment(horizontal='center',vertical='center',wrap_text=True)
    return row+1

def _widths(ws, vals):
    for col,w in vals.items(): ws.column_dimensions[col].width=w

def _money_fmt(scale): return '#,##0.00;[Red](#,##0.00);-'

def _engagement_block(ws,e,end_col=8):
    labels=[('Client / Entity',e.get('client_name')),('Period End',e.get('period')),('Currency',e.get('currency')),('Scale',e.get('scale')),('Framework',e.get('framework')),('Review Stage',e.get('review_stage'))]
    r=3
    for i in range(0,len(labels),2):
        (l1,v1),(l2,v2)=labels[i:i+2]
        ws.cell(r,1,l1).font=Font(bold=True,color=NAVY2[1:]); ws.cell(r,2,v1 or '-')
        ws.cell(r,4,l2).font=Font(bold=True,color=NAVY2[1:]); ws.cell(r,5,v2 or '-')
        ws.merge_cells(start_row=r,start_column=2,end_row=r,end_column=3); ws.merge_cells(start_row=r,start_column=5,end_row=r,end_column=end_col)
        for c in range(1,end_col+1): ws.cell(r,c).alignment=Alignment(vertical='center',wrap_text=True)
        r+=1
    return r+1

def build_excel(audit, analytics, out):
    e=engagement(audit,analytics); an=analytics.get('analytics',{}); wb=Workbook()
    audit_findings=audit.get('findings',[]) or []; analytics_findings=analytics.get('findings',[]) or []; merged_findings=merge_findings(audit_findings,analytics_findings)

    # 1. Core WP-514 review workpaper: engagement, completion summary, procedures, dual conclusions.
    ws=wb.active; ws.title='WP-514 Review'; ws.sheet_view.showGridLines=False
    _title(ws,'A1:H1','WORKPAPER WP-514: FINANCIAL STATEMENT REVIEW')
    r=_engagement_block(ws,e,8)
    ac=audit.get('conclusion',{}) or {}; xc=analytics.get('conclusion',{}) or {}
    r=_section(ws,r,'REVIEW STATUS',8)
    r=_headers(ws,r,['Mechanical Audit','Procedures Run','Procedures Passed','Analytics Review','Analytics Procedures','Analytics Passed','Audit Findings','Analytics Findings'])
    r=_row(ws,r,[ac.get('overall_status'),ac.get('total_procedures_run'),ac.get('procedures_passed'),xc.get('overall_status'),xc.get('total_procedures_run'),xc.get('procedures_passed'),len(audit_findings),len(analytics_findings)],1,bold=True)
    r+=1; r=_section(ws,r,'FINANCIAL STATEMENT REVIEW & CONTROL PROCEDURES',8)
    r=_headers(ws,r,['Step #','Category','Review Procedure / Control Test','Reference','Status','Issue / Exception','Resolution','Workpaper Note'])
    for p in audit.get('procedures',[]) or []:
        r=_row(ws,r,[p.get('step'),p.get('category'),p.get('procedure'),p.get('reference'),p.get('status'),p.get('issue') or '-',p.get('resolution') or '-',''],5)
    r+=1; r=_section(ws,r,'CONCLUSIONS',8)
    for label,c in [('Mechanical Audit Conclusion',ac),('Analytics Review Conclusion',xc)]:
        ws.merge_cells(start_row=r,start_column=1,end_row=r,end_column=2); ws.merge_cells(start_row=r,start_column=3,end_row=r,end_column=8)
        ws.cell(r,1,label).fill=PatternFill('solid',fgColor=NAVY[1:]); ws.cell(r,1).font=Font(color='FFFFFF',bold=True); ws.cell(r,1).alignment=Alignment(wrap_text=True,vertical='top')
        ws.cell(r,3,f"{c.get('overall_status','-')} | {c.get('text','-')}"); ws.cell(r,3).alignment=Alignment(wrap_text=True,vertical='top'); ws.row_dimensions[r].height=36; r+=1
    _widths(ws,{'A':10,'B':24,'C':55,'D':20,'E':15,'F':38,'G':40,'H':28}); ws.freeze_panes='A10'; ws.sheet_properties.pageSetUpPr.fitToPage=True; ws.page_setup.fitToWidth=1; ws.page_setup.fitToHeight=0; ws.print_title_rows='1:9'

    # 2. Detailed FS analytics supporting schedule.
    ws=wb.create_sheet('Financial Analytics'); ws.sheet_view.showGridLines=False
    _title(ws,'A1:G1',f"{str(e.get('client_name') or 'CLIENT').upper()} - FINANCIAL STATEMENT ANALYTICS")
    ws.merge_cells('A2:G2'); ws['A2']=f"Period: {e.get('period') or '-'} | Currency / Scale: {e.get('currency') or '-'} / {e.get('scale') or '-'}"; ws['A2'].font=Font(italic=True,color='666666',size=9)
    r=4
    for title,key in [('INCOME STATEMENT - YEAR OVER YEAR','income_statement'),('BALANCE SHEET - YEAR OVER YEAR','balance_sheet')]:
        data=an.get(key,[]) or []
        if not data: continue
        r=_section(ws,r,title,7); r=_headers(ws,r,['Line Item','Prior Period','Current Period','Variance','Variance (%)','Threshold Flag','Analytical Commentary / Audit Note'])
        for x in data:
            r=_row(ws,r,[x.get('line_item'),x.get('prior_period'),x.get('current_period'),x.get('variance'),x.get('variance_pct'),x.get('threshold_status'),x.get('commentary')],6)
            for col in (2,3,4): ws.cell(r-1,col).number_format=_money_fmt(e.get('scale'))
            ws.cell(r-1,5).number_format='0.0'
        r+=2
    _widths(ws,{'A':34,'B':18,'C':18,'D':18,'E':16,'F':18,'G':68}); ws.freeze_panes='A5'; ws.sheet_properties.pageSetUpPr.fitToPage=True; ws.page_setup.fitToWidth=1; ws.page_setup.fitToHeight=0

    # 3. Ratios only - no catch-all analytics.
    ws=wb.create_sheet('Ratio Analysis'); ws.sheet_view.showGridLines=False
    _title(ws,'A1:H1',f"{str(e.get('client_name') or 'CLIENT').upper()} - KEY FINANCIAL RATIOS")
    ws.merge_cells('A2:H2'); ws['A2']=f"Period: {e.get('period') or '-'} | Framework: {e.get('framework') or '-'}"; ws['A2'].font=Font(italic=True,color='666666',size=9)
    r=4; r=_headers(ws,r,['Category','Ratio / Metric','Formula / Methodology','Prior Period','Current Period','Benchmark / Target','Status','Assessment'])
    for x in an.get('ratios',[]) or []:
        r=_row(ws,r,[x.get('category'),x.get('name'),x.get('formula'),x.get('prior_period'),x.get('current_period'),x.get('benchmark'),x.get('status'),x.get('assessment')],7)
    _widths(ws,{'A':22,'B':30,'C':48,'D':16,'E':16,'F':24,'G':15,'H':60}); ws.freeze_panes='A5'; ws.sheet_properties.pageSetUpPr.fitToPage=True; ws.page_setup.fitToWidth=1; ws.page_setup.fitToHeight=0

    # 4. Findings / exceptions - detailed evidence schedule.
    ws=wb.create_sheet('Findings & Exceptions'); ws.sheet_view.showGridLines=False
    _title(ws,'A1:J1','WP-514 FINDINGS, EXCEPTIONS & EVIDENCE')
    ws.merge_cells('A2:J2'); ws['A2']='Unique findings from both upstream reports. Exact cross-report duplicates are shown once with combined provenance.'; ws['A2'].font=Font(italic=True,color='666666',size=9)
    r=4; r=_headers(ws,r,['Finding ID','Source','Category','Severity','Description','Expected','Actual','Difference','Status','Recommended Action / Evidence'])
    for entry in merged_findings:
        f=entry['finding']; source=source_label(entry)
        ev='; '.join(map(str,f.get('evidence',[]) or []))
        r=_row(ws,r,[f.get('id'),source,f.get('category'),f.get('severity'),f.get('description'),f.get('expected'),f.get('actual'),f.get('difference'),f.get('status'),f"{f.get('recommended_action') or '-'}\nEvidence: {ev or '-'}\nConfidence: {fmt(f.get('confidence'))}"],9)
    if r==5:
        ws.merge_cells('A5:J6'); ws['A5']='No findings or exceptions were supplied in either input JSON.'; ws['A5'].alignment=Alignment(horizontal='center',vertical='center'); ws['A5'].font=Font(italic=True,color='666666')
    _widths(ws,{'A':20,'B':18,'C':30,'D':12,'E':55,'F':16,'G':16,'H':16,'I':14,'J':62}); ws.freeze_panes='A5'; ws.sheet_properties.pageSetUpPr.fitToPage=True; ws.page_setup.fitToWidth=1; ws.page_setup.fitToHeight=0

    # 5. Supporting analytics - detail that belongs in Excel, not the core PDF.
    ws=wb.create_sheet('Supporting Analytics'); ws.sheet_view.showGridLines=False
    _title(ws,'A1:F1','SUPPORTING ANALYTICS SCHEDULE')
    ws.merge_cells('A2:F2'); ws['A2']='Supporting FP&A / relationship analytics from the analytics JSON. These are supporting schedules, not mechanical audit procedures.'; ws['A2'].font=Font(italic=True,color='666666',size=9)
    r=4
    rel=an.get('relationship_disconnects',[]) or []
    if rel:
        r=_section(ws,r,'RELATIONSHIP DISCONNECT CHECKS',6); r=_headers(ws,r,['Rule ID','Rule Name','Metric Value','Threshold','Status','Audit Implication'])
        for x in rel: r=_row(ws,r,[x.get('rule_id'),x.get('rule_name'),x.get('metric_value'),x.get('threshold'),x.get('status'),x.get('audit_implication')],5)
        r+=2
    bva=an.get('bva_attainment') or {}; lines=bva.get('bva_line_items',[]) or []
    if lines:
        r=_section(ws,r,'BUDGET VS ACTUAL ATTAINMENT',6); r=_headers(ws,r,['Line Item','Actual','Budget','Variance','Attainment %','Status'])
        for x in lines: r=_row(ws,r,[x.get('line_item'),x.get('actual_amount'),x.get('budget_amount'),x.get('dollar_variance'),x.get('attainment_pct'),x.get('status')],6)
        r+=2
    drv=bva.get('driver_unit_variances') or {}
    if drv:
        r=_section(ws,r,'DRIVER PRODUCTIVITY',6); r=_headers(ws,r,['Metric','Value','','','',''])
        for k,v in drv.items(): r=_row(ws,r,[k.replace('_',' ').title(),v,'','','',''])
        r+=2
    def flat(prefix,obj):
        if isinstance(obj,dict):
            for k,v in obj.items(): yield from flat(f'{prefix} / {k}' if prefix else k,v)
        else: yield prefix,obj
    hist=an.get('historical_baseline_analytics') or {}
    if hist:
        r=_section(ws,r,'HISTORICAL BASELINE & WORKING CAPITAL',6); r=_headers(ws,r,['Metric','Value','','','',''])
        for k,v in flat('',hist): r=_row(ws,r,[k.replace('_',' ').title(),v,'','','',''])
        r+=2
    runway=an.get('cash_runway_velocity') or {}
    if runway:
        r=_section(ws,r,'CASH RUNWAY & VELOCITY',6); r=_headers(ws,r,['Metric','Value','','','',''])
        for k,v in runway.items(): r=_row(ws,r,[k.replace('_',' ').title(),v,'','','',''])
    _widths(ws,{'A':34,'B':48,'C':20,'D':20,'E':18,'F':75}); ws.freeze_panes='A5'; ws.sheet_properties.pageSetUpPr.fitToPage=True; ws.page_setup.fitToWidth=1; ws.page_setup.fitToHeight=0

    wb.save(out)

# ---------------- PDF ----------------
def P(text, style): return Paragraph(str(text if text not in (None,'') else '-'), style)

def pdf_table(rows,widths,header=True,status_col=None,font=7.5):
    t=Table(rows,colWidths=widths,repeatRows=1 if header else 0,hAlign='LEFT')
    cmds=[('GRID',(0,0),(-1,-1),0.35,colors.HexColor(GRID)),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),4),('RIGHTPADDING',(0,0),(-1,-1),4),('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4),('FONTNAME',(0,0),(-1,-1),'Helvetica'),('FONTSIZE',(0,0),(-1,-1),font)]
    if header: cmds += [('BACKGROUND',(0,0),(-1,0),colors.HexColor(NAVY)),('TEXTCOLOR',(0,0),(-1,0),colors.white),('FONTNAME',(0,0),(-1,0),'Helvetica-Bold')]
    for r in range(1 if header else 0,len(rows)):
        if r%2==0: cmds.append(('BACKGROUND',(0,r),(-1,r),colors.HexColor(PALE)))
        if status_col is not None:
            raw=rows[r][status_col]; txt=raw.getPlainText() if hasattr(raw,'getPlainText') else str(raw)
            cmds.append(('BACKGROUND',(status_col,r),(status_col,r),colors.HexColor(fill_for(txt)))); cmds.append(('FONTNAME',(status_col,r),(status_col,r),'Helvetica-Bold'))
    t.setStyle(TableStyle(cmds)); return t

def build_pdf(audit,analytics,out):
    e=engagement(audit,analytics); an=analytics.get('analytics',{}); audit_findings=audit.get('findings',[]) or []; analytics_findings=analytics.get('findings',[]) or []; merged_findings=merge_findings(audit_findings,analytics_findings); findings=[(source_label(x),x['finding']) for x in merged_findings]
    doc=SimpleDocTemplate(str(out),pagesize=landscape(A4),leftMargin=13*mm,rightMargin=13*mm,topMargin=12*mm,bottomMargin=13*mm,title='WP-514 Financial Statement Review Workpaper')
    ss=getSampleStyleSheet(); body=ParagraphStyle('body',parent=ss['BodyText'],fontName='Helvetica',fontSize=7.5,leading=10,textColor=colors.HexColor(TEXT)); small=ParagraphStyle('small',parent=body,fontSize=6.8,leading=8.5); h=ParagraphStyle('h',parent=ss['Heading2'],fontName='Helvetica-Bold',fontSize=12,leading=14,textColor=colors.HexColor(NAVY2),spaceBefore=8,spaceAfter=5); white=ParagraphStyle('white',parent=body,textColor=colors.white,fontSize=8,leading=10); card=ParagraphStyle('card',parent=body,fontName='Helvetica-Bold',fontSize=12,leading=14,alignment=TA_CENTER,textColor=colors.HexColor(NAVY2)); cardlab=ParagraphStyle('cardlab',parent=body,fontSize=6.8,leading=8,alignment=TA_CENTER,textColor=colors.HexColor('#5A6773'))
    story=[]; ac=audit.get('conclusion',{}) or {}; xc=analytics.get('conclusion',{}) or {}
    banner=Table([[P('<b>AUDIT WORKPAPER WP-514</b><br/><font size="9">Financial Statement Review</font>',ParagraphStyle('b',parent=white,fontSize=17,leading=22)),P(f"<b>Client:</b> {e.get('client_name') or '-'}<br/><b>Period:</b> {e.get('period') or '-'}<br/><b>Currency / Scale:</b> {e.get('currency') or '-'} / {e.get('scale') or '-'}",white),P(f"<b>Framework:</b> {e.get('framework') or '-'}<br/><b>Review Stage:</b> {e.get('review_stage') or '-'}<br/><b>Mechanical Status:</b> {ac.get('overall_status') or '-'}",white)]],colWidths=[100*mm,82*mm,82*mm])
    banner.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),colors.HexColor(NAVY)),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),9)])); story += [banner,Spacer(1,6)]
    cards=[]
    for lab,val in [('PROCEDURES',f"{fmt(ac.get('procedures_passed'))} / {fmt(ac.get('total_procedures_run'))}"),('MECHANICAL AUDIT',ac.get('overall_status') or '-'),('ANALYTICS REVIEW',xc.get('overall_status') or '-'),('OPEN FINDINGS',fmt(sum(str(f.get('status','')).upper()=='OPEN' for _,f in findings)))]:
        cards.append(Table([[P(lab,cardlab)],[P(val,card)]],colWidths=[62*mm]))
    ct=Table([cards],colWidths=[67*mm]*4); ct.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'MIDDLE'),('BOX',(0,0),(-1,-1),0.4,colors.HexColor(GRID)),('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#FAFCFE')),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5)])); story += [ct,Spacer(1,5)]

    story.append(P('1. FINANCIAL STATEMENT REVIEW & CONTROL PROCEDURES',h)); rows=[[P(x,small) for x in ['#','Category','Review / Control Test','Ref','Status','Issue','Resolution']]]
    for p in audit.get('procedures',[]) or []: rows.append([P(p.get('step'),small),P(p.get('category'),small),P(p.get('procedure'),small),P(p.get('reference'),small),P(p.get('status'),small),P(p.get('issue') or '-',small),P(p.get('resolution') or '-',small)])
    story += [pdf_table(rows,[10*mm,38*mm,82*mm,24*mm,20*mm,50*mm,52*mm],status_col=4,font=6.7),Spacer(1,5)]

    sec=2
    for title,key in [('INCOME STATEMENT YOY ANALYTICS','income_statement'),('BALANCE SHEET YOY ANALYTICS','balance_sheet')]:
        data=an.get(key,[]) or []
        if not data: continue
        story.append(P(f'{sec}. {title}',h)); sec+=1; rows=[[P(x,small) for x in ['Financial Line Item','Prior','Current','Variance','Variance %','Flag','Analytical Commentary']]]
        for x in data: rows.append([P(x.get('line_item'),small),P(fmt(x.get('prior_period')),small),P(fmt(x.get('current_period')),small),P(fmt(x.get('variance')),small),P(pct(x.get('variance_pct')),small),P(x.get('threshold_status'),small),P(x.get('commentary'),small)])
        story += [pdf_table(rows,[48*mm,28*mm,28*mm,28*mm,23*mm,20*mm,101*mm],status_col=5,font=6.8),Spacer(1,4)]

    ratios=an.get('ratios',[]) or []
    if ratios:
        story.append(P(f'{sec}. KEY FINANCIAL RATIOS',h)); sec+=1; rows=[[P(x,small) for x in ['Category','Ratio','Prior','Current','Benchmark','Status','Assessment']]]
        for x in ratios: rows.append([P(x.get('category'),small),P(x.get('name'),small),P(fmt(x.get('prior_period')),small),P(fmt(x.get('current_period')),small),P(x.get('benchmark'),small),P(x.get('status'),small),P(x.get('assessment'),small)])
        story += [pdf_table(rows,[30*mm,40*mm,25*mm,25*mm,35*mm,22*mm,99*mm],status_col=5,font=6.8),Spacer(1,4)]

    # Only exceptions / non-pass relationship checks are promoted to the PDF. Full detail remains in Excel.
    rel_exc=[x for x in (an.get('relationship_disconnects',[]) or []) if str(x.get('status','')).upper() not in {'PASS','CLEARED'}]
    if rel_exc:
        story.append(P(f'{sec}. RELATIONSHIP EXCEPTIONS',h)); sec+=1; rows=[[P(x,small) for x in ['Rule','Relationship','Metric','Threshold','Status','Audit Implication']]]
        for x in rel_exc: rows.append([P(x.get('rule_id'),small),P(x.get('rule_name'),small),P(fmt(x.get('metric_value')),small),P(fmt(x.get('threshold')),small),P(x.get('status'),small),P(x.get('audit_implication'),small)])
        story += [pdf_table(rows,[22*mm,62*mm,25*mm,25*mm,22*mm,120*mm],status_col=4,font=6.6),Spacer(1,4)]

    if findings:
        story.append(P(f'{sec}. FINDINGS / EXCEPTIONS',h)); sec+=1
        for src,f in findings:
            evidence='; '.join(map(str,f.get('evidence',[]) or [])) or '-'
            box=Table([[P(f"<b>{f.get('id','-')}</b> | {src} | <b>{f.get('severity','-')}</b> | {f.get('status','-')}",body)],[P(f"<b>Description:</b> {f.get('description','-')}",body)],[P(f"<b>Expected:</b> {fmt(f.get('expected'))} &nbsp;&nbsp; <b>Actual:</b> {fmt(f.get('actual'))} &nbsp;&nbsp; <b>Difference:</b> {fmt(f.get('difference'))} &nbsp;&nbsp; <b>Confidence:</b> {fmt(f.get('confidence'))}",body)],[P(f"<b>Evidence:</b> {evidence}",body)],[P(f"<b>Recommended action:</b> {f.get('recommended_action','-')}",body)]],colWidths=[276*mm])
            box.setStyle(TableStyle([('BOX',(0,0),(-1,-1),0.5,colors.HexColor(GRID)),('BACKGROUND',(0,0),(-1,0),colors.HexColor(fill_for(f.get('status')))),('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4)])); story += [box,Spacer(1,4)]

    story.append(P(f'{sec}. CONCLUSIONS',h)); rows=[[P('Mechanical Audit',body),P(ac.get('overall_status'),body),P(ac.get('text'),body)],[P('Analytics Review',body),P(xc.get('overall_status'),body),P(xc.get('text'),body)]]; story.append(pdf_table(rows,[45*mm,35*mm,196*mm],header=False,status_col=1,font=7.5)); story += [Spacer(1,4)]

    def footer(canvas,doc):
        canvas.saveState(); canvas.setStrokeColor(colors.HexColor(NAVY)); canvas.line(13*mm,10*mm,284*mm,10*mm); canvas.setFont('Helvetica',6.5); canvas.setFillColor(colors.HexColor('#667788')); canvas.drawString(13*mm,6.5*mm,f"WP-514 | {e.get('client_name') or '-'} | {e.get('period') or '-'}"); canvas.drawRightString(284*mm,6.5*mm,f'Page {doc.page}'); canvas.restoreState()
    doc.build(story,onFirstPage=footer,onLaterPages=footer)

def generate(audit_json,analytics_json,output_dir='wp514_output'):
    audit,aschema=normalize(load_json(audit_json)); analytics,xschema=normalize(load_json(analytics_json)); validate_pair(audit,analytics)
    out=Path(output_dir); out.mkdir(parents=True,exist_ok=True); period=engagement(audit,analytics).get('period') or 'report'
    pdf=out/f'WP-514_Audit_Report_{safe(period)}.pdf'; xlsx=out/f'WP-514_Supporting_Workbook_{safe(period)}.xlsx'
    build_pdf(audit,analytics,pdf); build_excel(audit,analytics,xlsx)
    return {'pdf':str(pdf),'xlsx':str(xlsx),'schema_preview':bool(aschema or xschema)}

if __name__=='__main__':
    import argparse
    ap=argparse.ArgumentParser(); ap.add_argument('audit_json'); ap.add_argument('analytics_json'); ap.add_argument('--output-dir',default='wp514_output'); args=ap.parse_args()
    print(json.dumps(generate(args.audit_json,args.analytics_json,args.output_dir),indent=2))
