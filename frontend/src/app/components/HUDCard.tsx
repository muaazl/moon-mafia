interface HUDCardProps {
  label: string;
  value: string | number;
  align?: "left" | "center" | "right";
}

export function HUDCard({ label, value, align = "left" }: HUDCardProps) {
  const alignStyles = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <div className={alignStyles[align]}>
      <div className="mb-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className="text-lg font-semibold text-foreground">{value}</div>
    </div>
  );
}
