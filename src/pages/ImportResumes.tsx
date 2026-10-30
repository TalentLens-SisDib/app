import {useRef, useState, type DragEvent, type JSX} from "react";
import {Link, useNavigate} from "react-router-dom";
import {
	RiAddLine,
	RiArrowDownSLine,
	RiBriefcase4Line,
	RiCheckboxBlankCircleLine,
	RiCheckboxCircleLine,
	RiClipboardLine,
	RiCloseCircleLine,
	RiCloseLine,
	RiErrorWarningLine,
	RiFileTextLine,
	RiLoader4Line,
	RiTeamLine,
	RiUploadCloud2Line,
} from "@remixicon/react";
import PageHeader from "../components/layout/PageHeader";
import LinkToJobDialog from "../components/jobOpenings/LinkToJobDialog";
import {Alert, Badge, Button, Dialog} from "../components/ui";
import {toast} from "../components/ui/toastStore";
import {ACCEPTED_EXTENSIONS} from "../api/services/resumeImports";
import {useResumeImport} from "../hooks/useResumeImport";
import type {
	ResumeFileStatus,
	ResumeImportResult,
	SelectedResume,
} from "../types/resumeImport";
import {formatFileSize} from "../utils/format";

type StatusStyle = {
	icon: typeof RiCheckboxCircleLine;
	iconClass: string;
	textClass: string;
	label: string;
	spin?: boolean;
};

const statusStyle: Record<ResumeFileStatus, StatusStyle> = {
	waiting: {
		icon: RiCheckboxBlankCircleLine,
		iconClass: "text-base-content/35",
		textClass: "text-base-content/60",
		label: "Aguardando",
	},
	processing: {
		icon: RiLoader4Line,
		iconClass: "text-primary",
		textClass: "text-primary font-medium",
		label: "Processando...",
		spin: true,
	},
	done: {
		icon: RiCheckboxCircleLine,
		iconClass: "text-success",
		textClass: "tl-tone-ok",
		label: "Concluído",
	},
	attention: {
		icon: RiErrorWarningLine,
		iconClass: "text-warning",
		textClass: "tl-tone-attn",
		label: "Alguns dados não foram identificados",
	},
	failed: {
		icon: RiCloseCircleLine,
		iconClass: "text-error",
		textClass: "tl-tone-err",
		label: "Não foi possível processar o arquivo",
	},
};

const cardClass = "card border-base-300 bg-base-100 overflow-hidden border shadow-sm";
const rowClass = "border-base-300 flex items-center gap-3 border-b px-4 py-3 last:border-b-0 sm:px-6";

function plural(count: number, one: string, many: string): string {
	return count === 1 ? one : many;
}

