from types import SimpleNamespace

from app.services.result_engine import ResultEngine


def test_calculate_result_computes_expected_grade_and_status():
    marks = [
        SimpleNamespace(marks_obtained=80, max_marks=100),
        SimpleNamespace(marks_obtained=70, max_marks=100),
    ]

    summary = ResultEngine.calculate_result(marks)

    assert summary.total_marks == 150.0
    assert summary.percentage == 75.0
    assert summary.grade == "B+"
    assert summary.sgpa == 7.5
    assert summary.pass_fail_status == "PASS"
