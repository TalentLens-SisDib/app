import {sanitizeHtml, toSafeHtml} from "./richText";

/**
 * Importação de transcrições feita só no navegador: o arquivo vira HTML
 * para o editor rich text e nada é enviado à API além do texto final.
 */

export const TRANSCRIPT_EXTENSIONS = [".txt", ".md", ".docx", ".vtt", ".srt"] as const;
export const TRANSCRIPT_ACCEPT = TRANSCRIPT_EXTENSIONS.join(",");

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export class TranscriptImportError extends Error {}

function extensionOf(name: string): string {
	const dot = name.lastIndexOf(".");
	return dot >= 0 ? name.slice(dot).toLowerCase() : "";
}

function escapeHtml(value: string): string {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Lê como UTF-8 e, se aparecerem caracteres inválidos, tenta Windows-1252 —
 * comum em .txt salvos pelo Bloco de Notas antigo.
 */
async function readText(file: File): Promise<string> {
	const buffer = await file.arrayBuffer();
	const utf8 = new TextDecoder("utf-8").decode(buffer);
	if (!utf8.includes("\uFFFD")) return utf8.replace(/^\uFEFF/, "");
	return new TextDecoder("windows-1252").decode(buffer);
}

type Cue = {speaker: string | null; text: string};

/**
 * Legendas exportadas por Teams/Zoom/Meet (.vtt/.srt): descarta numeração e
 * tempos, identifica quem fala (`<v Nome>` ou `Nome: texto`) e junta falas
 * seguidas da mesma pessoa em um parágrafo.
 */
function parseCaptions(content: string): string {
	const cues: Cue[] = [];

	for (const block of content.replace(/\r\n?/g, "\n").split(/\n{2,}/)) {
		const lines = block
			.split("\n")
			.map((line) => line.trim())
			.filter(Boolean);
		if (lines.length === 0 || /^(WEBVTT|NOTE|STYLE|REGION)\b/.test(lines[0])) continue;

		const textLines = lines.filter((line) => !line.includes("-->") && !/^\d+$/.test(line));
		if (textLines.length === 0) continue;

		let raw = textLines.join(" ");
		let speaker: string | null = null;

		const voice = raw.match(/<v(?:\.[^\s>]+)?\s+([^>]+)>/);
		if (voice) {
			speaker = voice[1].trim();
		} else {
			const prefix = raw.match(/^([^:]{1,40}):\s+(.*)$/);
			if (prefix) {
				speaker = prefix[1].trim();
				raw = prefix[2];
			}
		}

		const text = raw.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
		if (!text) continue;

		const last = cues[cues.length - 1];
		if (last && last.speaker === speaker) last.text += ` ${text}`;
		else cues.push({speaker, text});
	}

	if (cues.length === 0) throw new TranscriptImportError("Nenhuma fala encontrada no arquivo de legenda.");

	return cues
		.map(({speaker, text}) =>
			speaker
				? `<p><strong>${escapeHtml(speaker)}:</strong> ${escapeHtml(text)}</p>`
				: `<p>${escapeHtml(text)}</p>`,
		)
		.join("");
}

async function parseDocx(file: File): Promise<string> {
	// Carregado sob demanda: só quem importa .docx baixa o conversor.
	const mammoth = await import("mammoth");
	const result = await mammoth.convertToHtml(
		{arrayBuffer: await file.arrayBuffer()},
		{
			// O editor só tem dois níveis de título.
			styleMap: [
				"p[style-name='Title'] => h2:fresh",
				"p[style-name='Heading 1'] => h2:fresh",
				"p[style-name='Heading 2'] => h3:fresh",
				"p[style-name='Heading 3'] => h3:fresh",
			],
		},
	);
	// Documentos sem estilos nomeados caem no mapeamento padrão (h1, h4...).
	return result.value
		.replace(/<(\/?)h1>/g, "<$1h2>")
		.replace(/<(\/?)h[4-6]>/g, "<$1h3>");
}

/** Converte o arquivo em HTML seguro para o `RichTextEditor`. */
export async function importTranscript(file: File): Promise<string> {
	const extension = extensionOf(file.name);

	if (extension === ".doc")
		throw new TranscriptImportError(
			"Arquivos .doc (Word 97-2003) não são suportados. Salve como .docx e tente novamente.",
		);
	if (!(TRANSCRIPT_EXTENSIONS as readonly string[]).includes(extension))
		throw new TranscriptImportError(
			`Formato não suportado. Use ${TRANSCRIPT_EXTENSIONS.join(", ")}.`,
		);
	if (file.size > MAX_SIZE_BYTES)
		throw new TranscriptImportError("O arquivo passa do limite de 10 MB.");

	let html: string;
	try {
		if (extension === ".docx") html = await parseDocx(file);
		else if (extension === ".vtt" || extension === ".srt") html = parseCaptions(await readText(file));
		else html = toSafeHtml(await readText(file));
	} catch (error) {
		if (error instanceof TranscriptImportError) throw error;
		throw new TranscriptImportError("Não foi possível ler o arquivo. Ele pode estar corrompido.");
	}

	const safe = sanitizeHtml(html);
	if (!new DOMParser().parseFromString(safe, "text/html").body.textContent?.trim())
		throw new TranscriptImportError("O arquivo não tem texto para importar.");
	return safe;
}
