import { useState, useRef, useEffect } from "preact/hooks";
import {
  ColorPicker,
  useColor,
  ColorService,
  IColor,
} from "react-color-palette";
import "react-color-palette/css";
import { Button } from "@/components/ui/button";

interface PickColorButtonProps {
  color: string;
  onChange: (color: string) => void;
}

const DEFAULT_COLORS = [
  "#E4C5C5", // Soft pink
  "#C5D5E4", // Powder blue
  "#D5E4C5", // Sage green
  "#E4DFC5", // Cream
  "#D5C5E4", // Lavender
  "#C5E4DF", // Mint
  "#6366F1", // Indigo
  "#EC4899", // Pink
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#8B5CF6", // Purple
  "#EF4444", // Red
];

export function toIColor(color: string): IColor {
  return ColorService.convert("hex", color);
}

export function PickColorButton(props: PickColorButtonProps) {
  const [color, setColor] = useColor(props.color);
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    props.onChange(color.hex);
  }, [color]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setShowPicker(false);
      }
    }

    // Add event listener when the picker is shown
    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Cleanup the event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPicker]);

  return (
    <div className="relative flex gap-2">
      <Button
        onClick={() => setShowPicker(!showPicker)}
        style={{ backgroundColor: color.hex }}
      >
        Pick Color
      </Button>
      {showPicker && (
        <div
          ref={pickerRef}
          className="top-12 left-0 absolute bg-card rounded-xl shadow-lg border"
        >
          <div className="grid grid-cols-6 place-items-center gap-2 p-2">
            {" "}
            {DEFAULT_COLORS.map((c) => (
              <div
                className="h-6 w-6 rounded-xl cursor-pointer"
                style={{ backgroundColor: c }}
                onClick={() => setColor(toIColor(c))}
              />
            ))}
          </div>
          <ColorPicker
            color={color}
            hideInput={["rgb", "hsv"]}
            onChange={setColor}
          />
        </div>
      )}
    </div>
  );
}
