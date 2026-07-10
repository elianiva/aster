import { useState, useRef, useCallback } from "react";

export function useToolExpand(isStreaming: boolean) {
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const prevStreaming = useRef(isStreaming);
  const userToggled = useRef(false);

  // Sync streaming state (runs during render, matching original behavior)
  if (isStreaming && !prevStreaming.current) userToggled.current = false;
  prevStreaming.current = isStreaming;

  // Collapse when streaming ends (if user hasn't manually toggled)
  if (!isStreaming && !userToggled.current && expandedTool !== null) {
    setExpandedTool(null);
  }

  const toggleTool = useCallback((toolId: string) => {
    userToggled.current = true;
    setExpandedTool((prev) => (prev === toolId ? null : toolId));
  }, []);

  return { expandedTool, toggleTool, userToggled };
}
