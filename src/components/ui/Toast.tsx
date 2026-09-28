import {useSyncExternalStore, type JSX} from "react";
import {
	dismiss,
	getSnapshot,
	subscribe,
	type ToastVariant,
} from "./toastStore";

const variantClass: Record<ToastVariant, string> = {
	info: "alert-info",
	success: "alert-success",
	warning: "alert-warning",
	error: "alert-error",
};

export function Toaster(): JSX.Element {
	const toasts = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

	return (
		<div className="toast toast-end toast-bottom z-50 p-3 sm:p-4">
			{toasts.map((item) => (
				<div
					key={item.id}
					role="status"
					className={["alert w-full max-w-sm items-center shadow-lg", variantClass[item.variant]].join(
						" ",
					)}>
					<span>{item.message}</span>
					<button
						type="button"
						aria-label="Fechar notificação"
						onClick={() => dismiss(item.id)}
						className="btn btn-ghost btn-xs btn-circle">
						✕
					</button>
				</div>
			))}
		</div>
	);
}
