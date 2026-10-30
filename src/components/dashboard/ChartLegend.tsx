import type {JSX} from "react";

export type ChartLegendItem = {
	label: string;
	/** Classe de fundo (token do tema) ou cor literal da série. */
	swatch: {className?: string; color?: string};
	/** Total da série no período, quando ajuda a leitura. */
	value?: string;
};

type ChartLegendProps = {
	items: ChartLegendItem[];
};

/** Legenda em HTML: a identidade das séries nunca depende só da cor. */
export default function ChartLegend({items}: ChartLegendProps): JSX.Element {
	return (
		<ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
			{items.map((item) => (
				<li key={item.label} className="flex items-center gap-1.5">
					<span
						aria-hidden="true"
						className={["size-2 shrink-0 rounded-[3px]", item.swatch.className].filter(Boolean).join(" ")}
						style={item.swatch.color ? {background: item.swatch.color} : undefined}
					/>
					<span className="text-base-content/65">{item.label}</span>
					{item.value && <span className="text-base-content font-semibold tabular-nums">{item.value}</span>}
				</li>
			))}
		</ul>
	);
}
