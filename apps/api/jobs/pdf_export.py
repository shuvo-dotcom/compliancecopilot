"""
Generate a compliance gap report PDF from a job's findings JSON.
Uses reportlab — no external services, runs fully offline.
"""
from io import BytesIO
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether,
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER

# ── Palette ──────────────────────────────────────────────────────────────────
NAVY   = colors.HexColor("#0f172a")
BLUE   = colors.HexColor("#0284c7")
SKY    = colors.HexColor("#38bdf8")
GREEN  = colors.HexColor("#16a34a")
AMBER  = colors.HexColor("#d97706")
RED    = colors.HexColor("#dc2626")
GRAY   = colors.HexColor("#6b7280")
LGRAY  = colors.HexColor("#f1f5f9")
WHITE  = colors.white

STATUS_COLOR = {"compliant": GREEN, "partial": AMBER, "gap": RED}
SEVERITY_COLOR = {"critical": RED, "high": colors.HexColor("#ea580c"),
                  "medium": AMBER, "low": GRAY}


def _styles():
    s = getSampleStyleSheet()
    base = dict(fontName="Helvetica", leading=14)
    return {
        "h1":    ParagraphStyle("h1",    fontSize=22, textColor=WHITE,   spaceAfter=4,  **base),
        "h2":    ParagraphStyle("h2",    fontSize=14, textColor=NAVY,    spaceAfter=6,  spaceBefore=10, **base),
        "h3":    ParagraphStyle("h3",    fontSize=11, textColor=NAVY,    spaceAfter=4,  spaceBefore=6,  fontName="Helvetica-Bold", leading=14),
        "body":  ParagraphStyle("body",  fontSize=9,  textColor=NAVY,    spaceAfter=4,  **base),
        "small": ParagraphStyle("small", fontSize=8,  textColor=GRAY,    spaceAfter=2,  **base),
        "italic":ParagraphStyle("italic",fontSize=8,  textColor=GRAY,    spaceAfter=2,  fontName="Helvetica-Oblique", leading=12),
        "badge": ParagraphStyle("badge", fontSize=8,  textColor=WHITE,   alignment=TA_CENTER, fontName="Helvetica-Bold", leading=10),
        "mono":  ParagraphStyle("mono",  fontSize=8,  textColor=NAVY,    fontName="Courier", leading=11),
    }


