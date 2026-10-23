import type {CreateApplicationInput, JobApplication} from "../../types/application";
import {ApiError} from "../errors";

// Mock: a API ainda não expõe candidaturas (o model `JobApplication` existe no
// banco, mas sem endpoints). As funções seguem o contrato proposto:
//   GET    /job-openings/{id}/applications
//   POST   /job-openings/{id}/applications            {profileId}
//   DELETE /job-openings/{id}/applications/{profileId}
// Quando a API existir, troque o corpo por chamadas em `apiClient` — a assinatura
// não muda. Os dados ficam em localStorage para sobreviver ao recarregar a página.

const STORAGE_KEY = "mock_job_applications";

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function read(): JobApplication[] {
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		return raw ? (JSON.parse(raw) as JobApplication[]) : [];
	} catch {
		return [];
	}
}

function write(applications: JobApplication[]): void {
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
	} catch {
		// localStorage indisponível — o vínculo vale só até recarregar a página.
	}
}

export async function getApplications(jobOpeningId: string): Promise<JobApplication[]> {
	await delay(250);
	return read().filter((item) => item.jobOpeningId === jobOpeningId);
}

/** Na API real, vem em `GET /profiles/{id}` (campo `applications`). */
export async function getProfileApplications(profileId: string): Promise<JobApplication[]> {
	await delay(250);
	return read().filter((item) => item.profileId === profileId);
}

export async function createApplication(
	jobOpeningId: string,
	data: CreateApplicationInput,
): Promise<JobApplication> {
	await delay(300);
	const applications = read();
	if (applications.some((item) => item.jobOpeningId === jobOpeningId && item.profileId === data.profileId))
		throw new ApiError("O candidato já está vinculado a essa vaga.", "unknown", 409);

	const application: JobApplication = {
		profileId: data.profileId,
		profileName: data.profileName,
		jobOpeningId,
		appliedAt: new Date().toISOString(),
	};
	write([...applications, application]);
	return application;
}

export async function deleteApplication(jobOpeningId: string, profileId: string): Promise<void> {
	await delay(300);
	const applications = read();
	const next = applications.filter(
		(item) => !(item.jobOpeningId === jobOpeningId && item.profileId === profileId),
	);
	if (next.length === applications.length)
		throw new ApiError("Candidatura não encontrada.", "not_found", 404);
	write(next);
}
