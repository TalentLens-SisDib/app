import type {JSX} from "react";
import {RiErrorWarningLine, RiRefreshLine} from "@remixicon/react";

export type ErrorStateProps = {
	title: string;
	message: string;
	onRetry?: () => void;
};

/** Falha ao carregar uma listagem: mensagem clara + tentar novamente. */
export default function ErrorState({title, message, onRetry}: ErrorStateProps): JSX.Element {
	return (
		<div role="alert" className="rounded-box tl-surface-err flex flex-col gap-3 border px-4 py-3.5 sm:flex-row sm:items-center">
			<RiErrorWarningLine aria-hidden="true" className="tl-tone-err size-5 shrink-0" />
			<div className="min-w-0 flex-1">
				<p className="tl-tone-err text-sm font-semibold">{title}</p>
				<p className="text-base-content/70 text-sm">{message}</p>
			</div>
			{onRetry && (
				<button type="button" onClick={onRetry} className="btn btn-sm border-base-300 bg-base-100 shrink-0 font-medium shadow-none">
					<RiRefreshLine className="size-4" />
					Tentar novamente
				</button>
			)}
		</div>
	);
}
