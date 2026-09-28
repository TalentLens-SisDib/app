import {useEffect, useId, useRef, type JSX, type ReactNode} from "react";

export type DialogProps = {
	open: boolean;
	onClose: () => void;
	title?: string;
	actions?: ReactNode;
	children: ReactNode;
};

export default function Dialog({
	open,
	onClose,
	title,
	actions,
	children,
}: DialogProps): JSX.Element {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const titleId = useId();

	useEffect(() => {
		const node = dialogRef.current;
		if (!node) return;
		if (open && !node.open) node.showModal();
		if (!open && node.open) node.close();
	}, [open]);

	return (
		<dialog
			ref={dialogRef}
			className="modal"
			aria-labelledby={title ? titleId : undefined}
			onClose={onClose}
			onCancel={onClose}>
			<div className="modal-box max-w-lg border-base-300 border p-0 shadow-xl">
				<form method="dialog">
					<button
						aria-label="Fechar"
						className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2">
						✕
					</button>
				</form>

				{title && (
					<h3 id={titleId} className="px-6 pt-6 pr-14 text-lg font-semibold">
						{title}
					</h3>
				)}

				<div className="px-6 py-5 text-sm leading-6">{children}</div>

				{actions && <div className="modal-action border-base-300 m-0 border-t bg-base-200/50 px-6 py-4">{actions}</div>}
			</div>

			<form method="dialog" className="modal-backdrop">
				<button aria-label="Fechar">close</button>
			</form>
		</dialog>
	);
}
