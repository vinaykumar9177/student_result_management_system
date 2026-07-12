from __future__ import annotations

from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet


def generate_result_pdf(student_name: str, roll_number: str, semester_number: int, summary: dict, subject_rows: list[list[str]]) -> bytes:
    buffer = BytesIO()
    document = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = [
        Paragraph("Student Result Sheet", styles["Title"]),
        Spacer(1, 12),
        Paragraph(f"Name: {student_name}", styles["Normal"]),
        Paragraph(f"Roll Number: {roll_number}", styles["Normal"]),
        Paragraph(f"Semester: {semester_number}", styles["Normal"]),
        Spacer(1, 12),
        Table(
            [["Metric", "Value"]]
            + [["Total Marks", str(summary["total_marks"])] , ["Percentage", f'{summary["percentage"]:.2f}%'], ["Grade", summary["grade"]], ["SGPA", f'{summary["sgpa"]:.2f}'], ["CGPA", f'{summary["cgpa"]:.2f}'], ["Status", summary["pass_fail_status"]]],
            colWidths=[180, 250],
        ),
        Spacer(1, 12),
    ]
    if subject_rows:
        elements.append(Table([["Subject", "Marks", "Max Marks"]] + subject_rows, colWidths=[220, 120, 120]))
    for table in elements:
        if isinstance(table, Table):
            table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f2937")),
                        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ]
                )
            )
    document.build(elements)
    return buffer.getvalue()
