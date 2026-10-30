import type {JSX, ReactNode} from "react";
import {Link} from "react-router-dom";
import {RiArrowRightUpLine} from "@remixicon/react";

export type Tone = "neutral" | "ok" | "attn" | "err";

const CHIP_CLASS: Record<Tone, string> = {
	neutral: "tl-chip-neutral",
	ok: "tl-chip-ok",
	attn: "tl-chip-attn",
	err: "tl-chip-err",
};

type StatTileProps = {
	label: string;
	value: string;
	icon: ReactNode;
	/** Variação ou estado, com tom semântico. */
	chip?: {tone: Tone; label: ReactNode; icon?: ReactNode};
	/** Texto ao lado do chip (ex.: "vs. 30 dias anteriores"). */
	chipCaption?: string;
	/** Visual compacto à direita do número: sparkline ou medidor. */
	visual?: ReactNode;
	/** Contexto secundário, no rodapé do card. */
	detail?: ReactNode;
	href?: string;
};

export default function StatTile({
	label,
	value,
	icon,
	chip,
	chipCaption,
	visual,
	detail,
	href,
}: StatTileProps): JSX.Element {
	const body = (
		<>
			<div className="flex items-center gap-2.5">
				<span className="tl-icon-chip">{icon}</span>
				<span className="tl-label">{label}</span>
				{href && (
					<RiArrowRightUpLine
						aria-hidden="true"
						className="text-base-content/30 group-hover:text-primary ml-auto size-4 transition-colors"
					/>
				)}
			</div>

			<div className="mt-4 flex items-end justify-between gap-3">
				<p className="tl-metric">{value}</p>
				{visual}
			</div>

			{chip && (
				<div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
					<span className={`tl-chip ${CHIP_CLASS[chip.tone]}`}>
						{chip.icon}
						{chip.label}
					</span>
					{chipCaption && <span className="text-base-content/55 text-xs">{chipCaption}</span>}
				</div>
			)}

			{detail && (
				// mt-auto alinha os rodapés quando os cards da linha têm alturas iguais.
				<div className="mt-auto pt-4">
					<p className="border-base-300 text-base-content/60 border-t pt-3 text-xs leading-5">{detail}</p>
				</div>
			)}
		</>
	);

	const className = "tl-panel group h-full p-5";
	return href ? (
		<Link to={href} className={`${className} hover:border-primary/35 transition-colors`}>
			{body}
		</Link>
	) : (
		<div className={className}>{body}</div>
	);
}
