import {useState, type JSX, type ReactNode} from "react";
import {RiBarChartHorizontalLine, RiTable2} from "@remixicon/react";

type View = "chart" | "table";

type ChartCardProps = {
	title: string;
	description: string;
	/** Legenda ou resumo, entre o cabeçalho e o gráfico. */
	toolbar?: ReactNode;
	/** Mostrado no lugar do gráfico quando não há dados. */
	empty?: ReactNode;
	/** Os mesmos dados do gráfico em tabela, para leitores de tela e consulta exata. */
	table: {columns: string[]; rows: (string | number)[][]};
	footer?: ReactNode;
	children: ReactNode;
	className?: string;
};

export default function ChartCard({
	title,
	description,
	toolbar,
	empty,
	table,
	footer,
	children,
	className,
}: ChartCardProps): JSX.Element {
	const [view, setView] = useState<View>("chart");

	return (
		<section aria-label={title} className={["tl-panel", className].filter(Boolean).join(" ")}>
			<header className="tl-panel-header">
				<div className="min-w-0">
					<h2 className="tl-panel-title">{title}</h2>
					<p className="tl-panel-description">{description}</p>
				</div>
				{!empty && (
					<div role="group" aria-label="Modo de exibição" className="bg-base-200 flex shrink-0 rounded-lg p-0.5">
						{(
							[
								{value: "chart", label: "Gráfico", icon: RiBarChartHorizontalLine},
								{value: "table", label: "Tabela", icon: RiTable2},
							] as const
						).map(({value, label, icon: Icon}) => (
							<button
								key={value}
								type="button"
								aria-pressed={view === value}
								aria-label={`Ver em ${label.toLowerCase()}`}
								data-tip={label}
								onClick={() => setView(value)}
								className={[
									"tooltip tooltip-bottom grid size-7 place-items-center rounded-md transition-colors",
									view === value
										? "bg-base-100 text-base-content shadow-xs"
										: "text-base-content/50 hover:text-base-content",
								].join(" ")}>
								<Icon className="size-4" />
							</button>
						))}
					</div>
				)}
			</header>

			<div className="flex grow flex-col gap-4 px-5 pt-4 pb-5">
				{empty ?? (
					<>
						{toolbar}
						{view === "chart" ? (
							<figure aria-label={title} className="grow">
								{children}
							</figure>
						) : (
							<div className="border-base-300 rounded-lg overflow-x-auto border">
								<table className="table-sm table">
									<thead>
										<tr className="text-base-content/60 border-base-300 bg-base-200/60 text-xs">
											{table.columns.map((column, index) => (
												<th key={column} className={index > 0 ? "text-right font-medium" : "font-medium"}>
													{column}
												</th>
											))}
										</tr>
									</thead>
									<tbody>
										{table.rows.map((row, rowIndex) => (
											<tr key={rowIndex} className="border-base-300">
												{row.map((cell, index) => (
													<td key={index} className={index > 0 ? "text-right tabular-nums" : "font-medium"}>
														{cell}
													</td>
												))}
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</>
				)}
			</div>

			{footer && <footer className="tl-panel-footer">{footer}</footer>}
		</section>
	);
}
