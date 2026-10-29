export function parseKeyTakeaways(value: string | string[] | null | undefined): string[] {
	if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean);
	if (!value) return [];

	try {
		const parsed: unknown = JSON.parse(value);
		return Array.isArray(parsed)
			? parsed.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
			: [];
	} catch {
		return [];
	}
}
