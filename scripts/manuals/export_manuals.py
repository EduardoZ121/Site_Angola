#!/usr/bin/env python3
"""Export Kuteka v2 manuals to PDF + DOCX and mirror into public/docs."""

from __future__ import annotations

import shutil
import subprocess
import tempfile
from pathlib import Path

ROOT = Path("/tmp/site-angola-work")
HELP = ROOT / "docs" / "help"
PUBLIC = ROOT / "apps" / "web" / "public" / "docs"
EXPORTS = HELP / "exports"
ARTIFACTS = Path("/opt/cursor/artifacts/manuals-kuteka")

DOCS = [
    "MANUAL_UTILIZADOR_COMPLETO_v2",
    "MANUAL_OPERACIONAL_ADMINISTRATIVO_v2",
    "MATRIZ_PAPEIS_PERMISSOES_GOVERNANCA_v2",
]

CSS = """
@page { size: A4; margin: 18mm 16mm; }
body {
  font-family: DejaVu Sans, Liberation Sans, sans-serif;
  font-size: 10.5pt;
  line-height: 1.45;
  color: #0f172a;
}
h1 { font-size: 20pt; margin: 0 0 12pt; }
h2 { font-size: 14pt; margin: 18pt 0 8pt; border-bottom: 1px solid #cbd5e1; padding-bottom: 4pt; }
h3 { font-size: 12pt; margin: 14pt 0 6pt; }
h4 { font-size: 11pt; margin: 10pt 0 4pt; }
p, li { margin: 0 0 6pt; }
table { border-collapse: collapse; width: 100%; margin: 8pt 0 12pt; font-size: 9pt; }
th, td { border: 1px solid #cbd5e1; padding: 4pt 6pt; vertical-align: top; }
th { background: #f1f5f9; }
pre {
  background: #0f172a;
  color: #e2e8f0;
  padding: 8pt;
  border-radius: 6pt;
  font-size: 7.5pt;
  line-height: 1.25;
  white-space: pre-wrap;
  word-break: break-word;
}
code { font-family: DejaVu Sans Mono, monospace; font-size: 9pt; }
blockquote {
  border-left: 3px solid #f59e0b;
  margin: 8pt 0;
  padding: 6pt 10pt;
  background: #fffbeb;
}
"""


def run(cmd: list[str]) -> None:
    print("+", " ".join(cmd))
    subprocess.run(cmd, check=True)


def export_one(stem: str) -> None:
    md = HELP / f"{stem}.md"
    if not md.exists():
        raise SystemExit(f"missing {md}")

    EXPORTS.mkdir(parents=True, exist_ok=True)
    PUBLIC.mkdir(parents=True, exist_ok=True)
    ARTIFACTS.mkdir(parents=True, exist_ok=True)

    docx = EXPORTS / f"{stem}.docx"
    pdf = EXPORTS / f"{stem}.pdf"

    run(
        [
            "pandoc",
            str(md),
            "-o",
            str(docx),
            "--from=markdown",
            "--to=docx",
            f"--resource-path={HELP}",
        ]
    )

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        html = tmp_path / f"{stem}.html"
        css = tmp_path / "manual.css"
        css.write_text(CSS, encoding="utf-8")
        run(
            [
                "pandoc",
                str(md),
                "-o",
                str(html),
                "--from=markdown",
                "--to=html5",
                "--standalone",
                f"--css={css}",
                f"--metadata=title={stem}",
                f"--resource-path={HELP}",
            ]
        )
        # Inline CSS for weasyprint reliability
        html_text = html.read_text(encoding="utf-8")
        if "<style>" not in html_text:
            html_text = html_text.replace("</head>", f"<style>{CSS}</style></head>")
            html.write_text(html_text, encoding="utf-8")
        run(
            [
                "python3",
                "-c",
                (
                    "from weasyprint import HTML; "
                    f"HTML(filename=r'{html}').write_pdf(r'{pdf}')"
                ),
            ]
        )

    for src in (md, docx, pdf):
        shutil.copy2(src, PUBLIC / src.name)
        shutil.copy2(src, ARTIFACTS / src.name)

    print(f"OK {stem}: docx={docx.stat().st_size} pdf={pdf.stat().st_size}")


def main() -> None:
    for stem in DOCS:
        export_one(stem)
    # Keep v1 pointers usable: also copy util manual as primary download alias
    util = "MANUAL_UTILIZADOR_COMPLETO_v2"
    for ext in (".md", ".pdf", ".docx"):
        src = PUBLIC / f"{util}{ext}"
        if src.exists():
            shutil.copy2(src, PUBLIC / f"MANUAL_UTILIZADOR_v2{ext}")
            shutil.copy2(src, ARTIFACTS / f"MANUAL_UTILIZADOR_v2{ext}")
    print("Done.")


if __name__ == "__main__":
    main()
