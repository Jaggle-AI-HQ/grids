import { useState, useRef, useEffect } from "react";
import type { Model } from "@ironcalc/workbook";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  WrapText,
  Undo2,
  Redo2,
  PaintBucket,
  Type,
  ChevronDown,
  Percent,
  DollarSign,
  Hash,
  Minus,
  Plus,
  Grid3X3,
  Paintbrush,
} from "lucide-react";
import * as actions from "../lib/toolbar-actions";
import styles from "./FormatToolbar.module.css";

interface FormatToolbarProps {
  model: Model;
  onRefresh: () => void;
}

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 36, 48, 72];

const FONTS = [
  "Inter",
  "Arial",
  "Calibri",
  "Courier New",
  "Georgia",
  "Helvetica",
  "Times New Roman",
  "Trebuchet MS",
  "Verdana",
];

const COLORS = [
  "#000000", "#434343", "#666666", "#999999", "#B7B7B7", "#CCCCCC", "#D9D9D9", "#EFEFEF", "#F3F3F3", "#FFFFFF",
  "#980000", "#FF0000", "#FF9900", "#FFFF00", "#00FF00", "#00FFFF", "#4A86E8", "#0000FF", "#9900FF", "#FF00FF",
  "#E6B8AF", "#F4CCCC", "#FCE5CD", "#FFF2CC", "#D9EAD3", "#D0E0E3", "#C9DAF8", "#CFE2F3", "#D9D2E9", "#EAD1DC",
  "#DD7E6B", "#EA9999", "#F9CB9C", "#FFE599", "#B6D7A8", "#A2C4C9", "#A4C2F4", "#9FC5E8", "#B4A7D6", "#D5A6BD",
  "#CC4125", "#E06666", "#F6B26B", "#FFD966", "#93C47D", "#76A5AF", "#6D9EEB", "#6FA8DC", "#8E7CC3", "#C27BA0",
  "#A61C00", "#CC0000", "#E69138", "#F1C232", "#6AA84F", "#45818E", "#3C78D8", "#3D85C6", "#674EA7", "#A64D79",
  "#85200C", "#990000", "#B45F06", "#BF9000", "#38761D", "#134F5C", "#1155CC", "#0B5394", "#351C75", "#741B47",
  "#5B0F00", "#660000", "#783F04", "#7F6000", "#274E13", "#0C343D", "#1C4587", "#073763", "#20124D", "#4C1130",
];

const NUMBER_FORMATS = [
  { label: "General", value: "general" },
  { label: "Number", value: "#,##0.00" },
  { label: "Currency ($)", value: '"$"#,##0.00' },
  { label: "Currency (EUR)", value: '"EUR"#,##0.00' },
  { label: "Percentage", value: "0.00%" },
  { label: "Date", value: 'dd"/"mm"/"yyyy' },
  { label: "Time", value: "h:mm:ss" },
  { label: "Plain text", value: "@" },
];

const BORDER_OPTIONS = [
  { label: "All borders", value: "All" },
  { label: "Outer borders", value: "Outer" },
  { label: "Inner borders", value: "Inner" },
  { label: "Top border", value: "Top" },
  { label: "Bottom border", value: "Bottom" },
  { label: "Left border", value: "Left" },
  { label: "Right border", value: "Right" },
  { label: "No borders", value: "None" },
];

