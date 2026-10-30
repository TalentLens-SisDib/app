import type {JobOpening} from "../types/jobOpening";
import type {Profile} from "../types/profile";
import {matchSkills} from "./skillMatch";

const DAY_MS = 24 * 60 * 60 * 1000;
export const WINDOW_DAYS = 30;
export const ACTIVITY_WEEKS = 12;
const TOP_SKILLS = 8;

export type PeriodCount = {
	/** Últimos `WINDOW_DAYS` dias. */
	current: number;
	/** Os `WINDOW_DAYS` dias anteriores, para comparação. */
	previous: number;
};

export type Overview = {
	candidates: number;
	newCandidates: PeriodCount;
	jobOpenings: number;
	applications: number;
	/** Candidatos que ainda não estão em nenhuma vaga. */
	unlinkedCandidates: number;
	interviews: number;
	recentInterviews: PeriodCount;
};

export type ActivityWeek = {
	/** Segunda-feira da semana (ISO, só a data). */
	weekStart: string;
	candidates: number;
	interviews: number;
};

export type JobPipeline = {
	id: string;
	name: string;
	/** Candidatos com todas as competências obrigatórias da vaga. */
	qualified: number;
	/** Candidatos a quem falta ao menos uma obrigatória. */
	missing: number;
	total: number;
	hasRequiredSkills: boolean;
};

export type SkillCoverage = {
	skillId: string;
	name: string;
	/** Vagas que exigem a competência como obrigatória. */
	jobs: number;
	/** Candidatos que têm a competência. */
	candidates: number;
	/** 0–100. */
	percent: number;
};

function toTime(iso: string): number {
	const time = new Date(iso).getTime();
	return Number.isNaN(time) ? NaN : time;
}

function countInPeriod(dates: string[], now: number): PeriodCount {
	const start = now - WINDOW_DAYS * DAY_MS;
	const previousStart = start - WINDOW_DAYS * DAY_MS;
	let current = 0;
	let previous = 0;
	for (const iso of dates) {
		const time = toTime(iso);
		if (time > start && time <= now) current++;
		else if (time > previousStart && time <= start) previous++;
	}
	return {current, previous};
}

function interviewDates(profiles: Profile[]): string[] {
	return profiles.flatMap((profile) =>
		(profile.profileInterviews ?? []).map((interview) => interview.startDate),
	);
}

/**
 * `GET /profiles` não filtra por empresa, mas `GET /job-openings` sim: só contam
 * candidaturas para vagas que o usuário enxerga.
 */
function visibleApplications(profile: Profile, jobIds: Set<string>) {
	return (profile.applications ?? []).filter((application) => jobIds.has(application.jobOpeningId));
}

export function buildOverview(profiles: Profile[], jobOpenings: JobOpening[], now = Date.now()): Overview {
	const jobIds = new Set(jobOpenings.map((job) => job.id));
	const applicationsPerProfile = profiles.map((profile) => visibleApplications(profile, jobIds).length);
	const interviews = interviewDates(profiles);

	return {
		candidates: profiles.length,
		newCandidates: countInPeriod(profiles.map((profile) => profile.createdAt), now),
		jobOpenings: jobOpenings.length,
		applications: applicationsPerProfile.reduce((sum, count) => sum + count, 0),
		unlinkedCandidates: applicationsPerProfile.filter((count) => count === 0).length,
		interviews: interviews.length,
		recentInterviews: countInPeriod(interviews, now),
	};
}

function startOfWeek(time: number): Date {
	const date = new Date(time);
	date.setHours(0, 0, 0, 0);
	// getDay(): domingo = 0; a semana começa na segunda.
	date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
	return date;
}

