import type {HTMLAttributes, JSX, ReactNode} from "react";

export type CardVariant = "default" | "subtle" | "highlight";
export type CardPadding = "sm" | "md" | "lg";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
	title?: ReactNode;
	description?: ReactNode;
	actions?: ReactNode;
	variant?: CardVariant;
	padding?: CardPadding;
};

const variantClass: Record<CardVariant, string> = {
	default: "border-base-300 bg-base-100 shadow-sm",
	subtle: "border-base-300/70 bg-base-200/60 shadow-none",
	highlight: "border-primary/20 bg-base-100 shadow-sm",
};

const paddingClass: Record<CardPadding, string> = {
	sm: "p-4",
	md: "p-5 sm:p-6",
	lg: "p-6 sm:p-8",
};

export default function Card({
	title,
	description,
	actions,
	variant = "default",
	padding = "md",
	className,
	children,
	...rest
}: CardProps): JSX.Element {
	return (
		<div
			className={["card border", variantClass[variant], className]
				.filter(Boolean)
				.join(" ")}
			{...rest}>
			<div className={["card-body gap-5", paddingClass[padding]].join(" ")}>
				{(title || description) && (
					<div className="space-y-1">
						{title && <h2 className="card-title text-lg font-semibold">{title}</h2>}
						{description && (
							<p className="text-base-content/60 text-sm leading-6">{description}</p>
						)}
					</div>
				)}
				{children}
				{actions && (
					<div className="card-actions border-base-300 mt-1 justify-end border-t pt-4">
						{actions}
					</div>
				)}
			</div>
		</div>
	);
}
