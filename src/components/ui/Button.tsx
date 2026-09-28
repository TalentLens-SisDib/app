import type {ButtonHTMLAttributes, JSX} from "react";

export type ButtonVariant =
	| "primary"
	| "secondary"
	| "ghost"
	| "outline"
	| "error"
	| "success";

export type ButtonSize = "xs" | "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: ButtonVariant;
	size?: ButtonSize;
	loading?: boolean;
	fullWidth?: boolean;
};

const variantClass: Record<ButtonVariant, string> = {
	primary: "btn-primary",
	secondary: "btn-secondary",
	ghost: "btn-ghost",
	outline: "btn-outline",
	error: "btn-error",
	success: "btn-success",
};

const sizeClass: Record<ButtonSize, string> = {
	xs: "btn-xs",
	sm: "btn-sm",
	md: "btn-md",
	lg: "btn-lg",
};

export default function Button({
	variant = "primary",
	size = "md",
	loading = false,
	fullWidth = false,
	disabled,
	type = "button",
	className,
	children,
	...rest
}: ButtonProps): JSX.Element {
	return (
		<button
			type={type}
			disabled={disabled || loading}
			aria-busy={loading || undefined}
			className={[
				"btn font-semibold shadow-none",
				variantClass[variant],
				sizeClass[size],
				fullWidth && "w-full",
				className,
			]
				.filter(Boolean)
				.join(" ")}
			{...rest}>
			{loading && (
				<span className="loading loading-spinner loading-xs" aria-hidden="true" />
			)}
			{children}
		</button>
	);
}
