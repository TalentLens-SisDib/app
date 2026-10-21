/** Formata bytes em KB/MB no padrão pt-BR (ex.: "245 KB", "1,2 MB"). */
export function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;

	const kb = bytes / 1024;
	if (kb < 1024) return `${Math.round(kb)} KB`;

	const mb = kb / 1024;
	return `${mb.toLocaleString("pt-BR", {maximumFractionDigits: 1})} MB`;
}
