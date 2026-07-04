import Image from "next/image";

interface Props {
  width?: number;
  className?: string;
}

export default function SinonWordmark({ width = 160, className = "" }: Props) {
  const height = Math.round(width * (232 / 1075));
  return (
    <Image
      src="/sinon-logo.png"
      alt="Sinon Learning"
      width={width}
      height={height}
      priority
      style={{ width, height: "auto" }}
      className={className}
    />
  );
}
