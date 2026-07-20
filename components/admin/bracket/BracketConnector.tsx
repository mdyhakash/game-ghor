import type { CSSProperties } from "react";

interface BracketConnectorProps {
  lines: { key: string; style: CSSProperties }[];
}

export default function BracketConnector({ lines }: BracketConnectorProps) {
  return (
    <>
      {lines.map((l) => (
        <div key={l.key} style={l.style} />
      ))}
    </>
  );
}
