import {useId, type JSX} from "react";
import {Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import {RiLineChartLine} from "@remixicon/react";
import type {ActivityWeek} from "../../utils/dashboardMetrics";
import {ACTIVITY_WEEKS} from "../../utils/dashboardMetrics";
import ChartCard from "./ChartCard";
import ChartEmpty from "./ChartEmpty";
import ChartLegend from "./ChartLegend";
import ChartTooltip from "./ChartTooltip";
import {AXIS_TICK, GRID, SERIES, SURFACE, formatNumber} from "./chartTheme";

const SERIES_CONFIG = [
	{key: "candidates", label: "Novos candidatos", color: SERIES[0]},
	{key: "interviews", label: "Entrevistas", color: SERIES[1]},
] as const;

function parseWeek(weekStart: string): Date {
	const [year, month, day] = weekStart.split("-").map(Number);
	return new Date(year, month - 1, day);
}

function formatWeek(weekStart: string): string {
	return parseWeek(weekStart).toLocaleDateString("pt-BR", {day: "2-digit", month: "short"}).replace(".", "");
}

/** "27 out – 2 nov": de segunda a domingo. */
function formatWeekRange(weekStart: string): string {
	const start = parseWeek(weekStart);
	const end = new Date(start);
	end.setDate(start.getDate() + 6);
	const format = (date: Date) =>
		date.toLocaleDateString("pt-BR", {day: "numeric", month: "short"}).replace(".", "");
	return `${format(start)} – ${format(end)}`;
}

type ActivityChartProps = {
	data: ActivityWeek[];
	className?: string;
};

export default function ActivityChart({data, className}: ActivityChartProps): JSX.Element {
	// Ids do React têm caracteres que não funcionam em `url(#...)`.
	const gradientPrefix = useId().replace(/[^a-zA-Z0-9_-]/g, "");
	const hasData = data.some((week) => week.candidates > 0 || week.interviews > 0);
	const totals = {
		candidates: data.reduce((sum, week) => sum + week.candidates, 0),
		interviews: data.reduce((sum, week) => sum + week.interviews, 0),
	};

	return (
		<ChartCard
			title="Atividade semanal"
			description={`Novos candidatos e entrevistas realizadas por semana · últimas ${ACTIVITY_WEEKS} semanas`}
			className={className}
			toolbar={
				<ChartLegend
					items={SERIES_CONFIG.map((series) => ({
						label: series.label,
						swatch: {color: series.color},
						value: formatNumber(totals[series.key]),
					}))}
				/>
			}
			empty={
				hasData ? undefined : (
					<ChartEmpty icon={<RiLineChartLine className="size-5" />} title="Sem atividade no período">
						Importe currículos e registre entrevistas para acompanhar o ritmo do processo.
					</ChartEmpty>
				)
			}
			table={{
				columns: ["Semana", ...SERIES_CONFIG.map((series) => series.label)],
				rows: data.map((week) => [formatWeekRange(week.weekStart), week.candidates, week.interviews]),
			}}>
			<div className="-mx-1 h-64 sm:h-72">
				<ResponsiveContainer width="100%" height="100%">
					<AreaChart data={data} margin={{top: 8, right: 8, bottom: 0, left: -8}}>
						<defs>
							{SERIES_CONFIG.map((series) => (
								<linearGradient key={series.key} id={`${gradientPrefix}-${series.key}`} x1="0" x2="0" y1="0" y2="1">
									<stop offset="0%" stopColor={series.color} stopOpacity={0.14} />
									<stop offset="100%" stopColor={series.color} stopOpacity={0} />
								</linearGradient>
							))}
						</defs>
						<CartesianGrid vertical={false} stroke={GRID} />
						<XAxis
							dataKey="weekStart"
							tickFormatter={formatWeek}
							tick={AXIS_TICK}
							tickLine={false}
							axisLine={false}
							tickMargin={10}
							minTickGap={28}
						/>
						<YAxis
							allowDecimals={false}
							tick={AXIS_TICK}
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							width={40}
						/>
						<Tooltip
							cursor={{stroke: "var(--color-base-content)", strokeOpacity: 0.15, strokeWidth: 1}}
							content={({active, payload}) => {
								const week = payload?.[0]?.payload as ActivityWeek | undefined;
								if (!active || !week) return null;
								return (
									<ChartTooltip
										title={`Semana de ${formatWeekRange(week.weekStart)}`}
										rows={SERIES_CONFIG.map((series) => ({
											label: series.label,
											value: formatNumber(week[series.key]),
											color: series.color,
										}))}
									/>
								);
							}}
						/>
						{SERIES_CONFIG.map((series) => (
							<Area
								key={series.key}
								type="monotone"
								dataKey={series.key}
								name={series.label}
								stroke={series.color}
								strokeWidth={2}
								fill={`url(#${gradientPrefix}-${series.key})`}
								dot={{r: 2.5, fill: series.color, stroke: SURFACE, strokeWidth: 1.5}}
								activeDot={{r: 5, fill: series.color, stroke: SURFACE, strokeWidth: 2}}
							/>
						))}
					</AreaChart>
				</ResponsiveContainer>
			</div>
		</ChartCard>
	);
}
