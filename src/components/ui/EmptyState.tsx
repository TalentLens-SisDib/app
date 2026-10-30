import type {JSX, ReactNode} from "react";

export type EmptyStateProps = {
	icon: ReactNode;
	title: string;
	description?: ReactNode;
	/** Ação que resolve o vazio (ex.: "Criar vaga"). */
	action?: ReactNode;
	/** `panel` desenha a moldura; `plain` vai dentro de uma superfície que já existe. */
	variant?: "panel" | "plain";
};

export default function EmptyState({icon, title, description, action, variant = "panel"}: EmptyStateProps): JSX.Element {
	return (
		<div
			className={[
				"flex flex-col items-center justify-center gap-4 px-6 py-12 text-center",
				variant === "panel" && "rounded-box border-base-300 bg-base-100 border",
			]
				.filter(Boolean)
				.join(" ")}>
			<span className="bg-base-200 text-base-content/50 border-base-300 grid size-11 place-items-center rounded-lg border">
				{icon}
			</span>
			<div className="max-w-sm">
				<p className="text-sm font-semibold">{title}</p>
				{description && <p className="text-base-content/60 mt-1 text-sm leading-6">{description}</p>}
			</div>
			{action}
		</div>
	);
}
