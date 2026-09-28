import type {JSX} from "react";
import {Link} from "react-router-dom";
import Brand from "../components/layout/Brand";
import {Card} from "../components/ui";

export default function NotFound(): JSX.Element {
	return (
		<div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-base-200 px-4 py-10">
			<Brand />

			<Card variant="subtle" padding="lg" className="max-w-md text-center">
				<p className="text-primary text-sm font-semibold tracking-[0.16em] uppercase">
					Erro 404
				</p>
				<h1 className="mt-2 text-2xl font-bold tracking-tight">
					Página não encontrada
				</h1>
				<p className="text-base-content/60 mt-2 text-sm leading-6">
					O endereço acessado não existe ou foi movido.
				</p>
				<Link to="/" className="btn btn-primary mt-6 font-semibold shadow-none">
					Voltar para o início
				</Link>
			</Card>
		</div>
	);
}
