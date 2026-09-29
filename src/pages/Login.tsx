import {useState, type FormEvent, type JSX} from "react";
import Brand from "../components/layout/Brand";
import {Alert, Button, Card, Input} from "../components/ui";

type FormErrors = {
	email?: string;
	password?: string;
};

export default function Login(): JSX.Element {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [remember, setRemember] = useState(false);
	const [errors, setErrors] = useState<FormErrors>({});
	const [loading, setLoading] = useState(false);
	const [authenticationError, setAuthenticationError] = useState(false);

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const nextErrors: FormErrors = {};
		if (!email.trim()) nextErrors.email = "Informe seu e-mail.";
		else if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = "Informe um e-mail válido.";
		if (!password) nextErrors.password = "Informe sua senha.";

		setErrors(nextErrors);
		setAuthenticationError(false);
		if (Object.keys(nextErrors).length > 0) return;

		setLoading(true);
		window.setTimeout(() => {
			setLoading(false);
			setAuthenticationError(true);
		}, 900);
	}

	return (
		<main className="grid min-h-svh bg-base-200 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
			<section className="relative hidden overflow-hidden bg-primary p-10 text-primary-content lg:flex lg:flex-col lg:justify-between xl:p-14">
				<div className="absolute inset-0 opacity-20" aria-hidden="true">
					<div className="absolute -top-24 -right-20 size-96 rounded-full border border-primary-content/70" />
					<div className="absolute top-28 -right-8 size-64 rounded-full border border-primary-content/60" />
					<div className="absolute -bottom-28 left-10 size-80 rounded-full border border-primary-content/50" />
				</div>

				<div className="relative z-10"><Brand inverse /></div>

				<div className="relative z-10 max-w-md space-y-6">
					<p className="text-primary-content/70 text-sm font-semibold tracking-[0.16em] uppercase">People intelligence</p>
					<h1 className="text-4xl font-bold tracking-tight xl:text-5xl">Veja melhor. Decida com confiança.</h1>
					<p className="max-w-sm text-base leading-7 text-primary-content/80">Um espaço claro para organizar sinais, avaliações e decisões sobre talentos.</p>
				</div>

				<div className="relative z-10 flex items-center gap-3 text-sm text-primary-content/70">
					<span className="size-2 rounded-full bg-accent" />
					Análises com mais contexto
				</div>
			</section>

			<section className="flex min-w-0 items-center justify-center bg-base-100 px-4 py-8 sm:px-8 lg:px-12">
				<div className="w-full max-w-md">
					<div className="mb-10 lg:hidden"><Brand /></div>
					<div className="mb-7 space-y-2">
						<h1 className="text-3xl font-bold tracking-tight">Entrar</h1>
						<p className="text-base-content/60 text-sm leading-6">Acesse sua conta para continuar.</p>
					</div>

					<Card variant="subtle" padding="lg">
						<form className="space-y-5" noValidate onSubmit={handleSubmit}>
							{authenticationError && (
								<Alert variant="error" title="Não foi possível entrar">
									Verifique seu e-mail e senha e tente novamente.
								</Alert>
							)}

							<Input
								label="E-mail"
								type="email"
								autoComplete="email"
								placeholder="voce@empresa.com"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								error={errors.email}
							/>
							<Input
								label="Senha"
								type="password"
								autoComplete="current-password"
								placeholder="••••••••"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								error={errors.password}
							/>

							<div className="flex flex-wrap items-center justify-between gap-3 text-sm">
								<label className="label cursor-pointer gap-2 p-0">
									<input type="checkbox" className="checkbox checkbox-primary checkbox-sm" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
									<span className="text-base-content/70">Lembrar de mim</span>
								</label>
								<a href="#recuperar-senha" className="link link-primary font-medium">Esqueci minha senha</a>
							</div>

							<Button type="submit" fullWidth loading={loading} disabled={!email || !password}>
								Entrar
							</Button>
						</form>
					</Card>
				</div>
			</section>
		</main>
	);
}
