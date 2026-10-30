/**
 * Cores dos gráficos. As séries usam o azul da marca e o teal de destaque, validados
 * para daltonismo contra a superfície do card (`base-100`); a ordem é fixa — a série 1
 * é sempre azul. Eixos e grade usam os tokens do tema.
 */
export const SERIES = ["#1659b5", "#05a388"] as const;

export const GRID = "var(--color-base-300)";
export const AXIS_TEXT = "color-mix(in oklab, var(--color-base-content) 55%, transparent)";
export const SURFACE = "var(--color-base-100)";

export const AXIS_TICK = {fill: AXIS_TEXT, fontSize: 11};

export function formatNumber(value: number): string {
	return value.toLocaleString("pt-BR");
}

export function formatPercent(part: number, total: number): string {
	return total > 0 ? `${Math.round((part / total) * 100)}%` : "—";
}