function toDateKey(date: Date): string {
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${date.getFullYear()}-${month}-${day}`;
}

/** Novos candidatos e entrevistas por semana, nas últimas `ACTIVITY_WEEKS` semanas. */
export function buildActivity(profiles: Profile[], now = Date.now()): ActivityWeek[] {
	const firstWeek = startOfWeek(now);
	firstWeek.setDate(firstWeek.getDate() - (ACTIVITY_WEEKS - 1) * 7);

	const weeks = new Map<string, ActivityWeek>();
	for (let index = 0; index < ACTIVITY_WEEKS; index++) {
		const week = new Date(firstWeek);
		week.setDate(firstWeek.getDate() + index * 7);
		const key = toDateKey(week);
		weeks.set(key, {weekStart: key, candidates: 0, interviews: 0});
	}

	function bump(iso: string, field: "candidates" | "interviews") {
		const time = toTime(iso);
		if (Number.isNaN(time) || time > now) return;
		const week = weeks.get(toDateKey(startOfWeek(time)));
		if (week) week[field]++;
	}

	for (const profile of profiles) bump(profile.createdAt, "candidates");
	for (const iso of interviewDates(profiles)) bump(iso, "interviews");

	return [...weeks.values()];
}

/** Vagas com candidatos (mais candidatos primeiro), separando quem atende às competências obrigatórias. */
export function buildJobPipelines(profiles: Profile[], jobOpenings: JobOpening[]): JobPipeline[] {
	const profilesByJob = new Map<string, Profile[]>();
	for (const profile of profiles) {
		for (const application of profile.applications ?? []) {
			const list = profilesByJob.get(application.jobOpeningId) ?? [];
			list.push(profile);
			profilesByJob.set(application.jobOpeningId, list);
		}
	}

	return jobOpenings
		.map((job) => {
			const linked = profilesByJob.get(job.id) ?? [];
			const hasRequiredSkills = (job.skills ?? []).some((skill) => skill.isRequired);
			const qualified = linked.filter((profile) => {
				const match = matchSkills(job, profile);
				return match.requiredMatched === match.requiredTotal;
			}).length;
			return {
				id: job.id,
				name: job.name,
				qualified,
				missing: linked.length - qualified,
				total: linked.length,
				hasRequiredSkills,
			};
		})
		.filter((job) => job.total > 0)
		.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, "pt-BR"));
}

/** Vagas sem nenhum candidato vinculado, das mais antigas para as mais recentes. */
export function findEmptyJobs(profiles: Profile[], jobOpenings: JobOpening[]): JobOpening[] {
	const linkedJobIds = new Set(
		profiles.flatMap((profile) => (profile.applications ?? []).map((application) => application.jobOpeningId)),
	);
	return jobOpenings
		.filter((job) => !linkedJobIds.has(job.id))
		.sort((a, b) => toTime(a.createdAt) - toTime(b.createdAt));
}

/** Competências obrigatórias mais exigidas nas vagas e quantos candidatos as têm. */
export function buildSkillCoverage(profiles: Profile[], jobOpenings: JobOpening[]): SkillCoverage[] {
	const demand = new Map<string, {name: string; jobs: number}>();
	for (const job of jobOpenings) {
		for (const skill of job.skills ?? []) {
			if (!skill.isRequired) continue;
			const entry = demand.get(skill.skillId) ?? {name: skill.skillName, jobs: 0};
			entry.jobs++;
			demand.set(skill.skillId, entry);
		}
	}

	const supply = new Map<string, number>();
	for (const profile of profiles) {
		for (const skill of profile.skills ?? []) {
			supply.set(skill.skillId, (supply.get(skill.skillId) ?? 0) + 1);
		}
	}

	return [...demand.entries()]
		.map(([skillId, {name, jobs}]) => {
			const candidates = supply.get(skillId) ?? 0;
			return {
				skillId,
				name,
				jobs,
				candidates,
				percent: profiles.length > 0 ? Math.round((candidates / profiles.length) * 100) : 0,
			};
		})
		.sort((a, b) => b.jobs - a.jobs || a.name.localeCompare(b.name, "pt-BR"))
		.slice(0, TOP_SKILLS);
}

/** Candidatos mais recentes primeiro. */
export function latestProfiles(profiles: Profile[], limit = 6): Profile[] {
	return [...profiles].sort((a, b) => toTime(b.createdAt) - toTime(a.createdAt)).slice(0, limit);
}
