import {useState, type JSX, type SubmitEvent} from "react";
import {RiAddLine, RiDeleteBinLine} from "@remixicon/react";
import {Alert, Button, Input, TagInput, Textarea} from "../ui";
import {isApiError} from "../../api/errors";
import type {Profile, UpdateProfileInput} from "../../types/profile";

type EducationDraft = {
	key: string;
	institution: string;
	degree: string;
	startDate: string;
	endDate: string;
};

export type ProfileEditorProps = {
	profile: Profile;
	onCancel: () => void;
	onSubmit: (data: UpdateProfileInput) => Promise<void>;
};

function dateInputValue(value: string | null | undefined): string {
	return value?.slice(0, 10) ?? "";
}

export default function ProfileEditor({profile, onCancel, onSubmit}: ProfileEditorProps): JSX.Element {
	const [name, setName] = useState(profile.name);
	const [description, setDescription] = useState(profile.description ?? "");
	const [skills, setSkills] = useState(profile.skills?.map((skill) => skill.skillName) ?? []);
	const [culturalFits, setCulturalFits] = useState(
		profile.culturalFits?.map((fit) => fit.culturalFitName) ?? [],
	);
	const [education, setEducation] = useState<EducationDraft[]>(
		(profile.educationalBackground ?? []).map((item) => ({
			key: item.id,
			institution: item.institution,
			degree: item.degree,
			startDate: dateInputValue(item.startDate),
			endDate: dateInputValue(item.endDate),
		})),
	);
	const [formError, setFormError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	function updateEducation(index: number, field: keyof Omit<EducationDraft, "key">, value: string) {
		setEducation((current) => current.map((item, itemIndex) =>
			itemIndex === index ? {...item, [field]: value} : item,
		));
	}

	function addEducation() {
		setEducation((current) => [
			...current,
			{key: `new-${Date.now()}-${current.length}`, institution: "", degree: "", startDate: "", endDate: ""},
		]);
	}

	function removeEducation(index: number) {
		setEducation((current) => current.filter((_item, itemIndex) => itemIndex !== index));
	}

	async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault();
		if (submitting) return;
		setFormError(null);

		if (!name.trim()) {
			setFormError("Informe o nome do candidato.");
			return;
		}

		const incompleteEducation = education.some(
			(item) => !item.institution.trim() || !item.degree.trim() || !item.startDate,
		);
		if (incompleteEducation) {
			setFormError("Preencha instituição, curso e início de cada formação ou remova a linha incompleta.");
			return;
		}

		const invalidEducationDate = education.some(
			(item) => item.endDate && item.endDate < item.startDate,
		);
		if (invalidEducationDate) {
			setFormError("A data de término da formação não pode ser anterior à data de início.");
			return;
		}

		const payload: UpdateProfileInput = {
			name: name.trim(),
			description: description.trim(),
			skills,
			culturalFits,
			educationalBackground: education.map(({institution, degree, startDate, endDate}) => ({
				institution: institution.trim(),
				degree: degree.trim(),
				startDate,
				endDate: endDate || null,
			})),
		};

		setSubmitting(true);
		try {
			await onSubmit(payload);
		} catch (error) {
			setFormError(isApiError(error) ? error.message : "Não foi possível salvar o perfil. Tente novamente.");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<form noValidate onSubmit={handleSubmit} className="space-y-5">
			{formError && <Alert variant="error" title="Revise os dados do perfil">{formError}</Alert>}

			<Input
				label="Nome do candidato"
				value={name}
				required
				maxLength={200}
				disabled={submitting}
				onChange={(event) => setName(event.target.value)}
			/>
			<Textarea
				label="Resumo do perfil"
				value={description}
				maxLength={2000}
				rows={5}
				helperText="Descreva a experiência e os principais pontos do perfil do candidato."
				disabled={submitting}
				onChange={(event) => setDescription(event.target.value)}
			/>
			<TagInput
				label="Competências"
				value={skills}
				onChange={setSkills}
				placeholder="Digite uma competência e pressione Enter"
				maxLength={100}
				disabled={submitting}
				helperText="Use Enter para adicionar e o × para remover competências."
			/>
			<TagInput
				label="Características comportamentais"
				value={culturalFits}
				onChange={setCulturalFits}
				placeholder="Digite uma característica e pressione Enter"
				maxLength={100}
				disabled={submitting}
			/>

			<section className="space-y-3" aria-labelledby="profile-education-title">
				<div className="flex items-center justify-between gap-3">
					<div>
						<h3 id="profile-education-title" className="font-semibold">Formação</h3>
						<p className="text-base-content/60 text-sm">Inclua ou corrija a formação acadêmica do candidato.</p>
					</div>
					<Button size="sm" variant="outline" disabled={submitting} onClick={addEducation}>
						<RiAddLine className="size-4" />
						Adicionar
					</Button>
				</div>

				{education.length === 0 ? (
					<p className="text-base-content/55 rounded-box border-base-300 border border-dashed px-3 py-4 text-sm">
						Nenhuma formação cadastrada.
					</p>
				) : (
					<div className="space-y-3">
						{education.map((item, index) => (
							<div key={item.key} className="border-base-300 rounded-box grid gap-3 border p-3 sm:grid-cols-2">
								<Input
									label="Instituição"
									value={item.institution}
									maxLength={200}
									disabled={submitting}
									onChange={(event) => updateEducation(index, "institution", event.target.value)}
								/>
								<Input
									label="Curso"
									value={item.degree}
									maxLength={200}
									disabled={submitting}
									onChange={(event) => updateEducation(index, "degree", event.target.value)}
								/>
								<Input
									label="Início"
									type="date"
									value={item.startDate}
									disabled={submitting}
									onChange={(event) => updateEducation(index, "startDate", event.target.value)}
								/>
								<Input
									label="Término"
									type="date"
									value={item.endDate}
									disabled={submitting}
									onChange={(event) => updateEducation(index, "endDate", event.target.value)}
								/>
								<div className="sm:col-span-2 sm:flex sm:justify-end">
									<Button
										variant="ghost"
										size="xs"
										className="text-error"
										disabled={submitting}
										onClick={() => removeEducation(index)}>
										<RiDeleteBinLine className="size-4" />
										Remover formação
									</Button>
								</div>
							</div>
						))}
					</div>
				)}
			</section>

			<div className="flex flex-col-reverse gap-2 border-t border-base-300 pt-4 sm:flex-row sm:justify-end">
				<Button variant="ghost" disabled={submitting} onClick={onCancel}>Cancelar</Button>
				<Button type="submit" loading={submitting}>Salvar perfil</Button>
			</div>
		</form>
	);
}
