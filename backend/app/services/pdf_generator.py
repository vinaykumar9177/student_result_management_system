from __future__ import annotations

from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle


def generate_result_pdf(
    student_name: str,
    roll_number: str,
    semester_number: int,
    summary: dict,
    subject_rows: list[list[str]],
) -> bytes:
    buffer = BytesIO()
    # A4 dimensions are 595.27 x 841.89 points.
    # Set margins to 0.5 inch (36 points) for clean layout.
    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    # Custom styles for premium look
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        textColor=colors.HexColor("#0f172a"),  # Deep Slate
        spaceAfter=6,
    )

    subtitle_style = ParagraphStyle(
        "DocSubTitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#64748b"),  # Cool Gray
        spaceAfter=15,
    )

    header_style = ParagraphStyle(
        "SectionHeader",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#1e3a8a"),  # Indigo
        spaceBefore=12,
        spaceAfter=6,
    )

    body_bold = ParagraphStyle(
        "BodyBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#334155"),
    )

    body_regular = ParagraphStyle(
        "BodyRegular",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#334155"),
    )

    cell_style = ParagraphStyle(
        "Cell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#1e293b"),
    )

    cell_header = ParagraphStyle(
        "CellHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=colors.white,
    )

    elements = []

    # Title & Branding header
    elements.append(Paragraph("STUDENT ACADEMIC RECORD", title_style))
    elements.append(Paragraph("Official Semester Grade Sheet & Performance Report", subtitle_style))

    # Divider Line
    divider = Table([[""]], colWidths=[523], rowHeights=[2])
    divider.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#e2e8f0")),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
    ]))
    elements.append(divider)
    elements.append(Spacer(1, 15))

    # Student Information Section
    elements.append(Paragraph("Student Profile", header_style))

    student_data = [
        [
            Paragraph("Student Name:", body_bold),
            Paragraph(student_name, body_regular),
            Paragraph("Roll Number:", body_bold),
            Paragraph(roll_number, body_regular),
        ],
        [
            Paragraph("Semester:", body_bold),
            Paragraph(f"Semester {semester_number}", body_regular),
            Paragraph("Status:", body_bold),
            Paragraph(
                f"<font color='{'green' if summary['pass_fail_status'] == 'PASS' else 'red'}'><b>{summary['pass_fail_status']}</b></font>",
                body_regular,
            ),
        ],
    ]

    info_table = Table(student_data, colWidths=[110, 150, 110, 153])
    info_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, -1), 0.5, colors.HexColor("#f1f5f9")),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 20))

    # Subject Wise Grades / Marks
    elements.append(Paragraph("Subject-Wise Marks Details", header_style))

    subject_headers = [
        Paragraph("Subject Name", cell_header),
        Paragraph("Marks Obtained", cell_header),
        Paragraph("Max Marks", cell_header),
    ]

    subject_table_data = [subject_headers]
    for row in subject_rows:
        subject_table_data.append([
            Paragraph(row[0], cell_style),
            Paragraph(row[1], cell_style),
            Paragraph(row[2], cell_style),
        ])

    subjects_table = Table(subject_table_data, colWidths=[283, 120, 120])

    # Table styling for premium look
    t_style = [
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),  # Slate 800
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),  # Slate 300
    ]

    # Alternating row background colors
    for r_idx in range(1, len(subject_table_data)):
        if r_idx % 2 == 0:
            t_style.append(("BACKGROUND", (0, r_idx), (-1, r_idx), colors.HexColor("#f8fafc")))

    subjects_table.setStyle(TableStyle(t_style))
    elements.append(subjects_table)
    elements.append(Spacer(1, 25))

    # Summary and Performance Metrics
    elements.append(Paragraph("Performance Summary", header_style))

    summary_headers = [
        Paragraph("Total Marks", cell_header),
        Paragraph("Percentage", cell_header),
        Paragraph("Grade", cell_header),
        Paragraph("SGPA", cell_header),
        Paragraph("CGPA", cell_header),
    ]

    summary_values = [
        Paragraph(f"{summary['total_marks']}", cell_style),
        Paragraph(f"{summary['percentage']:.2f}%", cell_style),
        Paragraph(f"{summary['grade']}", cell_style),
        Paragraph(f"{summary['sgpa']:.2f}", cell_style),
        Paragraph(f"{summary['cgpa']:.2f}", cell_style),
    ]

    summary_table_data = [summary_headers, summary_values]
    summary_table = Table(summary_table_data, colWidths=[104, 104, 105, 105, 105])

    s_table_style = [
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#3b82f6")),  # Accent Blue
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#93c5fd")),
    ]
    summary_table.setStyle(TableStyle(s_table_style))
    elements.append(summary_table)

    document.build(elements)
    return buffer.getvalue()
