import type {JSX} from "react";
import Input, {type InputProps} from "./Input";

export type CurrencyInputProps = Omit<InputProps, "value" | "onChange" | "type"> & {
	/** Valor em reais; `null` quando o campo está vazio. */
	value: number | null;
	onChange: (value: number | null) => void;
};

const formatter = new Intl.NumberFormat("pt-BR", {style: "currency", currency: "BRL"});

/**
 * Campo monetário com máscara em reais. A digitação preenche da direita para
 * a esquerda pelos centavos ("1", "12", "123" → R$ 0,01 / 0,12 / 1,23).
 */
export default function CurrencyInput({value, onChange, ...rest}: CurrencyInputProps): JSX.Element {
	return (
		<Input
			{...rest}
			type="text"
			inputMode="numeric"
			autoComplete="off"
			value={value === null ? "" : formatter.format(value)}
			onChange={(event) => {
				const digits = event.target.value.replace(/\D/g, "").slice(0, 13);
				onChange(digits ? Number(digits) / 100 : null);
			}}
		/>
	);
}
