import type {JSX} from "react";

export type ChartTooltipRow = {
	label: string;
	value: string;
	/** Cor da série; omitida em linhas sem marca correspondente. */
	color?: string;
};

type ChartTooltipProps = {
	title: string;
	rows: ChartTooltipRow[];
	note?: string;
};

export default function ChartTooltip({title, rows, note}: ChartTooltipProps): JSX.Element {
	return (
		<div className="border-base-300 bg-base-100 min-w-44 rounded-lg border px-3 py-2.5 text-xs shadow-lg shadow-black/5">
			<p className="text-base-content/60 mb-2 font-medium">{title}</p>
			<ul className="space-y-1.5">
				{rows.map((row) => (
					<li key={row.label} className="flex items-center gap-2">
						{row.color && (
							<span aria-hidden="true" className="size-2 shrink-0 rounded-[3px]" style={{background: row.color}} />
						)}
						<span className="text-base-content/70">{row.label}</span>
						<span className="text-base-content ml-auto pl-4 font-semibold tabular-nums">{row.value}</span>
					</li>
				))}
			</ul>
			{note && <p className="border-base-300 text-base-content/60 mt-2 border-t pt-2">{note}</p>}
		</div>
	);
}
