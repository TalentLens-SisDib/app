import assert from "node:assert/strict";
import {File} from "node:buffer";
import {createServer} from "vite";

type Profile = {
	id: string;
	name: string;
	description?: string | null;
	skills?: {skillId: string; skillName: string}[];
	educationalBackground?: {id: string}[];
	qualityIssues?: string[];
};

type SelectedResume = {
	id: string;
	name: string;
	size: number;
	format: "PDF";
	source: File;
};

const originalFetch = globalThis.fetch;
const originalApiUrl = process.env.VITE_API_URL;
process.env.VITE_API_URL = "http://resume-import-selfcheck.invalid";

const vite = await createServer({
	configFile: "./vite.config.ts",
	server: {middlewareMode: true},
	appType: "custom",
	logLevel: "silent",
});

try {
	const {importResumes, selectResumeFiles} = await vite.ssrLoadModule("/src/api/services/resumeImports.ts") as {
		importResumes: (
			files: SelectedResume[],
			onProgress: (event: {status: string; result: {outcome: string} | null}) => void,
			signal?: AbortSignal,
		) => Promise<{outcome: string; profileId: string | null; issues: string[]}[]>;
		selectResumeFiles: (files: File[], alreadySelected: number) => {
			accepted: SelectedResume[];
			rejected: {name: string; reason: string}[];
		};
	};

	const pdfFile = (name: string) => new File(["%PDF-1.4"], name, {type: "application/pdf"});
	const selection = selectResumeFiles([pdfFile("candidate.pdf")], 0);
	assert.equal(selection.accepted.length, 1, "valid PDFs should be accepted");
	assert.equal(selection.rejected.length, 0);

	const invalid = selectResumeFiles([
		new File(["content"], "candidate.docx"),
		new File([new Uint8Array(5 * 1024 * 1024 + 1)], "oversized.pdf"),
	], 0);
	assert.deepEqual(invalid.rejected.map(({reason}) => reason), ["formato não aceito", "maior que 5 MB"]);

	const capped = selectResumeFiles(Array.from({length: 51}, (_, index) => pdfFile(`candidate-${index}.pdf`)), 0);
	assert.equal(capped.accepted.length, 50, "an import should accept at most 50 PDFs");
	assert.equal(capped.rejected.length, 1);

	const files = ["attention.pdf", "complete.pdf", "invalid.pdf"].map((name, index) => ({
		id: `resume-${index}`,
		name,
		size: 8,
		format: "PDF" as const,
		source: pdfFile(name),
	}));
	const replies: (Profile | {message: string})[] = [
		{
			id: "profile-attention",
			name: "Ana Silva",
			description: null,
			skills: [],
			educationalBackground: [],
			qualityIssues: ["Confirme o nome extraído"],
		},
		{
			id: "profile-complete",
			name: "Bruno Lima",
			description: "Desenvolvedor",
			skills: [{skillId: "skill-1", skillName: "TypeScript"}],
			educationalBackground: [{id: "education-1"}],
		},
	];
	let requestIndex = 0;
	globalThis.fetch = async (input, init) => {
		assert.equal(String(input), "http://resume-import-selfcheck.invalid/profiles/upload-cv");
		assert.equal(init?.method, "POST");
		assert.ok(init?.body instanceof FormData);
		assert.ok((init.body as FormData).get("cv") instanceof File, "the CV should be sent in the cv form field");

		const currentIndex = requestIndex++;
		if (currentIndex === 2) return Response.json({message: "PDF inválido"}, {status: 422});
		return Response.json(replies[currentIndex]);
	};

	const progress: string[] = [];
	const results = await importResumes(files, ({status}) => progress.push(status));
	assert.deepEqual(results.map(({outcome}) => outcome), ["attention", "done", "failed"]);
	assert.equal(results[0]?.profileId, "profile-attention");
	assert.deepEqual(results[0]?.issues, [
		"Confirme o nome extraído",
		"Resumo profissional não identificado",
		"Competências não identificadas",
		"Formação acadêmica não identificada; revise se aplicável",
	]);
	assert.equal(results[1]?.profileId, "profile-complete");
	assert.deepEqual(results[2]?.issues, ["PDF inválido"]);
	assert.deepEqual(progress, ["processing", "attention", "processing", "done", "processing", "failed"]);

	globalThis.fetch = async () => Response.json({message: "Sessão expirada"}, {status: 401});
	await assert.rejects(
		importResumes([files[0]!], () => undefined),
		(error: unknown) => typeof error === "object" && error !== null && "kind" in error && error.kind === "unauthorized",
		"an expired session should stop the batch instead of becoming a file failure",
	);

	const aborted = new AbortController();
	aborted.abort();
	await assert.rejects(importResumes([files[0]!], () => undefined, aborted.signal), {name: "AbortError"});

	console.log("Resume import self-check passed (file limits, warnings, per-file errors, auth failure, and cancellation).");
} finally {
	globalThis.fetch = originalFetch;
	await vite.close();
	if (originalApiUrl === undefined) delete process.env.VITE_API_URL;
	else process.env.VITE_API_URL = originalApiUrl;
}