export default function ImportResumes(): JSX.Element {
	const navigate = useNavigate();
	const {
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
	} = useResumeImport();

	const inputRef = useRef<HTMLInputElement>(null);
	const [dragging, setDragging] = useState(false);
	const [detail, setDetail] = useState<ResumeImportResult | null>(null);
	const [linkTarget, setLinkTarget] = useState<{id: string; name: string} | null>(null);
	// Total de vagas por perfil, atualizado a cada vínculo feito nesta tela.
	const [linkedCounts, setLinkedCounts] = useState<Record<string, number>>({});

	function openLink(result: ResumeImportResult) {
		if (!result.profileId) return;
		setLinkTarget({id: result.profileId, name: result.candidateName ?? result.fileName});
	}

	function renderLinkAction(result: ResumeImportResult) {
		if (!result.profileId) return null;
		const count = linkedCounts[result.profileId] ?? 0;
		return (
			<Button
				variant={count > 0 ? "ghost" : "outline"}
				size="sm"
				onClick={() => openLink(result)}
				aria-label={`Vincular ${result.candidateName ?? result.fileName} a uma vaga`}>
				<RiBriefcase4Line className="size-4" />
				{count > 0 ? `${count} ${plural(count, "vaga", "vagas")}` : "Vincular à vaga"}
			</Button>
		);
	}

	function handleFiles(list: FileList | null) {
		if (!list || list.length === 0) return;

		const rejected = addFiles(Array.from(list));
		if (rejected.length === 1) {
			toast.warning(`${rejected[0].name}: ${rejected[0].reason}.`);
		} else if (rejected.length > 1) {
			toast.warning(`${rejected.length} arquivos não foram adicionados.`);
		}
	}

	function openPicker() {
		inputRef.current?.click();
	}

	function handleDrop(event: DragEvent<HTMLDivElement>) {
		event.preventDefault();
		setDragging(false);
		handleFiles(event.dataTransfer.files);
	}

	async function handleStart() {
		await start();
	}

	function scrollToPending() {
		document.getElementById("pendencias")?.scrollIntoView({behavior: "smooth", block: "start"});
	}

	function scrollToImported() {
		document.getElementById("perfis-importados")?.scrollIntoView({behavior: "smooth", block: "start"});
	}

	const attentionResults = results.filter((result) => result.outcome !== "done");
	const importedResults = results.filter((result) => result.outcome === "done");
	const progressPercent =
		summary.total > 0 ? Math.round((summary.processed / summary.total) * 100) : 0;

	return (
		<>
			<PageHeader
				title="Importar currículos"
				breadcrumbs={[
					{label: "Dashboard", href: "/"},
					{label: "Candidatos", href: "/candidatos"},
					{label: "Importar currículos", href: "/candidatos/importar"},
				]}
			/>

			<input
				ref={inputRef}
				type="file"
				multiple
				accept={ACCEPTED_EXTENSIONS}
				className="hidden"
				onChange={(event) => {
					handleFiles(event.target.files);
					event.target.value = "";
				}}
			/>

			{error && (
				<Alert variant="error" title="Não foi possível importar" className="mb-4">
					{error}
				</Alert>
			)}

			{/* 1 · Selecionar currículos */}
			{step === "select" && (
				<div className={cardClass}>
					<div className="card-body gap-0 p-5 sm:p-6">
						<h2 className="text-lg font-semibold">Adicionar currículos</h2>
						<p className="text-base-content/60 mt-1 text-sm">
							Adicione vários currículos de uma vez para iniciar a triagem.
						</p>

						<div
							onClick={openPicker}
							onDragOver={(event) => {
								event.preventDefault();
								setDragging(true);
							}}
							onDragLeave={() => setDragging(false)}
							onDrop={handleDrop}
							className={[
								"rounded-box mt-6 cursor-pointer border-2 border-dashed p-8 text-center transition-colors sm:p-12",
								dragging
									? "border-primary bg-primary/10"
									: "border-primary/40 bg-primary/5 hover:border-primary hover:bg-primary/10",
							].join(" ")}>
							<span className="bg-primary/15 text-primary mx-auto grid size-14 place-items-center rounded-full">
								<RiUploadCloud2Line className="size-7" />
							</span>
							<p className="mt-4 text-xl font-semibold tracking-tight">
								Arraste os currículos aqui
							</p>
							<p className="text-base-content/60 mt-1 mb-4">
								ou selecione os arquivos no seu computador
							</p>
							<Button
								size="lg"
								onClick={(event) => {
									event.stopPropagation();
									openPicker();
								}}>
								<RiFileTextLine className="size-5" />
								Selecionar arquivos
							</Button>

							<div className="text-base-content/60 mt-6 flex flex-wrap items-center justify-center gap-2 text-sm">
								<span>Formatos aceitos:</span>
								<Badge variant="outline" size="sm">
									PDF
								</Badge>
							</div>
							<p className="text-base-content/60 mt-2 text-sm">
								Até 5 MB por arquivo e 50 arquivos por importação.
							</p>
						</div>
					</div>
				</div>
			)}

			{/* 2 · Arquivos selecionados */}
			{step === "review" && (
				<div className={cardClass}>
					<div className="flex flex-wrap items-start justify-between gap-4 p-5 pb-4 sm:p-6 sm:pb-4">
						<div>
							<h2 className="text-lg font-semibold">
								{files.length} {plural(files.length, "currículo selecionado", "currículos selecionados")}
							</h2>
							<p className="text-base-content/60 mt-1 text-sm">
								{formatFileSize(totalSize)} no total. Revise a lista antes de importar.
							</p>
						</div>
						<Button variant="ghost" size="sm" onClick={openPicker}>
							<RiAddLine className="size-4" />
							Adicionar mais
						</Button>
					</div>

					<ul className="border-base-300 max-h-[26rem] overflow-y-auto border-t">
						{files.map((file: SelectedResume) => (
							<li key={file.id} className={rowClass}>
								<span className="bg-base-200 border-base-300 text-base-content/60 grid size-9 shrink-0 place-items-center rounded-field border">
									<RiFileTextLine className="size-5" />
								</span>
								<div className="min-w-0 flex-1">
									<p className="truncate font-medium" title={file.name}>
										{file.name}
									</p>
									<div className="text-base-content/60 mt-0.5 flex items-center gap-2 text-sm">
										<Badge variant="ghost" size="sm">
											{file.format}
										</Badge>
										<span>{formatFileSize(file.size)}</span>
									</div>
								</div>
								<Button
									variant="ghost"
									size="sm"
									className="btn-square"
									aria-label={`Remover ${file.name}`}
									onClick={() => removeFile(file.id)}>
									<RiCloseLine className="size-4" />
								</Button>
							</li>
						))}
					</ul>

					<div className="border-base-300 bg-base-200/60 flex flex-col-reverse gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
						<Button variant="ghost" onClick={clearFiles} className="sm:w-auto" fullWidth>
							Cancelar
						</Button>
						<Button onClick={handleStart} className="sm:w-auto" fullWidth>
							Importar {files.length} {plural(files.length, "currículo", "currículos")}
						</Button>
					</div>
				</div>
			)}

			{/* 3 · Processando */}
			{step === "processing" && (
				<div className={cardClass}>
					<div className="p-5 sm:p-6">
						<h2 className="text-lg font-semibold">Importando currículos</h2>

						<div className="mt-4 flex items-baseline justify-between gap-4">
							<strong className="text-base font-semibold">
								{summary.processed} de {summary.total} currículos processados
							</strong>
							<span className="text-primary text-lg font-semibold tabular-nums">
								{progressPercent}%
							</span>
						</div>
						<progress
							className="progress progress-primary mt-2.5 w-full"
							value={summary.processed}
							max={summary.total}
							aria-label="Progresso da importação"
						/>

						<div className="mt-4 flex flex-wrap gap-2">
							<Badge variant="success" size="sm">
								<RiCheckboxCircleLine className="size-3.5" />
								{summary.imported} {plural(summary.imported, "concluído", "concluídos")}
							</Badge>
							<Badge variant="warning" size="sm">
								<RiErrorWarningLine className="size-3.5" />
								{summary.attention} com atenção
							</Badge>
							<Badge variant="error" size="sm">
								<RiCloseCircleLine className="size-3.5" />
								{summary.failed} com erro
							</Badge>
						</div>
					</div>

					<ul className="border-base-300 max-h-[26rem] overflow-y-auto border-t">
						{progress.map((item) => {
							const style = statusStyle[item.status];
							const Icon = style.icon;
							return (
								<li
									key={item.file.id}
									className={[
										rowClass,
										item.status === "processing" && "bg-primary/5",
									]
										.filter(Boolean)
										.join(" ")}>
									<Icon
										className={[
											"size-5 shrink-0",
											style.iconClass,
											style.spin && "animate-spin",
										]
											.filter(Boolean)
											.join(" ")}
										aria-hidden="true"
									/>
									<div className="min-w-0 flex-1">
										<p
											className={[
												"truncate font-medium",
												item.status === "waiting" && "text-base-content/60",
											]
												.filter(Boolean)
												.join(" ")}
											title={item.file.name}>
											{item.file.name}
										</p>
										<p className={["mt-0.5 text-sm", style.textClass].join(" ")}>
											{style.label}
										</p>
									</div>
									<span className="text-base-content/60 hidden shrink-0 text-sm tabular-nums sm:block">
										{item.file.format} · {formatFileSize(item.file.size)}
									</span>
								</li>
							);
						})}
					</ul>

					<div className="border-base-300 bg-base-200/60 flex flex-wrap items-center justify-between gap-3 border-t p-4 sm:px-6">
						<Button variant="ghost" onClick={cancel}>
							Cancelar importação
						</Button>
						<span className="text-base-content/60 text-sm">
							Ao terminar, mostramos o resultado aqui.
						</span>
					</div>
				</div>
			)}

			{/* 4 · Resultado */}
			{step === "summary" && (
				<>
					<section className="tl-insight-panel">
						<h2 className="text-2xl font-bold tracking-tight">Importação concluída</h2>
						<p className="text-base-content/60 mt-1 max-w-xl">
							{summary.total} currículos processados. Adicionamos {summary.imported}{" "}
							{plural(summary.imported, "candidato", "candidatos")}
							{attentionResults.length > 0 && (
								<>
									{" "}
									e {attentionResults.length}{" "}
									{plural(attentionResults.length, "arquivo precisa", "arquivos precisam")} da
									sua atenção
								</>
							)}
							.
						</p>

						<div className="mt-5 flex flex-wrap items-center gap-2">
							{importedResults.length > 0 && (
								<Button onClick={scrollToImported}>
									<RiTeamLine className="size-5" />
									Ver perfis importados
								</Button>
							)}
							{attentionResults.length > 0 && (
								<Button variant="outline" onClick={scrollToPending}>
									<RiClipboardLine className="size-5" />
									Revisar pendências
									<Badge variant="warning" size="sm">
										{attentionResults.length}
									</Badge>
								</Button>
							)}
							<Button variant="ghost" onClick={reset}>
								<RiAddLine className="size-5" />
								Importar mais currículos
							</Button>
						</div>
					</section>

					<div className="mt-4 grid grid-cols-3 gap-3">
						<div className="rounded-box tl-surface-ok tl-tone-ok border p-3 sm:p-4">
							<div className="flex items-center gap-1.5 text-sm font-medium">
								<RiCheckboxCircleLine className="hidden size-4 sm:block" />
								Importados
							</div>
							<p className="mt-1 text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">
								{summary.imported}
							</p>
						</div>
						<div className="rounded-box tl-surface-attn tl-tone-attn border p-3 sm:p-4">
							<div className="flex items-center gap-1.5 text-sm font-medium">
								<RiErrorWarningLine className="hidden size-4 sm:block" />
								Atenção
							</div>
							<p className="mt-1 text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">
								{summary.attention}
							</p>
						</div>
						<div className="rounded-box tl-surface-err tl-tone-err border p-3 sm:p-4">
							<div className="flex items-center gap-1.5 text-sm font-medium">
								<RiCloseCircleLine className="hidden size-4 sm:block" />
								Falhou
							</div>
							<p className="mt-1 text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">
								{summary.failed}
							</p>
						</div>
					</div>

					{attentionResults.length > 0 && (
						<>
							<h3
								id="pendencias"
								className="mt-6 mb-2 flex scroll-mt-6 items-center gap-2 font-semibold">
								Precisam da sua atenção
								<Badge variant="warning">{attentionResults.length}</Badge>
							</h3>
							<ul className={cardClass}>
								{attentionResults.map((result) => {
									const failed = result.outcome === "failed";
									return (
										<li
											key={result.id}
											className="border-base-300 flex flex-wrap items-center gap-3 border-b px-4 py-4 last:border-b-0 sm:px-5">
											<span
												className={[
													"grid size-8 shrink-0 place-items-center rounded-full border",
													failed
														? "tl-surface-err tl-tone-err"
														: "tl-surface-attn tl-tone-attn",
												].join(" ")}>
												{failed ? (
													<RiCloseCircleLine className="size-4" />
												) : (
													<RiErrorWarningLine className="size-4" />
												)}
											</span>
											<div className="min-w-0 flex-1 basis-56">
												<p className="truncate font-semibold">
													{result.candidateName ?? result.fileName}
												</p>
												<p
													className="text-base-content/60 truncate text-sm"
													title={result.fileName}>
													{failed ? "Nenhum candidato foi criado" : result.fileName}
												</p>
												<p
													className={[
														"mt-1 text-sm font-medium",
														failed ? "tl-tone-err" : "tl-tone-attn",
													].join(" ")}>
													{result.message}
												</p>
											</div>
											<div className="flex flex-wrap gap-2">
												{!failed && renderLinkAction(result)}
												{result.profileId && (
													<Link
														to={`/candidatos/${result.profileId}`}
														className="btn btn-outline btn-sm">
														Ver perfil
													</Link>
												)}
												<Button
													variant="outline"
													size="sm"
													onClick={() => setDetail(result)}>
													{failed ? "Ver detalhes" : "Revisar"}
												</Button>
											</div>
										</li>
									);
								})}
							</ul>
						</>
					)}

					{importedResults.length > 0 && (
						<details className="group" open>
							<summary
								id="perfis-importados"
								className="mt-6 mb-2 flex scroll-mt-6 cursor-pointer list-none items-center gap-2 font-semibold">
								Importados com sucesso
								<Badge variant="success">{importedResults.length}</Badge>
								<RiArrowDownSLine className="text-base-content/60 ml-auto size-5 transition-transform group-open:rotate-180" />
							</summary>
							<ul className={cardClass}>
								{importedResults.map((result) => (
									<li
										key={result.id}
										className="border-base-300 flex items-center gap-3 border-b px-4 py-2.5 last:border-b-0 sm:px-5">
										<span className="tl-surface-ok tl-tone-ok grid size-8 shrink-0 place-items-center rounded-full border">
											<RiCheckboxCircleLine className="size-4" />
										</span>
										<div className="min-w-0 flex-1">
											<p className="truncate font-semibold">{result.candidateName}</p>
											<p
												className="text-base-content/60 truncate text-sm"
												title={result.fileName}>
												{result.fileName}
											</p>
										</div>
										{result.profileId && (
											<Link
												to={`/candidatos/${result.profileId}`}
												className="btn btn-outline btn-sm">
												Ver perfil
											</Link>
										)}
										{renderLinkAction(result) ?? (
											<Badge variant="success" size="sm">
												Importado
											</Badge>
										)}
									</li>
								))}
							</ul>
						</details>
					)}
				</>
			)}

			{linkTarget && (
				<LinkToJobDialog
					key={linkTarget.id}
					open
					onClose={() => setLinkTarget(null)}
					profile={linkTarget}
					onLinked={(total) =>
						setLinkedCounts((prev) => ({...prev, [linkTarget.id]: total}))
					}
				/>
			)}

			<Dialog
				open={detail !== null}
				onClose={() => setDetail(null)}
				title={
					detail?.outcome === "failed"
						? "Não foi possível processar"
						: "Problemas encontrados"
				}
				actions={
					<>
						<Button variant="ghost" onClick={() => setDetail(null)}>
							Fechar
						</Button>
						<Button
							onClick={() => {
								const failed = detail?.outcome === "failed";
								const name = detail?.candidateName ?? detail?.fileName ?? "";
								const profileId = detail?.profileId;
								setDetail(null);
								if (failed) {
									reset();
									toast.info("Selecione o arquivo corrigido para importar novamente.");
								} else if (profileId) {
									navigate(`/candidatos/${profileId}`);
								} else {
									toast.info(`Destino: perfil de ${name}, com os campos pendentes destacados.`);
								}
							}}>
							{detail?.outcome === "failed" ? "Importar novamente" : "Completar perfil"}
						</Button>
					</>
				}>
				{detail && (
					<>
						<div className="bg-base-200 border-base-300 flex items-center gap-2.5 rounded-field border px-3 py-2.5">
							<RiFileTextLine className="text-base-content/60 size-4 shrink-0" />
							<span className="min-w-0 break-words">{detail.fileName}</span>
						</div>

						<ul className="mt-4 grid gap-2">
							{detail.issues.map((issue) => (
								<li key={issue} className="flex items-start gap-2.5">
									{detail.outcome === "failed" ? (
										<RiCloseCircleLine className="tl-tone-err mt-0.5 size-4 shrink-0" />
									) : (
										<RiErrorWarningLine className="tl-tone-attn mt-0.5 size-4 shrink-0" />
									)}
									<span>{issue}</span>
								</li>
							))}
						</ul>

						<p className="text-base-content/60 mt-4">{detail.hint}</p>
					</>
				)}
			</Dialog>
		</>
	);
}