export default function FormatToolbar({ model, onRefresh }: FormatToolbarProps) {
  const style = actions.getActiveStyle(model);

  const run = (fn: () => void) => {
    fn();
    onRefresh();
  };

  return (
    <div className={styles.toolbar}>
      {/* Undo / Redo */}
      <ToolbarButton
        icon={<Undo2 size={15} />}
        title="Undo (Ctrl+Z)"
        disabled={!model.canUndo()}
        onClick={() => run(() => model.undo())}
      />
      <ToolbarButton
        icon={<Redo2 size={15} />}
        title="Redo (Ctrl+Y)"
        disabled={!model.canRedo()}
        onClick={() => run(() => model.redo())}
      />

      <Divider />

      {/* Font family */}
      <DropdownSelect
        value={style.font.name || "Inter"}
        options={FONTS.map((f) => ({ label: f, value: f }))}
        onChange={(v) => run(() => actions.setFontFamily(model, v))}
        width={110}
        title="Font family"
      />

      {/* Font size */}
      <DropdownSelect
        value={String(style.font.sz || 11)}
        options={FONT_SIZES.map((s) => ({
          label: String(s),
          value: String(s),
        }))}
        onChange={(v) => run(() => actions.setFontSize(model, parseInt(v)))}
        width={52}
        title="Font size"
      />

      <Divider />

      {/* Bold / Italic / Underline / Strikethrough */}
      <ToolbarButton
        icon={<Bold size={15} />}
        title="Bold (Ctrl+B)"
        active={style.font.b}
        onClick={() => run(() => actions.toggleBold(model))}
      />
      <ToolbarButton
        icon={<Italic size={15} />}
        title="Italic (Ctrl+I)"
        active={style.font.i}
        onClick={() => run(() => actions.toggleItalic(model))}
      />
      <ToolbarButton
        icon={<Underline size={15} />}
        title="Underline (Ctrl+U)"
        active={style.font.u}
        onClick={() => run(() => actions.toggleUnderline(model))}
      />
      <ToolbarButton
        icon={<Strikethrough size={15} />}
        title="Strikethrough"
        active={style.font.strike}
        onClick={() => run(() => actions.toggleStrikethrough(model))}
      />

      <Divider />

      {/* Text color */}
      <ColorPicker
        icon={<Type size={15} />}
        title="Text color"
        currentColor={style.font.color || "#000000"}
        onSelect={(c) => run(() => actions.setFontColor(model, c))}
      />

      {/* Fill color */}
      <ColorPicker
        icon={<PaintBucket size={15} />}
        title="Fill color"
        currentColor={style.fill.fg_color || "#FFFFFF"}
        onSelect={(c) => run(() => actions.setFillColor(model, c))}
      />

      <Divider />

      {/* Borders */}
      <DropdownButton
        icon={<Grid3X3 size={15} />}
        title="Borders"
        items={BORDER_OPTIONS.map((b) => ({
          label: b.label,
          action: () =>
            run(() =>
              b.value === "None"
                ? actions.clearBorders(model)
                : actions.setBorder(model, b.value),
            ),
        }))}
      />

      <Divider />

      {/* Horizontal alignment */}
      <ToolbarButton
        icon={<AlignLeft size={15} />}
        title="Align left"
        active={style.alignment?.horizontal === "left"}
        onClick={() => run(() => actions.setHorizontalAlign(model, "left"))}
      />
      <ToolbarButton
        icon={<AlignCenter size={15} />}
        title="Align center"
        active={style.alignment?.horizontal === "center"}
        onClick={() => run(() => actions.setHorizontalAlign(model, "center"))}
      />
      <ToolbarButton
        icon={<AlignRight size={15} />}
        title="Align right"
        active={style.alignment?.horizontal === "right"}
        onClick={() => run(() => actions.setHorizontalAlign(model, "right"))}
      />

      <Divider />

      {/* Vertical alignment */}
      <ToolbarButton
        icon={<AlignVerticalJustifyStart size={15} />}
        title="Align top"
        active={style.alignment?.vertical === "top"}
        onClick={() => run(() => actions.setVerticalAlign(model, "top"))}
      />
      <ToolbarButton
        icon={<AlignVerticalJustifyCenter size={15} />}
        title="Align middle"
        active={style.alignment?.vertical === "center"}
        onClick={() => run(() => actions.setVerticalAlign(model, "center"))}
      />
      <ToolbarButton
        icon={<AlignVerticalJustifyEnd size={15} />}
        title="Align bottom"
        active={style.alignment?.vertical === "bottom"}
        onClick={() => run(() => actions.setVerticalAlign(model, "bottom"))}
      />

      <Divider />

      {/* Wrap text */}
      <ToolbarButton
        icon={<WrapText size={15} />}
        title="Wrap text"
        active={style.alignment?.wrap_text}
        onClick={() => run(() => actions.toggleWrapText(model))}
      />

      <Divider />

      {/* Number format shortcuts */}
      <DropdownButton
        icon={<Hash size={15} />}
        title="Number format"
        items={NUMBER_FORMATS.map((f) => ({
          label: f.label,
          action: () => run(() => actions.setNumberFormat(model, f.value)),
        }))}
      />
      <ToolbarButton
        icon={<DollarSign size={15} />}
        title="Currency format"
        onClick={() => run(() => actions.setNumberFormat(model, '"$"#,##0.00'))}
      />
      <ToolbarButton
        icon={<Percent size={15} />}
        title="Percent format"
        onClick={() => run(() => actions.setNumberFormat(model, "0.00%"))}
      />

      <Divider />

      {/* Insert / Delete */}
      <DropdownButton
        icon={<Plus size={15} />}
        title="Insert"
        items={[
          {
            label: "Row above",
            action: () => run(() => actions.insertRowAbove(model)),
          },
          {
            label: "Row below",
            action: () => run(() => actions.insertRowBelow(model)),
          },
          {
            label: "Column left",
            action: () => run(() => actions.insertColumnLeft(model)),
          },
          {
            label: "Column right",
            action: () => run(() => actions.insertColumnRight(model)),
          },
        ]}
      />
      <DropdownButton
        icon={<Minus size={15} />}
        title="Delete"
        items={[
          {
            label: "Delete row",
            action: () => run(() => actions.deleteRow(model)),
          },
          {
            label: "Delete column",
            action: () => run(() => actions.deleteColumn(model)),
          },
        ]}
      />

      <Divider />

      {/* Clear formatting */}
      <ToolbarButton
        icon={<Paintbrush size={15} />}
        title="Clear formatting"
        onClick={() => run(() => actions.clearFormatting(model))}
      />
    </div>
  );
}

