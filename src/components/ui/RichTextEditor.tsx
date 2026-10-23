import {useEffect, useId, type JSX, type ReactNode} from "react";
import {EditorContent, useEditor, useEditorState, type Editor} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
	RiArrowGoBackLine,
	RiArrowGoForwardLine,
	RiBold,
	RiDoubleQuotesL,
	RiH2,
	RiH3,
	RiItalic,
	RiListOrdered2,
	RiListUnordered,
	RiUnderline,
} from "@remixicon/react";
import {isRichText, toSafeHtml} from "../../utils/richText";

export type RichTextEditorProps = {
	label?: string;
	/** HTML; texto puro legado é convertido em parágrafos ao carregar. */
	value: string;
	/** Recebe `""` quando o conteúdo fica vazio, para a validação de obrigatório funcionar. */
	onChange: (html: string) => void;
	placeholder?: string;
	error?: string;
	helperText?: string;
	required?: boolean;
	disabled?: boolean;
	/** Conteúdo à direita do label (ex.: botão de importar arquivo). */
	labelAction?: ReactNode;
	/** Altura mínima da área de edição (classe Tailwind). */
	minHeightClass?: string;
};

type ToolbarButtonProps = {
	label: string;
	active?: boolean;
	disabled?: boolean;
	onClick: () => void;
	children: ReactNode;
};

function ToolbarButton({label, active, disabled, onClick, children}: ToolbarButtonProps): JSX.Element {
	return (
		<button
			type="button"
			aria-label={label}
			aria-pressed={active}
			title={label}
			disabled={disabled}
			// Evita tirar o foco do editor (e perder a seleção) ao clicar.
			onMouseDown={(event) => event.preventDefault()}
			onClick={onClick}
			className={["btn btn-ghost btn-xs btn-square", active && "btn-active text-primary"]
				.filter(Boolean)
				.join(" ")}>
			{children}
		</button>
	);
}

function Toolbar({editor, disabled}: {editor: Editor; disabled?: boolean}): JSX.Element {
	const state = useEditorState({
		editor,
		selector: ({editor: current}) => ({
			bold: current.isActive("bold"),
			italic: current.isActive("italic"),
			underline: current.isActive("underline"),
			h2: current.isActive("heading", {level: 2}),
			h3: current.isActive("heading", {level: 3}),
			bulletList: current.isActive("bulletList"),
			orderedList: current.isActive("orderedList"),
			blockquote: current.isActive("blockquote"),
			canUndo: current.can().undo(),
			canRedo: current.can().redo(),
		}),
	});
	const chain = () => editor.chain().focus();

	return (
		<div
			role="toolbar"
			aria-label="Formatação"
			className="border-base-300 bg-base-200/50 flex flex-wrap items-center gap-0.5 border-b px-1.5 py-1">
			<ToolbarButton label="Negrito" active={state.bold} disabled={disabled} onClick={() => chain().toggleBold().run()}>
				<RiBold className="size-4" />
			</ToolbarButton>
			<ToolbarButton label="Itálico" active={state.italic} disabled={disabled} onClick={() => chain().toggleItalic().run()}>
				<RiItalic className="size-4" />
			</ToolbarButton>
			<ToolbarButton label="Sublinhado" active={state.underline} disabled={disabled} onClick={() => chain().toggleUnderline().run()}>
				<RiUnderline className="size-4" />
			</ToolbarButton>
			<span className="bg-base-300 mx-1 h-5 w-px" aria-hidden="true" />
			<ToolbarButton label="Título" active={state.h2} disabled={disabled} onClick={() => chain().toggleHeading({level: 2}).run()}>
				<RiH2 className="size-4" />
			</ToolbarButton>
			<ToolbarButton label="Subtítulo" active={state.h3} disabled={disabled} onClick={() => chain().toggleHeading({level: 3}).run()}>
				<RiH3 className="size-4" />
			</ToolbarButton>
			<span className="bg-base-300 mx-1 h-5 w-px" aria-hidden="true" />
			<ToolbarButton label="Lista" active={state.bulletList} disabled={disabled} onClick={() => chain().toggleBulletList().run()}>
				<RiListUnordered className="size-4" />
			</ToolbarButton>
			<ToolbarButton label="Lista numerada" active={state.orderedList} disabled={disabled} onClick={() => chain().toggleOrderedList().run()}>
				<RiListOrdered2 className="size-4" />
			</ToolbarButton>
			<ToolbarButton label="Citação" active={state.blockquote} disabled={disabled} onClick={() => chain().toggleBlockquote().run()}>
				<RiDoubleQuotesL className="size-4" />
			</ToolbarButton>
			<span className="ml-auto flex gap-0.5">
				<ToolbarButton label="Desfazer" disabled={disabled || !state.canUndo} onClick={() => chain().undo().run()}>
					<RiArrowGoBackLine className="size-4" />
				</ToolbarButton>
				<ToolbarButton label="Refazer" disabled={disabled || !state.canRedo} onClick={() => chain().redo().run()}>
					<RiArrowGoForwardLine className="size-4" />
				</ToolbarButton>
			</span>
		</div>
	);
}

