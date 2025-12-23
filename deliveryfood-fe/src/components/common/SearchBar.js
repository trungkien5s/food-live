// src/components/common/SearchBar.jsx
import { useEffect, useRef, useState } from "react";
import { AutoComplete, Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { fetchSuggestions } from "../../api/seacrhApi";

export default function SearchBar({
  placeholder = "Tìm kiếm...",
  onSearch,
  size = "middle",            // "large" | "middle" | "small" => chúng ta sẽ điều chỉnh height
  borderColor = "#16a34a",
  defaultValue = "",
  enableSuggest = true,
  minChars = 2,
  debounceMs = 250,
  style = {},                 // style cho wrapper
}) {
  const [q, setQ] = useState(defaultValue);
  const [focused, setFocused] = useState(false);
  const [options, setOptions] = useState([]);
  const ctrlRef = useRef(null);
  const timerRef = useRef(null);

  // Map size -> inputHeight (px)
  const inputHeights = { large: 44, middle: 38, small: 32 };
  const inputHeight = inputHeights[size] || 38;
  const inputFontSize = size === "large" ? 16 : size === "small" ? 13 : 14;

  useEffect(() => {
    if (!enableSuggest) return;
    const text = q.trim();

    if (timerRef.current) clearTimeout(timerRef.current);
    if (text.length < minChars) {
      setOptions([]);
      return;
    }

    timerRef.current = setTimeout(async () => {
      try {
        ctrlRef.current?.abort?.();
        ctrlRef.current = new AbortController();
        const list = await fetchSuggestions(text, ctrlRef.current.signal);
        setOptions(
          (list || []).slice(0, 8).map((s) => ({ value: s.text, label: s.text }))
        );
      } catch (e) {
        // ignore
      }
    }, debounceMs);

    return () => {
      clearTimeout(timerRef.current);
      ctrlRef.current?.abort?.();
    };
  }, [q, enableSuggest, minChars, debounceMs]);

  const commitSearch = () => {
    const text = q.trim();
    if (!text) return;
    onSearch?.(text);
  };

  // shared input style to ensure stable height (prevents header jump)
  const inputStyle = {
    height: inputHeight,
    lineHeight: `${inputHeight}px`,
    fontSize: inputFontSize,
    boxSizing: "border-box",
    paddingInline: 12,
    borderRadius: 8,
    ...(style?.input || {}),
  };

  // wrapper style for AutoComplete
  const wrapperStyle = {
    width: "100%",
    maxWidth: 520,
    ...style,
  };

  // affix wrapper custom shadow on focus: we can't directly set affixWrapper via prop reliably,
  // so apply a boxShadow to the input when focused.
  const focusedStyle = focused
    ? { boxShadow: `0 0 0 4px ${borderColor}20` } // 20 = ~12% opacity
    : {};

  return (
    <AutoComplete
      value={q}
      onChange={setQ}
      options={options}
      onSelect={(val) => {
        setQ(val);
        onSearch?.(val);
      }}
      style={wrapperStyle}
    >
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onPressEnter={commitSearch}
        placeholder={placeholder}
        allowClear
        size={size === "large" ? "large" : size === "small" ? "small" : "middle"}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ ...inputStyle, ...focusedStyle }}
        suffix={
          <SearchOutlined
            onClick={commitSearch}
            style={{ cursor: "pointer", lineHeight: "normal" }}
          />
        }
      />
    </AutoComplete>
  );
}
