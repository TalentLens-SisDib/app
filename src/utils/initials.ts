/** Até duas iniciais: primeiro e último nome. */
export function initialsOf(name: string | undefined, fallback = "?"): string {
	const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return fallback;
	const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
	return (parts[0].charAt(0) + last).toUpperCase();
}
