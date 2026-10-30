import type {JSX} from "react";
import {RiArrowLeftSLine, RiArrowRightSLine} from "@remixicon/react";

export type PaginationProps = {
	page: number;
	pageCount: number;
	total: number;
	pageSize: number;
	onPageChange: (page: number) => void;
	/** Substantivo no plural para a contagem (ex.: "competências"). */
	noun: string;
};

/** Rodapé de tabela: faixa exibida + anterior/próxima. Some quando cabe numa página. */
export default function Pagination({page, pageCount, total, pageSize, onPageChange, noun}: PaginationProps): JSX.Element | null {
	if (pageCount <= 1) return null;
	const from = (page - 1) * pageSize + 1;
	const to = Math.min(page * pageSize, total);

	return (
		<nav
			aria-label="Paginação"
			className="border-base-300 flex items-center justify-between gap-3 border-t px-4 py-2.5 text-xs">
			<p className="text-base-content/60 tabular-nums">
				{from}–{to} de {total} {noun}
			</p>
			<div className="flex items-center gap-1">
				<button
					type="button"
					aria-label="Página anterior"
					disabled={page <= 1}
					onClick={() => onPageChange(page - 1)}
					className="tl-icon-action disabled:pointer-events-none disabled:opacity-35">
					<RiArrowLeftSLine className="size-4" />
				</button>
				<span className="text-base-content/70 px-1 tabular-nums">
					{page} / {pageCount}
				</span>
				<button
					type="button"
					aria-label="Próxima página"
					disabled={page >= pageCount}
					onClick={() => onPageChange(page + 1)}
					className="tl-icon-action disabled:pointer-events-none disabled:opacity-35">
					<RiArrowRightSLine className="size-4" />
				</button>
			</div>
		</nav>
	);
}
