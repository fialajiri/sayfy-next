"use client";

import { useEditorState, type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BetweenHorizontalEndIcon,
  BetweenHorizontalStartIcon,
  BetweenVerticalEndIcon,
  BetweenVerticalStartIcon,
  ExternalLinkIcon,
  PencilIcon,
  ReplaceIcon,
  TableCellsMergeIcon,
  Trash2Icon,
  UnlinkIcon,
  PanelTopIcon,
  PanelLeftIcon,
  Columns3Icon,
  Rows3Icon,
  TextIcon,
} from "lucide-react";
import type { MouseEvent } from "react";
import { commands } from "./commands";
import {
  IMAGE_WIDTHS,
  type ImageAlign,
  type ImageWidth,
} from "./extensions/figure-image";
import { ToolbarButton } from "./toolbar-button";

const SURFACE =
  "light bg-popover text-popover-foreground shadow-float flex flex-wrap items-center gap-0.5 rounded-lg border p-1";
const WIDTH_LABEL: Record<ImageWidth, string> = {
  "33": "malý",
  "50": "střední",
  "75": "velký",
  "100": "celá šířka",
};

type ImageMenuProps = {
  editor: Editor;
  onEditDetails: () => void;
  onReplace: () => void;
};

export function ImageBubbleMenu({
  editor,
  onEditDetails,
  onReplace,
}: ImageMenuProps) {
  const attrs = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e.getAttributes("image") as {
        width?: string;
        align?: string;
        alt?: string;
      },
  });
  const set = (value: Partial<{ width: ImageWidth; align: ImageAlign }>) =>
    editor.chain().focus().updateAttributes("image", value).run();

  function handleWidth(event: MouseEvent<HTMLButtonElement>) {
    set({ width: event.currentTarget.dataset.width as ImageWidth });
  }
  function handleAlignLeft() {
    set({ align: "left" });
  }
  function handleAlignCenter() {
    set({ align: "center" });
  }
  function handleAlignRight() {
    set({ align: "right" });
  }
  function handleDelete() {
    editor.chain().focus().deleteSelection().run();
  }

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="imageMenu"
      shouldShow={({ editor: e }) => e.isActive("image")}
      className={SURFACE}
    >
      <ToolbarButton
        label={attrs.alt ? "Popis a popisek" : "Doplnit popis (chybí)"}
        icon={TextIcon}
        active={!attrs.alt}
        onClick={onEditDetails}
      />
      <ToolbarButton
        label="Vyměnit obrázek"
        icon={ReplaceIcon}
        onClick={onReplace}
      />
      <span className="bg-border mx-1 h-6 w-px" aria-hidden="true" />
      {IMAGE_WIDTHS.map((width) => (
        <button
          key={width}
          type="button"
          data-width={width}
          onClick={handleWidth}
          aria-pressed={attrs.width === width}
          className="hover:bg-muted aria-pressed:bg-sayfy-700/15 aria-pressed:text-sayfy-700 h-9 rounded-md px-2 text-xs font-medium"
        >
          {WIDTH_LABEL[width]}
        </button>
      ))}
      <span className="bg-border mx-1 h-6 w-px" aria-hidden="true" />
      <ToolbarButton
        label="Vlevo, text obtéká"
        icon={AlignLeftIcon}
        active={attrs.align === "left"}
        onClick={handleAlignLeft}
      />
      <ToolbarButton
        label="Na střed"
        icon={AlignCenterIcon}
        active={attrs.align === "center"}
        onClick={handleAlignCenter}
      />
      <ToolbarButton
        label="Vpravo, text obtéká"
        icon={AlignRightIcon}
        active={attrs.align === "right"}
        onClick={handleAlignRight}
      />
      <ToolbarButton
        label="Smazat obrázek"
        icon={Trash2Icon}
        onClick={handleDelete}
      />
    </BubbleMenu>
  );
}

export function LinkBubbleMenu({
  editor,
  onEdit,
}: {
  editor: Editor;
  onEdit: () => void;
}) {
  const href = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      (e.getAttributes("link").href as string | undefined) ?? "",
  });
  const cmd = commands(editor);

  function handleOpen() {
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="linkMenu"
      shouldShow={({ editor: e, from, to }) =>
        e.isActive("link") && from === to
      }
      className={SURFACE}
    >
      <span className="text-muted-foreground max-w-56 truncate px-2 text-xs">
        {href}
      </span>
      <ToolbarButton label="Upravit odkaz" icon={PencilIcon} onClick={onEdit} />
      <ToolbarButton
        label="Otevřít odkaz"
        icon={ExternalLinkIcon}
        onClick={handleOpen}
      />
      <ToolbarButton
        label="Odebrat odkaz"
        icon={UnlinkIcon}
        onClick={cmd.unlink}
      />
    </BubbleMenu>
  );
}

export function TableBubbleMenu({ editor }: { editor: Editor }) {
  const cmd = commands(editor);
  return (
    <BubbleMenu
      editor={editor}
      pluginKey="tableMenu"
      shouldShow={({ editor: e }) =>
        e.isActive("table") && !e.isActive("image")
      }
      options={{ placement: "top" }}
      className={SURFACE}
    >
      <ToolbarButton
        label="Sloupec vlevo"
        icon={BetweenVerticalStartIcon}
        onClick={cmd.addColumnBefore}
      />
      <ToolbarButton
        label="Sloupec vpravo"
        icon={BetweenVerticalEndIcon}
        onClick={cmd.addColumnAfter}
      />
      <ToolbarButton
        label="Smazat sloupec"
        icon={Columns3Icon}
        onClick={cmd.deleteColumn}
      />
      <ToolbarButton
        label="Řádek nad"
        icon={BetweenHorizontalStartIcon}
        onClick={cmd.addRowBefore}
      />
      <ToolbarButton
        label="Řádek pod"
        icon={BetweenHorizontalEndIcon}
        onClick={cmd.addRowAfter}
      />
      <ToolbarButton
        label="Smazat řádek"
        icon={Rows3Icon}
        onClick={cmd.deleteRow}
      />
      <ToolbarButton
        label="Sloučit / rozdělit buňky"
        icon={TableCellsMergeIcon}
        onClick={cmd.mergeOrSplit}
      />
      <ToolbarButton
        label="Záhlaví – řádek"
        icon={PanelTopIcon}
        onClick={cmd.toggleHeaderRow}
      />
      <ToolbarButton
        label="Záhlaví – sloupec"
        icon={PanelLeftIcon}
        onClick={cmd.toggleHeaderColumn}
      />
      <ToolbarButton
        label="Smazat tabulku"
        icon={Trash2Icon}
        onClick={cmd.deleteTable}
      />
    </BubbleMenu>
  );
}
