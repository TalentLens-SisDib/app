export type ToastVariant = "info" | "success" | "warning" | "error";

export type ToastItem = {
	id: number;
	variant: ToastVariant;
	message: string;
};

const DEFAULT_DURATION = 4000;

let items: ToastItem[] = [];
let nextId = 0;
const listeners = new Set<() => void>();

function notify() {
	for (const listener of listeners) listener();
}

export function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

export function getSnapshot() {
	return items;
}

export function dismiss(id: number) {
	items = items.filter((item) => item.id !== id);
	notify();
}

function push(
	variant: ToastVariant,
	message: string,
	duration = DEFAULT_DURATION,
): number {
	const id = ++nextId;
	items = [...items, {id, variant, message}];
	notify();
	if (duration > 0) {
		setTimeout(() => dismiss(id), duration);
	}
	return id;
}

export const toast = {
	success: (message: string, duration?: number) =>
		push("success", message, duration),
	error: (message: string, duration?: number) =>
		push("error", message, duration),
	info: (message: string, duration?: number) => push("info", message, duration),
	warning: (message: string, duration?: number) =>
		push("warning", message, duration),
	dismiss,
};
