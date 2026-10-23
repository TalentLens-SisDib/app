/** Formata bytes em KB/MB no padrão pt-BR (ex.: "245 KB", "1,2 MB"). */
export function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;

	const kb = bytes / 1024;
	if (kb < 1024) return `${Math.round(kb)} KB`;

	const mb = kb / 1024;
	return `${mb.toLocaleString("pt-BR", {maximumFractionDigits: 1})} MB`;
}

/** Formata um valor monetário em reais (ex.: "R$ 12.500,00"). Aceita o `Decimal` serializado da API. */
export function formatCurrency(value: number | string): string {
	const amount = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(amount)) return "—";
	return amount.toLocaleString("pt-BR", {style: "currency", currency: "BRL"});
}

/** Formata uma data ISO no padrão pt-BR (ex.: "22 de out. de 2026"). */
export function formatDate(iso: string): string {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "—";
	return date.toLocaleDateString("pt-BR", {day: "2-digit", month: "short", year: "numeric"});
}

/** Data e hora curtas no padrão pt-BR (ex.: "22/10/2026, 14:30"). */
export function formatDateTime(iso: string): string {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "—";
	return date.toLocaleString("pt-BR", {dateStyle: "short", timeStyle: "short"});
}
