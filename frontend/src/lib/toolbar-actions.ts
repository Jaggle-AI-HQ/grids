import { Model } from "@ironcalc/workbook";
import * as XLSX from "xlsx";

/** Get the selected area as an Area object for updateRangeStyle */
function getSelectedArea(model: Model) {
  const view = model.getSelectedView();
  const [r1, c1, r2, c2] = view.range;
  return {
    sheet: view.sheet,
    row: Math.min(r1, r2),
    column: Math.min(c1, c2),
    width: Math.abs(c2 - c1) + 1,
    height: Math.abs(r2 - r1) + 1,
  };
}

/** Get style of the currently selected cell */
function getActiveCellStyle(model: Model) {
  const view = model.getSelectedView();
  return model.getCellStyle(view.sheet, view.row, view.column);
}

// ── Text formatting ──────────────────────────

export function toggleBold(model: Model) {
  const style = getActiveCellStyle(model);
  const area = getSelectedArea(model);
  model.updateRangeStyle(area, "font.b", style.font.b ? "false" : "true");
}

export function toggleItalic(model: Model) {
  const style = getActiveCellStyle(model);
  const area = getSelectedArea(model);
  model.updateRangeStyle(area, "font.i", style.font.i ? "false" : "true");
}

export function toggleUnderline(model: Model) {
  const style = getActiveCellStyle(model);
  const area = getSelectedArea(model);
  model.updateRangeStyle(area, "font.u", style.font.u ? "false" : "true");
}

export function toggleStrikethrough(model: Model) {
  const style = getActiveCellStyle(model);
  const area = getSelectedArea(model);
  model.updateRangeStyle(
    area,
    "font.strike",
    style.font.strike ? "false" : "true",
  );
}

// ── Font ─────────────────────────────────────

export function setFontSize(model: Model, size: number) {
  const area = getSelectedArea(model);
  model.updateRangeStyle(area, "font.sz", String(size));
}

export function setFontFamily(model: Model, name: string) {
  const area = getSelectedArea(model);
  model.updateRangeStyle(area, "font.name", name);
}

export function setFontColor(model: Model, color: string) {
  const area = getSelectedArea(model);
  model.updateRangeStyle(area, "font.color", color);
}

export function setFillColor(model: Model, color: string) {
  const area = getSelectedArea(model);
  model.updateRangeStyle(area, "fill.fg_color", color);
  model.updateRangeStyle(area, "fill.pattern_type", "solid");
}

// ── Alignment ────────────────────────────────

export function setHorizontalAlign(
  model: Model,
  align: "left" | "center" | "right" | "general",
) {
  const area = getSelectedArea(model);
  model.updateRangeStyle(area, "alignment.horizontal", align);
}

export function setVerticalAlign(
  model: Model,
  align: "top" | "center" | "bottom",
) {
  const area = getSelectedArea(model);
  model.updateRangeStyle(area, "alignment.vertical", align);
}

export function toggleWrapText(model: Model) {
  const style = getActiveCellStyle(model);
  const area = getSelectedArea(model);
  model.updateRangeStyle(
    area,
    "alignment.wrap_text",
    style.alignment?.wrap_text ? "false" : "true",
  );
}

// ── Number format ────────────────────────────

export function setNumberFormat(model: Model, fmt: string) {
  const area = getSelectedArea(model);
  model.updateRangeStyle(area, "num_fmt", fmt);
}

// ── Borders ──────────────────────────────────

export function setBorder(
  model: Model,
  borderType: string,
  style = "thin",
  color = "#000000",
) {
  const area = getSelectedArea(model);
  model.setAreaWithBorder(area, {
    item: { style, color },
    type: borderType as never,
  });
}

export function clearBorders(model: Model) {
  const area = getSelectedArea(model);
  model.setAreaWithBorder(area, {
    item: { style: "thin", color: "#000000" },
    type: "None" as never,
  });
}

// ── Rows & columns ───────────────────────────

export function insertRowAbove(model: Model) {
  const view = model.getSelectedView();
  model.insertRow(view.sheet, view.row);
}

export function insertRowBelow(model: Model) {
  const view = model.getSelectedView();
  model.insertRow(view.sheet, view.row + 1);
}

export function insertColumnLeft(model: Model) {
  const view = model.getSelectedView();
  model.insertColumn(view.sheet, view.column);
}

export function insertColumnRight(model: Model) {
  const view = model.getSelectedView();
  model.insertColumn(view.sheet, view.column + 1);
}

export function deleteRow(model: Model) {
  const view = model.getSelectedView();
  model.deleteRow(view.sheet, view.row);
}

