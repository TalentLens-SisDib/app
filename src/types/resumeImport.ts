export type ResumeFormat = "PDF";

/** Estados possíveis de um arquivo durante a importação. */
export type ResumeFileStatus = "waiting" | "processing" | "done" | "attention" | "failed";

/** Estados terminais — os únicos que um resultado pode assumir. */
export type ResumeOutcome = Extract<ResumeFileStatus, "done" | "attention" | "failed">;

export type SelectedResume = {
	id: string;
	name: string;
	size: number;
	format: ResumeFormat;
	/** Arquivo escolhido pelo usuário — é o que vai no upload. */
	source: File;
};

export type ResumeImportResult = {
	id: string;
	fileName: string;
	size: number;
	outcome: ResumeOutcome;
	/** `null` quando o arquivo não pôde ser lido: nenhum candidato foi criado. */
	candidateName: string | null;
	/** Perfil criado na API — `null` quando a importação do arquivo falhou. */
	profileId: string | null;
	message: string;
	issues: string[];
	hint: string;
};

/** Progresso de um arquivo enquanto a importação acontece. */
export type ResumeFileProgress = {
	file: SelectedResume;
	status: ResumeFileStatus;
	result: ResumeImportResult | null;
};

export type ResumeImportSummary = {
	total: number;
	processed: number;
	imported: number;
	attention: number;
	failed: number;
};
