import type {HTMLAttributes, JSX, ReactNode} from "react";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
	title?: ReactNode;
	description?: ReactNode;
	actions?: ReactNode;
};

export default function Card({
	title,
	description,
	actions,
	className,
	children,
	...rest
}: CardProps): JSX.Element {
	return (
		<div
			className={[
				"card border-base-300 bg-base-100 border shadow-sm",
				className,
			]
				.filter(Boolean)
				.join(" ")}
			{...rest}>
			<div className="card-body gap-5 p-5 sm:p-6">
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