export function deleteColumn(model: Model) {
  const view = model.getSelectedView();
  model.deleteColumn(view.sheet, view.column);
}

// ── Freeze panes ─────────────────────────────

export function freezeRows(model: Model) {
  const view = model.getSelectedView();
  const current = model.getFrozenRowsCount(view.sheet);
  model.setFrozenRowsCount(view.sheet, current > 0 ? 0 : view.row);
}

export function freezeColumns(model: Model) {
  const view = model.getSelectedView();
  const current = model.getFrozenColumnsCount(view.sheet);
  model.setFrozenColumnsCount(view.sheet, current > 0 ? 0 : view.column);
}

// ── Clear ────────────────────────────────────

export function clearAll(model: Model) {
  const view = model.getSelectedView();
  const [r1, c1, r2, c2] = view.range;
  model.rangeClearAll(
    view.sheet,
    Math.min(r1, r2),
    Math.min(c1, c2),
    Math.max(r1, r2),
    Math.max(c1, c2),
  );
}

export function clearContents(model: Model) {
  const view = model.getSelectedView();
  const [r1, c1, r2, c2] = view.range;
  model.rangeClearContents(
    view.sheet,
    Math.min(r1, r2),
    Math.min(c1, c2),
    Math.max(r1, r2),
    Math.max(c1, c2),
  );
}

export function clearFormatting(model: Model) {
  const view = model.getSelectedView();
  const [r1, c1, r2, c2] = view.range;
  model.rangeClearFormatting(
    view.sheet,
    Math.min(r1, r2),
    Math.min(c1, c2),
    Math.max(r1, r2),
    Math.max(c1, c2),
  );
}

// ── Grid lines ───────────────────────────────

export function toggleGridLines(model: Model) {
  const sheet = model.getSelectedSheet();
  model.setShowGridLines(sheet, !model.getShowGridLines(sheet));
}

// ── Export ────────────────────────────────────

export function exportCSV(model: Model, filename: string) {
  const sheets = model.getWorksheetsProperties();
  const sheet = model.getSelectedSheet();

  // Build CSV from cell data
  let maxRow = 0;
  let maxCol = 0;

  // Find bounds by scanning for data
  for (let col = 1; col <= 100; col++) {
    const rows = model.getRowsWithData(sheet, col);
    if (rows.length > 0) {
      maxCol = col;
      for (const r of rows) {
        if (r > maxRow) maxRow = r;
      }
    }
  }

  if (maxRow === 0 || maxCol === 0) {
    // Empty sheet - export empty CSV
    downloadFile("", `${filename}.csv`, "text/csv");
    return;
  }

  const lines: string[] = [];
  for (let r = 1; r <= maxRow; r++) {
    const cells: string[] = [];
    for (let c = 1; c <= maxCol; c++) {
      let val = model.getFormattedCellValue(sheet, r, c);
      // Escape CSV values
      if (val.includes(",") || val.includes('"') || val.includes("\n")) {
        val = '"' + val.replace(/"/g, '""') + '"';
      }
      cells.push(val);
    }
    lines.push(cells.join(","));
  }

  const sheetName = sheets[sheet]?.name || "Sheet1";
  downloadFile(lines.join("\n"), `${filename} - ${sheetName}.csv`, "text/csv");
}

export function exportXLSX(model: Model, filename: string) {
  const sheets = model.getWorksheetsProperties();
  const wb = XLSX.utils.book_new();

  for (let s = 0; s < sheets.length; s++) {
    let maxRow = 0;
    let maxCol = 0;

    for (let col = 1; col <= 200; col++) {
      const rows = model.getRowsWithData(s, col);
      if (rows.length > 0) {
        maxCol = col;
        for (const r of rows) {
          if (r > maxRow) maxRow = r;
        }
      }
    }

    const data: string[][] = [];
    for (let r = 1; r <= maxRow; r++) {
      const row: string[] = [];
      for (let c = 1; c <= maxCol; c++) {
        row.push(model.getFormattedCellValue(s, r, c));
      }
      data.push(row);
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheets[s].name);
  }

  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  downloadFile(
    buf,
    `${filename}.xlsx`,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
}

function downloadFile(
  content: string | ArrayBuffer,
  filename: string,
  mimeType: string,
) {
  const blob =
    content instanceof ArrayBuffer
      ? new Blob([content], { type: mimeType })
      : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Query helpers (for toolbar state) ────────

export function getActiveStyle(model: Model) {
  return getActiveCellStyle(model);
}

export function getSelectedView(model: Model) {
  return model.getSelectedView();
}