// ── Sub-components ───────────────────────────

function ToolbarButton({
  icon,
  title,
  active,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className={`${styles.tbBtn} ${active ? styles.tbBtnActive : ""}`}
      title={title}
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick?.();
      }}
    >
      {icon}
    </button>
  );
}

function Divider() {
  return <div className={styles.divider} />;
}

function DropdownSelect({
  value,
  options,
  onChange,
  width,
  title,
}: {
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
  width: number;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className={styles.dropdownSelect} ref={ref} style={{ width }}>
      <button
        className={styles.selectTrigger}
        title={title}
        onMouseDown={(e) => {
          e.preventDefault();
          setOpen(!open);
        }}
      >
        <span className={styles.selectValue}>{value}</span>
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className={styles.selectDropdown}>
          {options.map((opt) => (
            <button
              key={opt.value}
              className={`${styles.selectOption} ${opt.value === value ? styles.selectOptionActive : ""}`}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DropdownButton({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: { label: string; action: () => void }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className={styles.dropdownBtnWrapper} ref={ref}>
      <button
        className={styles.tbBtn}
        title={title}
        onMouseDown={(e) => {
          e.preventDefault();
          setOpen(!open);
        }}
      >
        {icon}
        <ChevronDown size={10} />
      </button>
      {open && (
        <div className={styles.selectDropdown}>
          {items.map((item, i) => (
            <button
              key={i}
              className={styles.selectOption}
              onMouseDown={(e) => {
                e.preventDefault();
                item.action();
                setOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ColorPicker({
  icon,
  title,
  currentColor,
  onSelect,
}: {
  icon: React.ReactNode;
  title: string;
  currentColor: string;
  onSelect: (color: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className={styles.colorPickerWrapper} ref={ref}>
      <button
        className={styles.tbBtn}
        title={title}
        onMouseDown={(e) => {
          e.preventDefault();
          setOpen(!open);
        }}
      >
        {icon}
        <div
          className={styles.colorIndicator}
          style={{ backgroundColor: currentColor }}
        />
      </button>
      {open && (
        <div className={styles.colorGrid}>
          {COLORS.map((c) => (
            <button
              key={c}
              className={styles.colorSwatch}
              style={{ backgroundColor: c }}
              title={c}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(c);
                setOpen(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
