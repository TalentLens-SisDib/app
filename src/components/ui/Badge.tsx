import type {HTMLAttributes, JSX} from "react";

export type BadgeVariant =
	| "neutral"
	| "primary"
	| "secondary"
	| "accent"
	| "info"
	| "success"
	| "warning"
	| "error"
	| "ghost"
	| "outline";

export type BadgeSize = "xs" | "sm" | "md" | "lg";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
	variant?: BadgeVariant;
	size?: BadgeSize;
};

const variantClass: Record<BadgeVariant, string> = {
	neutral: "badge-neutral",
	primary: "badge-primary",
	secondary: "badge-secondary",
	accent: "badge-accent",
	info: "badge-info",
	success: "badge-success",
	warning: "badge-warning",
	error: "badge-error",
	ghost: "badge-ghost",
	outline: "badge-outline",
};

const sizeClass: Record<BadgeSize, string> = {
	xs: "badge-xs",
	sm: "badge-sm",
	md: "badge-md",
	lg: "badge-lg",
};

export default function Badge({
	variant = "neutral",
	size = "md",
	className,
	children,
	...rest
}: BadgeProps): JSX.Element {
	return (
		<span
			className={["badge", variantClass[variant], sizeClass[size], className]
				.filter(Boolean)
				.join(" ")}
			{...rest}>
			{children}
		</span>
	);
}
