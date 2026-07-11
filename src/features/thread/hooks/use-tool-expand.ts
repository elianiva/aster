import { useState, useRef, useCallback, useEffect } from "react";

export function useToolExpand(isStreaming: boolean) {
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const prevStreaming = useRef(isStreaming);
  const userToggled = useRef(false);

  useEffect(() => {
    if (isStreaming && !prevStreaming.current) {
      userToggled.current = false;
    }
    prevStreaming.current = isStreaming;
  }, [isStreaming]);

  useEffect(() => {
    if (!isStreaming && !userToggled.current && expandedTool !== null) {
      setExpandedTool(null);
    }
  }, [isStreaming, expandedTool]);

  const toggleTool = useCallback((toolId: string) => {
    userToggled.current = true;
    setExpandedTool((prev) => (prev === toolId ? null : toolId));
  }, []);

  return { expandedTool, toggleTool, userToggled };
}
