interface Props {
  className?: string;
  light?: boolean;
}

const BAR_COLORS = ["#FB7185", "#FBBF24", "#34D399"];

export default function MarginsLogo({ className = "", light = false }: Props) {
  return (
    <span className={`inline-flex items-center gap-2 select-none ${className}`}>
      <span className="flex items-center gap-[3px]">
        {BAR_COLORS.map((color) => (
          <span
            key={color}
            className="block w-[3px] rounded-full"
            style={{ height: "0.75em", backgroundColor: color }}
          />
        ))}
      </span>
      <span
        className="font-extrabold tracking-tight"
        style={
          light
            ? { color: "#fff" }
            : {
                background: "linear-gradient(90deg, #FB7185 0%, #E11D48 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }
        }
      >
        [margins]
      </span>
    </span>
  );
}