def generate_pdf(report: dict, document_name: str) -> bytes:
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=18*mm, rightMargin=18*mm,
        topMargin=15*mm, bottomMargin=15*mm,
    )
    st = _styles()
    W = doc.width
    story = []

    # ── Cover banner ─────────────────────────────────────────────────────────
    framework_label = "GDPR (EU 2016/679)" if report.get("framework") == "gdpr" else "EU AI Act (2024)"
    generated = datetime.fromisoformat(report.get("generated_at", datetime.utcnow().isoformat()))

    banner_data = [[
        Paragraph("ComplianceCopilot", st["h1"]),
        Paragraph(f"<b>{framework_label}</b><br/>Gap Analysis Report", ParagraphStyle(
            "sub", fontSize=11, textColor=SKY, fontName="Helvetica", leading=16)),
    ]]
    banner = Table(banner_data, colWidths=[W * 0.55, W * 0.45])
    banner.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("VALIGN",     (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING",(0, 0), (-1, -1), 12),
        ("RIGHTPADDING",(0,0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 14),
        ("BOTTOMPADDING",(0,0),(-1, -1), 14),
        ("ROUNDEDCORNERS", (0,0),(-1,-1), [6,6,6,6]),
    ]))
    story.append(banner)
    story.append(Spacer(1, 6*mm))

    # ── Document info ─────────────────────────────────────────────────────────
    story.append(Paragraph(f"Document: <b>{document_name}</b>", st["body"]))
    story.append(Paragraph(f"Generated: {generated.strftime('%d %b %Y %H:%M UTC')}", st["small"]))
    story.append(Spacer(1, 4*mm))

    # ── Summary stats ─────────────────────────────────────────────────────────
    summary = report.get("summary", {})
    pct = summary.get("compliance_percentage", 0)
    pct_color = GREEN if pct >= 80 else (AMBER if pct >= 50 else RED)

    stat_data = [[
        _stat_cell(f"{pct}%", "Compliance", pct_color),
        _stat_cell(str(summary.get("compliant", 0)), "Compliant", GREEN),
        _stat_cell(str(summary.get("partial", 0)), "Partial", AMBER),
        _stat_cell(str(summary.get("gaps", 0)), "Gaps", RED),
        _stat_cell(str(summary.get("average_risk_score", 0)), "Avg Risk", NAVY),
    ]]
    stat_table = Table(stat_data, colWidths=[W / 5] * 5, rowHeights=[22*mm])
    stat_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LGRAY),
        ("GRID",       (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("VALIGN",     (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN",      (0, 0), (-1, -1), "CENTER"),
    ]))
    story.append(stat_table)
    story.append(Spacer(1, 5*mm))

    # ── Executive summary ─────────────────────────────────────────────────────
    exec_text = report.get("executive_summary", "")
    if exec_text:
        story.append(Paragraph("Executive Summary", st["h2"]))
        story.append(HRFlowable(width=W, thickness=1, color=SKY, spaceAfter=4))
        for para in exec_text.split("\n\n"):
            if para.strip():
                story.append(Paragraph(para.strip(), st["body"]))
        story.append(Spacer(1, 5*mm))

    # ── Findings ─────────────────────────────────────────────────────────────
    findings = sorted(report.get("findings", []), key=lambda f: f.get("risk_score", 0), reverse=True)
    story.append(Paragraph(f"Findings ({len(findings)})", st["h2"]))
    story.append(HRFlowable(width=W, thickness=1, color=SKY, spaceAfter=6))

    for finding in findings:
        story.append(KeepTogether(_render_finding(finding, W, st)))
        story.append(Spacer(1, 4*mm))

    doc.build(story)
    return buf.getvalue()


def _stat_cell(value: str, label: str, color):
    return [
        Paragraph(f'<font size="18" color="{color.hexval()}"><b>{value}</b></font>', ParagraphStyle(
            "sv", alignment=TA_CENTER, fontName="Helvetica-Bold", fontSize=18, leading=20)),
        Paragraph(f'<font size="8" color="#6b7280">{label}</font>', ParagraphStyle(
            "sl", alignment=TA_CENTER, fontName="Helvetica", fontSize=8, leading=10)),
    ]


def _render_finding(finding: dict, width, st) -> list:
    elems = []
    status = finding.get("overall_status", "gap")
    severity = finding.get("severity", "medium")
    risk = finding.get("risk_score", 0)
    bg = {
        "compliant": colors.HexColor("#f0fdf4"),
        "partial":   colors.HexColor("#fffbeb"),
        "gap":       colors.HexColor("#fef2f2"),
    }.get(status, LGRAY)

    # Header row: article + title + status badge + risk score
    header_data = [[
        Paragraph(f'<font size="8" color="#6b7280">{finding.get("article","")}</font>'
                  f'  <b>{finding.get("title","")}</b>', st["h3"]),
        Paragraph(
            f'<font color="{STATUS_COLOR.get(status, GRAY).hexval()}"><b>{status.upper()}</b></font>'
            f'  <font color="{SEVERITY_COLOR.get(severity, GRAY).hexval()}">[{severity}]</font>',
            ParagraphStyle("badge2", fontSize=9, alignment=TA_LEFT, fontName="Helvetica-Bold", leading=12)
        ),
        Paragraph(f'<font size="16" color="{_risk_color(risk).hexval()}"><b>{risk}</b></font>'
                  f'<br/><font size="7" color="#6b7280">risk score</font>',
                  ParagraphStyle("rs", alignment=TA_CENTER, fontName="Helvetica", fontSize=9, leading=12)),
    ]]
    header_table = Table(header_data, colWidths=[width * 0.52, width * 0.30, width * 0.18])
    header_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("LEFTPADDING",(0, 0), (-1, -1), 8),
        ("RIGHTPADDING",(0,0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING",(0,0),(-1,-1), 6),
        ("VALIGN",     (0, 0), (-1, -1), "TOP"),
        ("ALIGN",      (2, 0), (2, 0), "CENTER"),
        ("BOX",        (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
    ]))
    elems.append(header_table)

    # Summary paragraph
    summary_data = [[Paragraph(finding.get("summary", ""), st["body"])]]
    summary_table = Table(summary_data, colWidths=[width])
    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0,0),(-1,-1), bg),
        ("LEFTPADDING",(0,0),(-1,-1), 8),
        ("RIGHTPADDING",(0,0),(-1,-1), 8),
        ("TOPPADDING", (0,0),(-1,-1), 2),
        ("BOTTOMPADDING",(0,0),(-1,-1), 6),
        ("BOX",(0,0),(-1,-1),0.5,colors.HexColor("#e2e8f0")),
        ("TOPPADDING",(0,0),(-1,-1),0),
    ]))
    elems.append(summary_table)

    # Check results
    icon = {"compliant": "✓", "partial": "◐", "missing": "✗"}
    icon_color = {"compliant": GREEN, "partial": AMBER, "missing": RED}

    checks = finding.get("check_results", [])
    if checks:
        rows = []
        for cr in checks:
            s = cr.get("status", "missing")
            ic = icon.get(s, "?")
            ic_col = icon_color.get(s, GRAY)
            rows.append([
                Paragraph(f'<font color="{ic_col.hexval()}"><b>{ic}</b></font>', st["body"]),
                [
                    Paragraph(cr.get("check", ""), st["body"]),
                    Paragraph(cr.get("explanation", ""), st["small"]) if cr.get("explanation") else Spacer(1,1),
                    Paragraph(f'"{cr["evidence"]}"', st["italic"]) if cr.get("evidence") else Spacer(1,1),
                ],
            ])
        check_table = Table(rows, colWidths=[8*mm, width - 8*mm])
        check_table.setStyle(TableStyle([
            ("BACKGROUND", (0,0),(-1,-1), bg),
            ("LEFTPADDING",(0,0),(-1,-1), 8),
            ("RIGHTPADDING",(0,0),(-1,-1), 8),
            ("TOPPADDING", (0,0),(-1,-1), 2),
            ("BOTTOMPADDING",(0,0),(-1,-1), 2),
            ("VALIGN",     (0,0),(-1,-1), "TOP"),
            ("BOX",(0,0),(-1,-1),0.5,colors.HexColor("#e2e8f0")),
        ]))
        elems.append(check_table)

    # Priority footer
    priority = finding.get("remediation_priority", "")
    footer_data = [[
        Paragraph(
            f'Priority: <b>{priority}</b>  ·  '
            f'{finding.get("missing_checks",0)} missing  ·  {finding.get("partial_checks",0)} partial',
            st["small"]
        )
    ]]
    footer_table = Table(footer_data, colWidths=[width])
    footer_table.setStyle(TableStyle([
        ("BACKGROUND", (0,0),(-1,-1), colors.HexColor("#e2e8f0")),
        ("LEFTPADDING",(0,0),(-1,-1), 8),
        ("TOPPADDING", (0,0),(-1,-1), 4),
        ("BOTTOMPADDING",(0,0),(-1,-1), 4),
        ("BOX",(0,0),(-1,-1),0.5,colors.HexColor("#cbd5e1")),
    ]))
    elems.append(footer_table)
    return elems


def _risk_color(score: int):
    if score >= 70:
        return RED
    if score >= 40:
        return AMBER
    return GREEN
