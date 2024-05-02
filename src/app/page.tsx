"use client"
import { useCallback, useState } from "react";
import CustomForceGraph from "./forceGraphWrapper";

export default function Home() {
  const [graphSettings, setGraphSettings] = useState({ focusMode: false });
  const toggleFocus = useCallback(() => {
    setGraphSettings(prevSettings => ({ ...prevSettings, focusMode: !prevSettings.focusMode }))
  }, [setGraphSettings]);

  const Checkbox = ({ label, value, onChange }: { label: string, value: boolean, onChange: () => void }) => (
    <label>
      <input type="checkbox" checked={value} onChange={onChange} />
      {label}
    </label>
  );

  return (
    <main>
      <CustomForceGraph settings={graphSettings} />
      <div className="settings">
        <Checkbox label={"Focus Mode"} value={graphSettings.focusMode} onChange={toggleFocus} />
      </div>
    </main>
  );
}