function toEditorContent(value: string): string {
	return value ? (isRichText(value) ? value : toSafeHtml(value)) : "";
}

/**
 * Editor rich text (Tiptap) com o mesmo contrato de campo do `Input`.
 * Controlado: um `value` diferente do conteúdo atual (ex.: arquivo importado)
 * substitui o conteúdo como uma transação comum — Ctrl+Z desfaz.
 */
export default function RichTextEditor({
	label,
	value,
	onChange,
	placeholder,
	error,
	helperText,
	required,
	disabled,
	labelAction,
	minHeightClass = "min-h-36",
}: RichTextEditorProps): JSX.Element {
	const fieldId = useId();
	const describedBy = error ? `${fieldId}-error` : helperText ? `${fieldId}-helper` : undefined;

	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				heading: {levels: [2, 3]},
				code: false,
				codeBlock: false,
				link: {openOnClick: false},
			}),
			Placeholder.configure({placeholder}),
		],
		content: toEditorContent(value),
		editable: !disabled,
		editorProps: {
			attributes: {
				id: fieldId,
				role: "textbox",
				"aria-multiline": "true",
				...(label ? {"aria-labelledby": `${fieldId}-label`} : {}),
				...(describedBy ? {"aria-describedby": describedBy} : {}),
				...(error ? {"aria-invalid": "true"} : {}),
				class: `tl-rich-text ${minHeightClass} max-h-[28rem] overflow-y-auto px-3 py-2.5 text-sm outline-none`,
			},
		},
		onUpdate: ({editor: current}) => onChange(current.isEmpty ? "" : current.getHTML()),
	});

	// Durante a digitação `value` já é o próprio HTML do editor, então isto só age
	// quando o conteúdo muda por fora.
	useEffect(() => {
		if (!editor) return;
		const current = editor.isEmpty ? "" : editor.getHTML();
		if (value !== current) editor.commands.setContent(toEditorContent(value), {emitUpdate: false});
	}, [editor, value]);

	useEffect(() => {
		editor?.setEditable(!disabled, false);
	}, [editor, disabled]);

	return (
		<div className="ds-field">
			{(label || labelAction) && (
				<div className="mb-1 flex items-end justify-between gap-2">
					{label && (
						<label id={`${fieldId}-label`} className="ds-field-label mb-0">
							{label}
							{required && <span className="text-error"> *</span>}
						</label>
					)}
					{labelAction}
				</div>
			)}
			<div
				className={[
					"rounded-field bg-base-100 overflow-hidden border transition-colors",
					"focus-within:outline-primary focus-within:outline-2 focus-within:outline-offset-2",
					error ? "border-error" : "border-base-content/20",
				].join(" ")}>
				{editor && <Toolbar editor={editor} disabled={disabled} />}
				<EditorContent editor={editor} />
			</div>
			{error ? (
				<p id={`${fieldId}-error`} role="alert" className="ds-field-note ds-field-note-error">{error}</p>
			) : helperText ? (
				<p id={`${fieldId}-helper`} className="ds-field-note ds-field-note-muted">{helperText}</p>
			) : null}
		</div>
	);
}
