import type {InputHTMLAttributes, JSX} from "react";
import {RiCloseLine, RiSearchLine} from "@remixicon/react";

export type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
	value: string;
	onChange: (value: string) => void;
	/** Usado como placeholder e como rótulo acessível. */
	label: string;
};

/** Campo de busca das barras de listagem: ícone, limpar e altura compacta (36px). */
export default function SearchInput({value, onChange, label, className, ...rest}: SearchInputProps): JSX.Element {
	return (
		<label className={["tl-search", className].filter(Boolean).join(" ")}>
			<RiSearchLine aria-hidden="true" className="text-base-content/45 size-4 shrink-0" />
			<input
				type="search"
				aria-label={label}
				placeholder={label}
				value={value}
				onChange={(event) => onChange(event.target.value)}
				className="placeholder:text-base-content/45 min-w-0 flex-1 bg-transparent text-sm outline-none focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
				{...rest}
			/>
			{value && (
				<button
					type="button"
					aria-label="Limpar busca"
					onClick={() => onChange("")}
					className="text-base-content/45 hover:text-base-content -mr-1 grid size-6 shrink-0 place-items-center rounded-md">
					<RiCloseLine className="size-4" />
				</button>
			)}
		</label>
	);
}
