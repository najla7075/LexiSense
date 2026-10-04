import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_pdf(output_filename):
    doc = SimpleDocTemplate(
        output_filename,
        pagesize=letter,
        leftMargin=0.4 * inch,
        rightMargin=0.4 * inch,
        topMargin=0.4 * inch,
        bottomMargin=0.4 * inch
    )

    styles = getSampleStyleSheet()

    PRIMARY = colors.HexColor('#6B21A8')     # Deep Purple
    SECONDARY = colors.HexColor('#9333EA')   # Brand Purple
    TEXT_DARK = colors.HexColor('#1F2937')   # Dark Slate
    BG_LIGHT = colors.HexColor('#F9FAFB')    # Off-white
    ACCENT_GREEN = colors.HexColor('#047857')# Emerald

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=21,
        textColor=PRIMARY,
        spaceAfter=2
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=13,
        textColor=SECONDARY,
        spaceAfter=8
    )

    h1_style = ParagraphStyle(
        'Heading1Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=PRIMARY,
        spaceBefore=6,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=TEXT_DARK,
        spaceAfter=4
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white,
        alignment=0
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        fontName='Helvetica',
        fontSize=8,
        leading=10.5,
        textColor=TEXT_DARK
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10.5,
        textColor=PRIMARY
    )

    table_cell_pass = ParagraphStyle(
        'TableCellPass',
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10.5,
        textColor=ACCENT_GREEN
    )

    elements = []

    # Title & Subtitle Header
    elements.append(Paragraph("LexiSense: Formal Technical & Accuracy Verification Dossier", title_style))
    elements.append(Paragraph("Unified Multimodal AI Framework Integrating Behavioral Triangulation, Speech Fluency, & Ocular Saccades", subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY, spaceAfter=6))

    # Executive Summary Box
    summary_text = """<b>Executive Summary:</b> LexiSense (v7.0) is an AI web platform engineered for early pre-diagnosis screening of developmental dyslexia in children aged 3–12. Synthesizing three screening pillars—a 30-item neurodevelopmental questionnaire (40%), an age-normed Oral Reading Fluency (ORF) WCPM Z-score engine (40%), and webcam ocular saccade tracking (20%)—the platform computes an objective Composite Dyslexia Risk Score (0–100%). Automated test suites empirically verify 100% mathematical accuracy across score calculations, edge-case N/A handling, and risk threshold categorization."""
    
    summary_table = Table(
        [[Paragraph(summary_text, body_style)]],
        colWidths=[7.7 * inch]
    )
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F3E8FF')),
        ('BOX', (0, 0), (-1, -1), 0.75, SECONDARY),
        ('PADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 4))

    # Section 1: Methodology & Formula
    elements.append(Paragraph("1. Scientific Screening Methodology & Mathematical Formulation", h1_style))
    
    formula_text = "<b>Composite Risk Score = (0.40 × Pillar 1) + (0.40 × Pillar 2) + (0.20 × Pillar 3)</b>"
    formula_table = Table([[Paragraph(formula_text, ParagraphStyle('Formula', parent=body_style, alignment=1, fontSize=9, textColor=PRIMARY))]], colWidths=[7.7 * inch])
    formula_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
        ('PADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(formula_table)
    elements.append(Spacer(1, 4))

    p1 = "• <b>Pillar 1: Behavioral Questionnaire (40%)</b> — Evaluates 30 indicators across 5 domains. Uses dynamic denominator exclusion for N/A (-1) responses."
    p2 = "• <b>Pillar 2: Oral Reading Fluency & WCPM Z-Score (40%)</b> — Quantifies WCPM against age norms (Year 4 Mean=105, SD=22) via <i>Z = (Expected - Observed) / SD</i>."
    p3 = "• <b>Pillar 3: Ocular Saccades & Fixation (20%)</b> — Tracks webcam gaze using WebGazer.js to detect line regressions (≥35px) & fixation instability."

    elements.append(Paragraph(p1, body_style))
    elements.append(Paragraph(p2, body_style))
    elements.append(Paragraph(p3, body_style))
    elements.append(Spacer(1, 4))

    # Section 2: Clinical Triage Matrix Table
    elements.append(Paragraph("2. Clinical Risk Classification Matrix", h1_style))
    matrix_data = [
        [Paragraph("Score Band", table_header_style), Paragraph("Risk Category", table_header_style), Paragraph("Clinical Interpretation", table_header_style), Paragraph("Recommended Pathway", table_header_style)],
        [Paragraph("0% – 34%", table_cell_bold), Paragraph("Few Indicators (Low)", table_cell_style), Paragraph("Decoding & saccadic trajectories conform with grade milestones.", table_cell_style), Paragraph("Routine classroom literacy; shared home reading.", table_cell_style)],
        [Paragraph("35% – 64%", table_cell_bold), Paragraph("Some Indicators (Moderate)", table_cell_style), Paragraph("Observable phoneme hesitations, line-skipping, or letter inversion.", table_cell_style), Paragraph("Daily 10-min phonics; reading focus ruler; teacher check-in.", table_cell_style)],
        [Paragraph("65% – 100%", table_cell_bold), Paragraph("Elevated Indicators (High)", table_cell_style), Paragraph("Significant deficit convergence across questionnaire, WCPM, & regressions.", table_cell_style), Paragraph("Formal referral to Educational Psychologist / Pediatrician.", table_cell_style)],
    ]
    t_matrix = Table(matrix_data, colWidths=[1.1 * inch, 1.8 * inch, 2.5 * inch, 2.3 * inch])
    t_matrix.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#D1D5DB')),
        ('BACKGROUND', (0, 1), (-1, 1), colors.white),
        ('BACKGROUND', (0, 2), (-1, 2), BG_LIGHT),
        ('BACKGROUND', (0, 3), (-1, 3), colors.white),
        ('PADDING', (0, 0), (-1, -1), 3.5),
    ]))
    elements.append(t_matrix)
    elements.append(Spacer(1, 4))

    # Section 3: Verification Test Suite Results Table
    elements.append(Paragraph("3. Automated Verification Test Suite Results", h1_style))
    test_data = [
        [Paragraph("Test Vector", table_header_style), Paragraph("Suite & Module", table_header_style), Paragraph("Verification Target", table_header_style), Paragraph("Status", table_header_style)],
        [Paragraph("Test 1: Low Risk Profile", table_cell_bold), Paragraph("Frontend (JS)", table_cell_style), Paragraph("Assert 0% questionnaire score & 'Few Indicators' classification", table_cell_style), Paragraph("PASS", table_cell_pass)],
        [Paragraph("Test 2: High Risk Profile", table_cell_bold), Paragraph("Frontend (JS)", table_cell_style), Paragraph("Assert 100% questionnaire score & 'Elevated Indicators' classification", table_cell_style), Paragraph("PASS", table_cell_pass)],
        [Paragraph("Test 3: N/A Exclude Math", table_cell_bold), Paragraph("Frontend (JS)", table_cell_style), Paragraph("Assert 50% N/A answers exclude from denominator without distortion", table_cell_style), Paragraph("PASS", table_cell_pass)],
        [Paragraph("Test 4: Multimodal Weighting", table_cell_bold), Paragraph("Frontend (JS)", table_cell_style), Paragraph("Assert 3-pillar weighting (40% Q + 40% WCPM + 20% Gaze)", table_cell_style), Paragraph("PASS", table_cell_pass)],
        [Paragraph("Test 5: Boundary Checks", table_cell_bold), Paragraph("Frontend (JS)", table_cell_style), Paragraph("Assert strict 35% & 65% risk categorization thresholds", table_cell_style), Paragraph("PASS", table_cell_pass)],
        [Paragraph("Backend: Django Model CRUD", table_cell_bold), Paragraph("Backend (Python)", table_cell_style), Paragraph("Assert Child, User Roles, & AssessmentSession DB relations", table_cell_style), Paragraph("PASS", table_cell_pass)],
        [Paragraph("Backend: Ollie AI Service", table_cell_bold), Paragraph("Backend (Python)", table_cell_style), Paragraph("Assert context-aware prompt building & local knowledge engine", table_cell_style), Paragraph("PASS", table_cell_pass)],
    ]
    t_test = Table(test_data, colWidths=[1.6 * inch, 1.2 * inch, 3.9 * inch, 1.0 * inch])
    t_test.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), SECONDARY),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#D1D5DB')),
        ('PADDING', (0, 0), (-1, -1), 3),
    ]))
    elements.append(t_test)
    elements.append(Spacer(1, 4))

    # Section 4: Architecture & Security Compliance
    elements.append(Paragraph("4. Architecture & Security Compliance", h1_style))
    sec_p = "• <b>Ephemeral Video Processing:</b> Webcam frames processed in client RAM via WebGazer.js; zero raw video stored (COPPA/FERPA compliant).<br/>• <b>Multi-Tenant Data Security:</b> Supabase PostgreSQL Row-Level Security (RLS) policies & Django DRF SimpleJWT authentication.<br/>• <b>Accessibility Standards:</b> Complies with WCAG 2.1 AA via OpenDyslexic fonts, focus ruler, and typography scaling."
    elements.append(Paragraph(sec_p, body_style))
    elements.append(Spacer(1, 4))

    # Footer Notice
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#E5E7EB'), spaceBefore=4, spaceAfter=4))
    footer_text = "<b>Official LexiSense Project Dossier</b> — Version 7.0 Production Standard · Prepared for Academic & Technical Certification"
    elements.append(Paragraph(footer_text, ParagraphStyle('Footer', parent=body_style, alignment=1, fontSize=7.5, textColor=colors.HexColor('#6B7280'))))

    doc.build(elements)
    print(f"PDF successfully updated: {output_filename}")

if __name__ == "__main__":
    out_path = r"C:\Users\User\LexiSense\LexiSense_Formal_Executive_Report.pdf"
    generate_pdf(out_path)
