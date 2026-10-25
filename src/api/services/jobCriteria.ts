import {ApiError} from "../errors.ts";
import type {JobCriterion, JobCriterionInput} from "../../types/jobCriterion.ts";

const STORAGE_KEY = "mock_job_evaluation_criteria";
export const CRITERION_NAME_MAX_LENGTH = 200;
export const CRITERION_DESCRIPTION_MAX_LENGTH = 2000;
// shortcut: criteria stay in this browser until the API supports them; migrate this service when it does.

function storageError(): ApiError {
	return new ApiError(
		"Não foi possível acessar o armazenamento deste navegador. Tente novamente.",
		"server",
	);
}

function isCriterion(value: unknown): value is JobCriterion {
	if (!value || typeof value !== "object") return false;
	const criterion = value as Record<string, unknown>;
	return (
		typeof criterion.id === "string" &&
		typeof criterion.jobOpeningId === "string" &&
		typeof criterion.name === "string" &&
		typeof criterion.description === "string" &&
		typeof criterion.createdAt === "string" &&
		typeof criterion.updatedAt === "string"
	);
}

function read(): JobCriterion[] {
	let raw: string | null;
	try {
		raw = window.localStorage.getItem(STORAGE_KEY);
	} catch {
		throw storageError();
	}
	if (raw === null) return [];

	let value: unknown;
	try {
		value = JSON.parse(raw);
	} catch {
		throw new ApiError(
			"Os critérios salvos neste navegador estão corrompidos. Os dados foram preservados.",
			"server",
		);
	}
	if (!Array.isArray(value) || !value.every(isCriterion))
		throw new ApiError(
			"Os critérios salvos neste navegador estão inválidos. Os dados foram preservados.",
			"server",
		);
	return value;
}

function write(criteria: JobCriterion[]): void {
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(criteria));
	} catch {
		throw storageError();
	}
}

function normalize(input: JobCriterionInput): Pick<JobCriterion, "name" | "description"> {
	const name = input.name.trim();
	const description = input.description?.trim() ?? "";
	if (!name)
		throw new ApiError("Informe o nome do critério.", "validation", 400);
	if (name.length > CRITERION_NAME_MAX_LENGTH)
		throw new ApiError("O nome deve ter no máximo 200 caracteres.", "validation", 400);
	if (description.length > CRITERION_DESCRIPTION_MAX_LENGTH)
		throw new ApiError("A descrição deve ter no máximo 2000 caracteres.", "validation", 400);
	return {name, description};
}

/** Critérios em localStorage enquanto a API ainda não oferece esse recurso. */
export async function getJobCriteria(jobOpeningId: string): Promise<JobCriterion[]> {
	return read().filter((criterion) => criterion.jobOpeningId === jobOpeningId);
}

export async function createJobCriterion(
	jobOpeningId: string,
	input: JobCriterionInput,
): Promise<JobCriterion> {
	const {name, description} = normalize(input);
	const criteria = read();
	const now = new Date().toISOString();
	const criterion: JobCriterion = {
		id: crypto.randomUUID(),
		jobOpeningId,
		name,
		description,
		createdAt: now,
		updatedAt: now,
	};
	write([...criteria, criterion]);
	return criterion;
}

export async function updateJobCriterion(
	jobOpeningId: string,
	id: string,
	input: JobCriterionInput,
): Promise<JobCriterion> {
	const {name, description} = normalize(input);
	const criteria = read();
	const current = criteria.find(
		(criterion) => criterion.jobOpeningId === jobOpeningId && criterion.id === id,
	);
	if (!current) throw new ApiError("Critério não encontrado.", "not_found", 404);
	const updated = {...current, name, description, updatedAt: new Date().toISOString()};
	write(
		criteria.map((criterion) =>
			criterion.jobOpeningId === jobOpeningId && criterion.id === id ? updated : criterion,
		),
	);
	return updated;
}

export async function deleteJobCriterion(jobOpeningId: string, id: string): Promise<void> {
	const criteria = read();
	const next = criteria.filter(
		(criterion) => !(criterion.jobOpeningId === jobOpeningId && criterion.id === id),
	);
	if (next.length === criteria.length) throw new ApiError("Critério não encontrado.", "not_found", 404);
	write(next);
}
