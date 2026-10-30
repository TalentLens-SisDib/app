import {useState} from "react";

/**
 * Paginação no cliente. Volta para a primeira página quando a lista muda de tamanho
 * (ex.: nova busca), sem efeito: o ajuste acontece durante o render.
 */
export function usePagination<T>(items: T[], pageSize = 20) {
	const [page, setPage] = useState(1);
	const [lastLength, setLastLength] = useState(items.length);

	if (items.length !== lastLength) {
		setLastLength(items.length);
		setPage(1);
	}

	const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
	const current = Math.min(page, pageCount);

	return {
		page: current,
		pageCount,
		pageSize,
		total: items.length,
		setPage,
		pageItems: items.slice((current - 1) * pageSize, current * pageSize),
	};
}
