"use client"
import { useCallback, useState } from "react";
import CustomForceGraph from "./forceGraphWrapper";
import Gun from "gun";

export default function Home() {
  const [graphSettings, setGraphSettings] = useState({ focusMode: false });
  const toggleFocus = useCallback(() => {
    setGraphSettings(prevSettings => ({ ...prevSettings, focusMode: !prevSettings.focusMode }))
  }, [setGraphSettings]);

  const gun = Gun();

  const Checkbox = ({ label, value, onChange }: { label: string, value: boolean, onChange: () => void }) => (
    <label>
      <input type="checkbox" checked={value} onChange={onChange} />
      {label}
    </label>
  );

  return (
    <main>
      <CustomForceGraph settings={graphSettings} gun={gun} />
      <div className="settings">

        {/* <div className="searchbox">Top Gun Bar</div> */}
        <Checkbox label={"Focus Mode"} value={graphSettings.focusMode} onChange={toggleFocus} />
      </div>
    </main>
  );
}
