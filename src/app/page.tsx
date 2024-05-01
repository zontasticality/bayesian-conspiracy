"use client"
import { useCallback, useState } from "react";
import CustomForceGraph from "./forceGraphWrapper";

export default function Home() {
  const [focusMode, setFocusMode] = useState(false);
  const toggleFocus = useCallback(() => { setFocusMode(!focusMode) }, [setFocusMode, focusMode]);

  const Checkbox = ({ label, value, onChange }: any) => (
    <label>
      <input type="checkbox" checked={value} onChange={onChange} />
      {label}
    </label>
  );

  return (<main>
    <CustomForceGraph />
    <div className="settings">
      <Checkbox label={"Focus Mode"} value={focusMode} onChange={toggleFocus} />
    </div>

  </main>);
}
