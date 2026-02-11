import { useState, useRef, useEffect, useCallback } from "react";
import type { Model } from "@ironcalc/workbook";
import * as actions from "../lib/toolbar-actions";
import styles from "./MenuBar.module.css";

interface MenuBarProps {
  model: Model;
  title: string;
  onSave: () => void;
  onRefresh: () => void;
}

interface MenuItem {
  label: string;
  shortcut?: string;
  action?: () => void;
  divider?: boolean;
  disabled?: boolean;
  submenu?: MenuItem[];
}

export default function MenuBar({
  model,
  title,
  onSave,
  onRefresh,
}: MenuBarProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);

  const run = useCallback(
    (fn: () => void) => {
      fn();
      onRefresh();
      setOpenMenu(null);
    },
    [onRefresh],
  );

  const menus: Record<string, MenuItem[]> = {
    File: [
      { label: "Save", shortcut: "Ctrl+S", action: () => run(onSave) },
      { label: "", divider: true },
      {
        label: "Export as CSV",
        action: () => run(() => actions.exportCSV(model, title)),
      },
      {
        label: "Export as XLSX",
        action: () => run(() => actions.exportXLSX(model, title)),
      },
    ],
    Edit: [
      {
        label: "Undo",
        shortcut: "Ctrl+Z",
        action: () => run(() => model.undo()),
        disabled: !model.canUndo(),
      },
      {
        label: "Redo",
        shortcut: "Ctrl+Y",
        action: () => run(() => model.redo()),
        disabled: !model.canRedo(),
      },
      { label: "", divider: true },
      { label: "Clear contents", action: () => run(() => actions.clearContents(model)) },
      { label: "Clear formatting", action: () => run(() => actions.clearFormatting(model)) },
      { label: "Clear all", action: () => run(() => actions.clearAll(model)) },
    ],
    View: [
      {
        label: "Toggle grid lines",
        action: () => run(() => actions.toggleGridLines(model)),
      },
      { label: "", divider: true },
      {
        label: "Freeze rows",
        action: () => run(() => actions.freezeRows(model)),
      },
      {
        label: "Freeze columns",
        action: () => run(() => actions.freezeColumns(model)),
      },
    ],
    Insert: [
      {
        label: "Row above",
        action: () => run(() => actions.insertRowAbove(model)),
      },
      {
        label: "Row below",
        action: () => run(() => actions.insertRowBelow(model)),
      },
      { label: "", divider: true },
      {
        label: "Column left",
        action: () => run(() => actions.insertColumnLeft(model)),
      },
      {
        label: "Column right",
        action: () => run(() => actions.insertColumnRight(model)),
      },
    ],
    Format: [
      {
        label: "Bold",
        shortcut: "Ctrl+B",
        action: () => run(() => actions.toggleBold(model)),
      },
      {
        label: "Italic",
        shortcut: "Ctrl+I",
        action: () => run(() => actions.toggleItalic(model)),
      },
      {
        label: "Underline",
        shortcut: "Ctrl+U",
        action: () => run(() => actions.toggleUnderline(model)),
      },
      {
        label: "Strikethrough",
        action: () => run(() => actions.toggleStrikethrough(model)),
      },
      { label: "", divider: true },
      {
        label: "Number format",
        submenu: [
          {
            label: "General",
            action: () => run(() => actions.setNumberFormat(model, "general")),
          },
          {
            label: "Number",
            action: () =>
              run(() => actions.setNumberFormat(model, "#,##0.00")),
          },
          {
            label: "Currency ($)",
            action: () =>
              run(() => actions.setNumberFormat(model, '"$"#,##0.00')),
          },
          {
            label: "Currency (EUR)",
            action: () =>
              run(() => actions.setNumberFormat(model, '"EUR"#,##0.00')),
          },
          {
            label: "Percentage",
            action: () => run(() => actions.setNumberFormat(model, "0.00%")),
          },
          {
            label: "Date",
            action: () =>
              run(() =>
                actions.setNumberFormat(model, 'dd"/"mm"/"yyyy'),
              ),
          },
        ],
      },
      { label: "", divider: true },
      {
        label: "Alignment",
        submenu: [
          {
            label: "Align left",
            action: () =>
              run(() => actions.setHorizontalAlign(model, "left")),
          },
          {
            label: "Align center",
            action: () =>
              run(() => actions.setHorizontalAlign(model, "center")),
          },
          {
            label: "Align right",
            action: () =>
              run(() => actions.setHorizontalAlign(model, "right")),
          },
          { label: "", divider: true },
          {
            label: "Align top",
            action: () =>
              run(() => actions.setVerticalAlign(model, "top")),
          },
          {
            label: "Align middle",
            action: () =>
              run(() => actions.setVerticalAlign(model, "center")),
          },
          {
            label: "Align bottom",
            action: () =>
              run(() => actions.setVerticalAlign(model, "bottom")),
          },
        ],
      },
      {
        label: "Wrap text",
        action: () => run(() => actions.toggleWrapText(model)),
      },
    ],
    Data: [
      {
        label: "Delete row",
        action: () => run(() => actions.deleteRow(model)),
      },
      {
        label: "Delete column",
        action: () => run(() => actions.deleteColumn(model)),
      },
    ],
  };

  // Close on outside click
  useEffect(() => {
    if (!openMenu) return;
    function handleClick(e: MouseEvent) {
      if (
        menuBarRef.current &&
        !menuBarRef.current.contains(e.target as Node)
      ) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openMenu]);

  // Close on Escape
  useEffect(() => {
    if (!openMenu) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenMenu(null);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [openMenu]);

  return (
    <nav className={styles.menuBar} ref={menuBarRef}>
      {Object.entries(menus).map(([label, items]) => (
        <div key={label} className={styles.menuWrapper}>
          <button
            className={`${styles.menuTrigger} ${openMenu === label ? styles.menuTriggerActive : ""}`}
            onMouseDown={(e) => {
              e.preventDefault();
              setOpenMenu(openMenu === label ? null : label);
            }}
            onMouseEnter={() => {
              if (openMenu && openMenu !== label) setOpenMenu(label);
            }}
          >
            {label}
          </button>
          {openMenu === label && (
            <MenuDropdown items={items} onClose={() => setOpenMenu(null)} />
          )}
        </div>
      ))}
    </nav>
  );
}

function MenuDropdown({
  items,
  onClose,
}: {
  items: MenuItem[];
  onClose: () => void;
}) {
  return (
    <div className={styles.dropdown}>
      {items.map((item, i) =>
        item.divider ? (
          <div key={i} className={styles.divider} />
        ) : item.submenu ? (
          <SubMenu key={i} item={item} onClose={onClose} />
        ) : (
          <button
            key={i}
            className={styles.menuItem}
            disabled={item.disabled}
            onMouseDown={(e) => {
              e.preventDefault();
              if (!item.disabled) {
                item.action?.();
                onClose();
              }
            }}
          >
            <span className={styles.menuItemLabel}>{item.label}</span>
            {item.shortcut && (
              <span className={styles.menuItemShortcut}>{item.shortcut}</span>
            )}
          </button>
        ),
      )}
    </div>
  );
}

function SubMenu({
  item,
  onClose,
}: {
  item: MenuItem;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={styles.submenuWrapper}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button className={styles.menuItem}>
        <span className={styles.menuItemLabel}>{item.label}</span>
        <span className={styles.submenuArrow}>&#9656;</span>
      </button>
      {open && <MenuDropdown items={item.submenu!} onClose={onClose} />}
    </div>
  );
}
