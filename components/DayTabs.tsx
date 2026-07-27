"use client";

export type DayGroup = {
  key: string;
  label: string;
};

type Props = {
  days: DayGroup[];
  selected: string;
  onSelect: (key: string) => void;
};

export default function DayTabs({ days, selected, onSelect }: Props) {
  return (
    <div className="day-tabs">
      {days.map((d) => (
        <button
          key={d.key}
          className={d.key === selected ? "active" : ""}
          onClick={() => onSelect(d.key)}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}
