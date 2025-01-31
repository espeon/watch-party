import React, {
  FormEvent,
  KeyboardEventHandler,
  forwardRef,
  useLayoutEffect,
  useRef,
  useState,
  useEffect,
} from "react";

// Add these new imports

import type { Emoji } from "@/types";

const MIN_TEXTAREA_HEIGHT = 2;
const MAX_TEXTAREA_HEIGHT = 256;

export interface ExpandableInputProps {
  onSubmit: (value: string) => void;
  emojis: Emoji[];
}

const ExpandableInput = ({ onSubmit, emojis }: ExpandableInputProps) => {
  const [input, setInput] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  // Add these new states
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiIcon, setEmojiIcon] = useState("😊");
  const [cursorPosition, setCursorPosition] = useState<number>(0);

  const [showEmojiSuggestions, setShowEmojiSuggestions] = useState(false);
  const [emojiFilter, setEmojiFilter] = useState("");
  const [selectedEmojiIndex, setSelectedEmojiIndex] = useState(0);
  const [colonIndex, setColonIndex] = useState(-1);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const filteredEmojis = emojis
    .filter((emoji) =>
      emoji.name.toLowerCase().includes(emojiFilter.toLowerCase()),
    )
    .slice(0, 8); // Limit to 8 suggestions

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEmojiClick = (emoji: Emoji) => {
    if (!inputRef.current) return;

    const start = inputRef.current.selectionStart || 0;
    const end = inputRef.current.selectionEnd || 0;
    const emojiText = `:${emoji.name}:`;

    const newText =
      input.substring(0, start) + emojiText + input.substring(end);

    setInput(newText);
    setCursorPosition(start + emojiText.length);
    setShowEmojiPicker(false);
  };

  const insertEmojiFromSuggestion = (emoji: Emoji) => {
    if (!inputRef.current || colonIndex === -1) return;

    const beforeColon = input.substring(0, colonIndex);
    const afterFilter = input.substring(colonIndex + emojiFilter.length + 1);
    const newText = beforeColon + `:${emoji.name}:` + afterFilter;

    setInput(newText);
    setCursorPosition(colonIndex + emoji.name.length + 2);
    setShowEmojiSuggestions(false);
    setEmojiFilter("");
    setColonIndex(-1);
  };

  // Update cursor position after emoji insertion
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.selectionStart = cursorPosition;
      inputRef.current.selectionEnd = cursorPosition;
    }
  }, [cursorPosition]);

  // Define a function to handle the click event
  const handleOuterFocus = (e: any) => {
    // Set the focus state to true
    setInputFocused(true);

    // Focus on the textbox element
    if (inputRef.current != null) inputRef.current.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.currentTarget.value;
    setInput(newValue);

    const cursorPos = e.currentTarget.selectionStart || 0;
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastColonIndex = textBeforeCursor.lastIndexOf(":");

    if (lastColonIndex !== -1 && lastColonIndex === colonIndex) {
      // Update emoji filter
      const filterText = textBeforeCursor.substring(lastColonIndex + 1);
      setEmojiFilter(filterText);
      setShowEmojiSuggestions(true);
    } else if (newValue[cursorPos - 1] === ":") {
      // Start new emoji filtering
      setColonIndex(cursorPos - 1);
      setEmojiFilter("");
      setShowEmojiSuggestions(true);
      setSelectedEmojiIndex(0);
    } else {
      setShowEmojiSuggestions(false);
      setEmojiFilter("");
      setColonIndex(-1);
    }
  };

  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (showEmojiSuggestions && filteredEmojis.length > 0) {
      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          setSelectedEmojiIndex((prev) =>
            prev > 0 ? prev - 1 : filteredEmojis.length - 1,
          );
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedEmojiIndex((prev) =>
            prev < filteredEmojis.length - 1 ? prev + 1 : 0,
          );
          break;
        case "Enter":
          e.preventDefault();
          insertEmojiFromSuggestion(filteredEmojis[selectedEmojiIndex]);
          break;
        case "Escape":
          setShowEmojiSuggestions(false);
          break;
        case "Tab":
          e.preventDefault();
          insertEmojiFromSuggestion(filteredEmojis[selectedEmojiIndex]);
          break;
      }
    } else if (e.key === "Enter") {
      if (e.shiftKey) {
        setInput((prev) => prev + "\n");
      } else {
        // handle submit
        e.preventDefault();
        if (input === "") return;
        onSubmit(input);
        setInput("");
      }
    }
  };

  useLayoutEffect(() => {
    if (!inputRef.current) return;

    // Reset height - important to shrink on delete
    inputRef.current.style.height = "inherit";
    // Set height
    inputRef.current.style.height = `${Math.min(
      inputRef.current.scrollHeight,
      MAX_TEXTAREA_HEIGHT,
    )}px`;

    if (
      inputRef.current.scrollHeight > 32 &&
      inputRef.current.scrollHeight < 48
    ) {
      inputRef.current.style.height = `24px`;
    }
  }, [input]);

  return (
    <div className="align-self-end flex w-full sticky bottom-0">
      <div
        className={`w-full max-w-full h-auto min-h-fit pr-2 border-none p-2 rounded-lg 
                focus:shadow-outline bg-slate-100 dark:bg-slate-900 ${
                  inputFocused
                    ? "outline-2 -outline-offset-2 outline-violet-300 dark:outline-violet-400 transition-all duration-75"
                    : ""
                }`}
        onClick={handleOuterFocus}
      >
        <textarea
          value={input}
          onKeyDown={handleKeyDown}
          onChange={handleInputChange}
          className="w-full px-3 my-2 mb-0.5for pr-8 text-base bg-slate-100 dark:bg-slate-900 placeholder-gray-600 text-gray-900 dark:text-slate-100 focus outline-none border-none"
          placeholder="Blaze your glory!"
          ref={inputRef}
          onBlur={() => setInputFocused(false)}
          onFocus={() => setInputFocused(true)}
          rows={1}
          style={{
            minHeight: `${MIN_TEXTAREA_HEIGHT}px`,
            height: "auto",
            resize: "none",
          }}
        />

        {/* Emoji Button */}
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          onMouseOver={() => setEmojiIcon("😊")}
          className="absolute right-2 top-3 p-1 rounded hover:bg-gray-200 hover:scale-105 transition-all duration-150 ease-out dark:hover:bg-gray-700"
        >
          {emojiIcon.startsWith("http") ? (
            <img src={emojiIcon} alt="emoji" className="w-6 h-6" />
          ) : (
            emojiIcon
          )}
        </button>
      </div>

      {/* Emoji Suggestions Popup */}
      {showEmojiSuggestions &&
        !showEmojiPicker &&
        filteredEmojis.length > 0 && (
          <div className="absolute w-full left-0 bottom-full mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 z-50">
            <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
              Emojis matching{" "}
              <span className="font-semibold">{emojiFilter}</span>
            </p>
            {filteredEmojis.map((emoji, index) => (
              <div
                key={emoji.url}
                className={`flex items-center gap-2 px-3 py-1 cursor-pointer rounded-md ${
                  index === selectedEmojiIndex
                    ? "bg-violet-100 dark:bg-violet-900"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                onClick={() => insertEmojiFromSuggestion(emoji)}
              >
                <img src={emoji.url} alt={emoji.name} className="w-6 h-6" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {emoji.name}
                </span>
              </div>
            ))}
          </div>
        )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          className="absolute w-full max-w-md bottom-full mb-2 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 z-50"
        >
          <div className="grid grid-cols-8 gap-1 max-h-[200px] overflow-y-auto">
            {emojis.map((emoji) => (
              <button
                key={emoji.url}
                onClick={() => handleEmojiClick(emoji)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <img
                  src={emoji.url}
                  alt={emoji.name}
                  className="w-full object-contain"
                  title={emoji.name}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpandableInput;
