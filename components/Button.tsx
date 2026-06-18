import Link from "next/link";
import type { ReactNode, ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-amber-500 text-navy-950 hover:bg-amber-400 shadow-sm shadow-amber-900/10",
  secondary:
    "bg-white text-navy-900 border border-navy-900/15 hover:border-teal-600/40 hover:text-teal-700",
  ghost: "bg-transparent text-cream-50 border border-cream-50/30 hover:bg-cream-50/10",
};

interface SharedProps {
  variant?: Variant;
  size?: "sm" | "md";
  children: ReactNode;
  className?: string;
}

interface ButtonAsLink extends SharedProps {
  href: string;
}

interface ButtonAsButton
  extends SharedProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> {
  href?: undefined;
}

type ButtonProps = ButtonAsLink | ButtonAsButton;

export default function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 whitespace-nowrap";
  const sizeClasses = size === "sm" ? "px-4 py-2 text-sm" : "px-6 py-3 text-base";
  const classes = `${base} ${sizeClasses} ${variantClasses[variant]} ${className}`;

  if ("href" in props && props.href) {
    const { href } = props;
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  const buttonProps = props as Omit<ButtonAsButton, "href" | "variant" | "size" | "children" | "className">;

  return (
    <button className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
