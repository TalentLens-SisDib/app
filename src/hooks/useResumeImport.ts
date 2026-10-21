import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {isApiError} from "../api/errors";
import {
	importResumes,
	isAbortError,
	selectResumeFiles,
	type RejectedFile,
} from "../api/services/resumeImports";
import type {
	ResumeFileProgress,
	ResumeImportResult,
	ResumeImportSummary,
	SelectedResume,
} from "../types/resumeImport";

/** Passo do fluxo de importação exibido na tela. */
export type ImportStep = "select" | "review" | "processing" | "summary";

const GENERIC_ERROR = "Não foi possível importar os currículos. Tente novamente.";

export function useResumeImport() {
	const [files, setFiles] = useState<SelectedResume[]>([]);
	const [progress, setProgress] = useState<ResumeFileProgress[]>([]);
	const [results, setResults] = useState<ResumeImportResult[]>([]);
	const [running, setRunning] = useState(false);
	const [finished, setFinished] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const abortRef = useRef<AbortController | null>(null);

	// Uma importação em andamento não pode sobreviver à saída da tela.
	useEffect(() => () => abortRef.current?.abort(), []);

	const step: ImportStep = running
		? "processing"
		: finished
			? "summary"
			: files.length > 0
				? "review"
				: "select";

	const totalSize = useMemo(
		() => files.reduce((sum, file) => sum + file.size, 0),
		[files],
	);

	const summary = useMemo<ResumeImportSummary>(() => {
		const done = progress.filter((item) => item.status === "done").length;
		const attention = progress.filter((item) => item.status === "attention").length;
		const failed = progress.filter((item) => item.status === "failed").length;

		return {
			total: progress.length,
			processed: done + attention + failed,
			imported: done,
			attention,
			failed,
		};
	}, [progress]);

	/** Acrescenta arquivos à seleção e devolve os que foram recusados. */
	const addFiles = useCallback(
		(incoming: File[]): RejectedFile[] => {
			const {accepted, rejected} = selectResumeFiles(incoming, files.length);
			if (accepted.length > 0) {
				setError(null);
				setFiles((prev) => [...prev, ...accepted]);
			}
			return rejected;
		},
		[files.length],
	);

	const removeFile = useCallback((id: string) => {
		setFiles((prev) => prev.filter((file) => file.id !== id));
	}, []);

	const clearFiles = useCallback(() => setFiles([]), []);

	const start = useCallback(async () => {
		if (running || files.length === 0) return;

		const controller = new AbortController();
		abortRef.current = controller;

		setError(null);
		setResults([]);
		setProgress(files.map((file) => ({file, status: "waiting", result: null})));
		setRunning(true);

		try {
			const imported = await importResumes(
				files,
				({file, status, result}) => {
					setProgress((prev) =>
						prev.map((item) =>
							item.file.id === file.id ? {...item, status, result} : item,
						),
					);
				},
				controller.signal,
			);

			setResults(imported);
			setFinished(true);
		} catch (err) {
			if (isAbortError(err)) return;
			setError(isApiError(err) ? err.message : GENERIC_ERROR);
			setProgress([]);
		} finally {
			if (abortRef.current === controller) abortRef.current = null;
			setRunning(false);
		}
	}, [files, running]);

	/** Interrompe a importação em andamento e volta para a lista de arquivos. */
	const cancel = useCallback(() => {
		abortRef.current?.abort();
		abortRef.current = null;
		setRunning(false);
		setProgress([]);
	}, []);

	/** Volta ao início, pronto para uma nova importação. */
	const reset = useCallback(() => {
		abortRef.current?.abort();
		abortRef.current = null;
		setFiles([]);
		setProgress([]);
		setResults([]);
		setRunning(false);
		setFinished(false);
		setError(null);
	}, []);

	return {
		step,
		files,
		totalSize,
		progress,
		results,
		summary,
		error,
		addFiles,
		removeFile,
		clearFiles,
		start,
		cancel,
		reset,
	};
}
