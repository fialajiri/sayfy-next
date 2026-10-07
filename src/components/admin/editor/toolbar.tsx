"use client";

import { useEditorState, type Editor } from "@tiptap/react";
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  EyeIcon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  HighlighterIcon,
  ImageIcon,
  InfoIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  PaperclipIcon,
  PilcrowIcon,
  QuoteIcon,
  Redo2Icon,
  RemoveFormattingIcon,
  StrikethroughIcon,
  SubscriptIcon,
  SuperscriptIcon,
  TableIcon,
  TriangleAlertIcon,
  UnderlineIcon,
  Undo2Icon,
  UnlinkIcon,
  WrapTextIcon,
  SquarePlayIcon,
} from "lucide-react";
import { ColorPicker } from "./color-picker";
import { commands } from "./commands";
import {
  handleToolbarKeyDown,
  ToolbarButton,
  ToolbarGroup,
} from "./toolbar-button";

export type ToolbarActions = {
  onLink: () => void;
  onImage: () => void;
  onAttachment: () => void;
  onYoutube: () => void;
  onTogglePreview: () => void;
  preview: boolean;
};

function useActiveState(editor: Editor) {
  return useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      sub: e.isActive("subscript"),
      sup: e.isActive("superscript"),
      highlight: e.isActive("highlight"),
      paragraph: e.isActive("paragraph"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      h4: e.isActive("heading", { level: 4 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      info: e.isActive("callout", { variant: "info" }),
      warning: e.isActive("callout", { variant: "warning" }),
      left: e.isActive({ textAlign: "left" }),
      center: e.isActive({ textAlign: "center" }),
      right: e.isActive({ textAlign: "right" }),
      justify: e.isActive({ textAlign: "justify" }),
      link: e.isActive("link"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
}

export function Toolbar({
  editor,
  actions,
}: {
  editor: Editor;
  actions: ToolbarActions;
}) {
  const s = useActiveState(editor);
  const cmd = commands(editor);
  const off = actions.preview;

  return (
    <div
      role="toolbar"
      aria-label="Formátování textu"
      onKeyDown={handleToolbarKeyDown}
      className="bg-card/95 sticky top-14 z-10 flex flex-wrap items-center gap-1.5 border-b p-1.5 backdrop-blur md:top-0"
    >
      <ToolbarGroup label="Písmo">
        <ToolbarButton
          label="Tučné"
          shortcut="⌘B"
          icon={BoldIcon}
          active={s.bold}
          disabled={off}
          onClick={cmd.bold}
        />
        <ToolbarButton
          label="Kurzíva"
          shortcut="⌘I"
          icon={ItalicIcon}
          active={s.italic}
          disabled={off}
          onClick={cmd.italic}
        />
        <ToolbarButton
          label="Podtržené"
          shortcut="⌘U"
          icon={UnderlineIcon}
          active={s.underline}
          disabled={off}
          onClick={cmd.underline}
        />
        <ToolbarButton
          label="Přeškrtnuté"
          icon={StrikethroughIcon}
          active={s.strike}
          disabled={off}
          onClick={cmd.strike}
        />
        <ToolbarButton
          label="Horní index"
          icon={SuperscriptIcon}
          active={s.sup}
          disabled={off}
          onClick={cmd.superscript}
        />
        <ToolbarButton
          label="Dolní index"
          icon={SubscriptIcon}
          active={s.sub}
          disabled={off}
          onClick={cmd.subscript}
        />
        <ColorPicker editor={editor} disabled={off} />
        <ToolbarButton
          label="Zvýraznit"
          icon={HighlighterIcon}
          active={s.highlight}
          disabled={off}
          onClick={cmd.highlight}
        />
        <ToolbarButton
          label="Zrušit formátování"
          icon={RemoveFormattingIcon}
          disabled={off}
          onClick={cmd.clearFormatting}
        />
      </ToolbarGroup>
      <ToolbarGroup label="Nadpisy">
        <ToolbarButton
          label="Odstavec"
          icon={PilcrowIcon}
          active={s.paragraph}
          disabled={off}
          onClick={cmd.paragraph}
        />
        <ToolbarButton
          label="Nadpis 2"
          icon={Heading2Icon}
          active={s.h2}
          disabled={off}
          onClick={cmd.h2}
        />
        <ToolbarButton
          label="Nadpis 3"
          icon={Heading3Icon}
          active={s.h3}
          disabled={off}
          onClick={cmd.h3}
        />
        <ToolbarButton
          label="Nadpis 4"
          icon={Heading4Icon}
          active={s.h4}
          disabled={off}
          onClick={cmd.h4}
        />
      </ToolbarGroup>
      <ToolbarGroup label="Odstavec">
        <ToolbarButton
          label="Odrážkový seznam"
          icon={ListIcon}
          active={s.bullet}
          disabled={off}
          onClick={cmd.bulletList}
        />
        <ToolbarButton
          label="Číslovaný seznam"
          icon={ListOrderedIcon}
          active={s.ordered}
          disabled={off}
          onClick={cmd.orderedList}
        />
        <ToolbarButton
          label="Zarovnat doleva"
          icon={AlignLeftIcon}
          active={s.left}
          disabled={off}
          onClick={cmd.alignLeft}
        />
        <ToolbarButton
          label="Zarovnat na střed"
          icon={AlignCenterIcon}
          active={s.center}
          disabled={off}
          onClick={cmd.alignCenter}
        />
        <ToolbarButton
          label="Zarovnat doprava"
          icon={AlignRightIcon}
          active={s.right}
          disabled={off}
          onClick={cmd.alignRight}
        />
        <ToolbarButton
          label="Zarovnat do bloku"
          icon={AlignJustifyIcon}
          active={s.justify}
          disabled={off}
          onClick={cmd.alignJustify}
        />
        <ToolbarButton
          label="Citace"
          icon={QuoteIcon}
          active={s.quote}
          disabled={off}
          onClick={cmd.blockquote}
        />
        <ToolbarButton
          label="Informační box"
          icon={InfoIcon}
          active={s.info}
          disabled={off}
          onClick={cmd.calloutInfo}
        />
        <ToolbarButton
          label="Upozornění"
          icon={TriangleAlertIcon}
          active={s.warning}
          disabled={off}
          onClick={cmd.calloutWarning}
        />
        <ToolbarButton
          label="Dělicí čára"
          icon={MinusIcon}
          disabled={off}
          onClick={cmd.horizontalRule}
        />
        <ToolbarButton
          label="Zalomení řádku"
          shortcut="⇧↵"
          icon={WrapTextIcon}
          disabled={off}
          onClick={cmd.hardBreak}
        />
      </ToolbarGroup>
      <ToolbarGroup label="Vložit">
        <ToolbarButton
          label="Obrázek"
          icon={ImageIcon}
          disabled={off}
          onClick={actions.onImage}
        />
        <ToolbarButton
          label="Soubor (PDF, Word, Excel)"
          icon={PaperclipIcon}
          disabled={off}
          onClick={actions.onAttachment}
        />
        <ToolbarButton
          label="Video z YouTube"
          icon={SquarePlayIcon}
          disabled={off}
          onClick={actions.onYoutube}
        />
        <ToolbarButton
          label="Odkaz"
          shortcut="⌘K"
          icon={LinkIcon}
          active={s.link}
          disabled={off}
          onClick={actions.onLink}
        />
        <ToolbarButton
          label="Odebrat odkaz"
          icon={UnlinkIcon}
          disabled={off || !s.link}
          onClick={cmd.unlink}
        />
        <ToolbarButton
          label="Tabulka"
          icon={TableIcon}
          disabled={off}
          onClick={cmd.insertTable}
        />
      </ToolbarGroup>
      <ToolbarGroup label="Historie">
        <ToolbarButton
          label="Zpět"
          shortcut="⌘Z"
          icon={Undo2Icon}
          disabled={off || !s.canUndo}
          onClick={cmd.undo}
        />
        <ToolbarButton
          label="Znovu"
          shortcut="⇧⌘Z"
          icon={Redo2Icon}
          disabled={off || !s.canRedo}
          onClick={cmd.redo}
        />
        <ToolbarButton
          label={actions.preview ? "Zpět k úpravám" : "Náhled"}
          icon={EyeIcon}
          active={actions.preview}
          onClick={actions.onTogglePreview}
        />
      </ToolbarGroup>
    </div>
  );
}
