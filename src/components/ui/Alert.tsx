import type {JSX, ReactNode} from "react";

export type AlertVariant = "info" | "success" | "warning" | "error";

export type AlertProps = {
	variant?: AlertVariant;
	title?: string;
	onClose?: () => void;
	className?: string;
	children: ReactNode;
};

const variantClass: Record<AlertVariant, string> = {
	info: "alert-info",
	success: "alert-success",
	warning: "alert-warning",
	error: "alert-error",
};

const icons: Record<AlertVariant, JSX.Element> = {
	info: <path d="M12 9v4m0 4h.01M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18" />,
	success: <path d="M5 12l4 4l10-10" />,
	warning: <path d="M12 9v4m0 4h.01M10.4 3.9l-8.5 14.7a1.7 1.7 0 0 0 1.5 2.6h17a1.7 1.7 0 0 0 1.5-2.6L13.6 3.9a1.7 1.7 0 0 0-3.2 0z" />,
	error: <path d="M12 9v4m0 4h.01M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18" />,
};

export default function Alert({
	variant = "info",
	title,
	onClose,
	className,
	children,
}: AlertProps): JSX.Element {
	return (
		<div
			role="alert"
			className={["alert items-start rounded-box py-3.5", variantClass[variant], className]
				.filter(Boolean)
				.join(" ")}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				strokeLinejoin="round"
				strokeLinecap="round"
				strokeWidth="2"
				fill="none"
				stroke="currentColor"
				aria-hidden="true"
				className="mt-0.5 inline-block size-5 shrink-0">
				{icons[variant]}
			</svg>
			<div className="min-w-0">
				{title && <h3 className="font-semibold">{title}</h3>}
				<div className={title ? "mt-0.5 text-sm leading-5" : "text-sm leading-5"}>{children}</div>
			</div>
			{onClose && (
				<button type="button" aria-label="Fechar alerta" onClick={onClose} className="btn btn-ghost btn-xs btn-circle -mr-1 shrink-0">
					✕
				</button>
			)}
		</div>
	);
}
