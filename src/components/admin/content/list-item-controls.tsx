"use client";

import { ArrowDownIcon, ArrowUpIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

type ListItemControlsProps = {
  label: string;
  index: number;
  count: number;
  min?: number;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
};

/** Keyboard-accessible ↑ ↓ ✕ for a repeatable list item (no drag library). */
export function ListItemControls({
  label,
  index,
  count,
  min = 0,
  onMove,
  onRemove,
}: ListItemControlsProps) {
  function handleUp() {
    onMove(index, index - 1);
  }
  function handleDown() {
    onMove(index, index + 1);
  }
  function handleRemove() {
    onRemove(index);
  }

  return (
    <div className="flex shrink-0 items-center">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={handleUp}
        disabled={index === 0}
        aria-label={`Posunout ${label} nahoru`}
      >
        <ArrowUpIcon />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={handleDown}
        disabled={index === count - 1}
        aria-label={`Posunout ${label} dolů`}
      >
        <ArrowDownIcon />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={handleRemove}
        disabled={count <= min}
        aria-label={`Odebrat ${label}`}
      >
        <Trash2Icon />
      </Button>
    </div>
  );
}
