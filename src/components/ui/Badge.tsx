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

/*
 * Tons sutis (fundo claro + borda + texto escuro) com significado:
 * azul = informação/destaque, verde = sucesso, âmbar = atenção, vermelho = erro,
 * cinza = neutro. Nada de fundo sólido — o badge não compete com botões.
 */
const variantClass: Record<BadgeVariant, string> = {
	neutral: "tl-chip-neutral",
	ghost: "tl-chip-neutral",
	primary: "border-primary/15 bg-primary/8 text-primary",
	info: "border-primary/15 bg-primary/8 text-primary",
	secondary: "border-secondary/15 bg-secondary/8 text-secondary",
	accent: "border-accent/25 bg-accent/10 text-[color-mix(in_oklab,var(--color-accent)_70%,black)]",
	success: "tl-chip-ok",
	warning: "tl-chip-attn",
	error: "tl-chip-err",
	outline: "border-base-300 bg-transparent text-base-content/65",
};

const sizeClass: Record<BadgeSize, string> = {
	xs: "h-5 px-1.5 text-[0.6875rem]",
	sm: "h-[1.375rem] px-2 text-xs",
	md: "h-6 px-2 text-xs",
	lg: "h-7 px-2.5 text-sm",
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
			className={[
				"inline-flex max-w-full items-center gap-1 rounded-md border font-medium whitespace-nowrap",
				variantClass[variant],
				sizeClass[size],
				className,
			]
				.filter(Boolean)
				.join(" ")}
			{...rest}>
			{children}
		</span>
	);
}
