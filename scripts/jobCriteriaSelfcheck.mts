import assert from "node:assert/strict";
import {ApiError} from "../src/api/errors.ts";
import {
	createJobCriterion,
	deleteJobCriterion,
	getJobCriteria,
	updateJobCriterion,
} from "../src/api/services/jobCriteria.ts";

const key = "mock_job_evaluation_criteria";
const values = new Map<string, string>();
let failWrites = false;
const localStorage = {
	getItem: (name: string) => values.get(name) ?? null,
	setItem: (name: string, value: string) => {
		if (failWrites) throw new Error("quota exceeded");
		values.set(name, value);
	},
};
Object.defineProperty(globalThis, "window", {configurable: true, value: {localStorage}});

const first = await createJobCriterion("job-a", {
	name: "  Comunicação  ",
	description: "  Clareza nas respostas  ",
});
const otherJob = await createJobCriterion("job-b", {name: "Conhecimento técnico"});
assert.equal(first.name, "Comunicação");
assert.equal(first.description, "Clareza nas respostas");
assert.deepEqual((await getJobCriteria("job-a")).map(({id}) => id), [first.id]);
assert.deepEqual((await getJobCriteria("job-b")).map(({id}) => id), [otherJob.id]);

await updateJobCriterion("job-a", first.id, {name: "Colaboração", description: "Trabalho em equipe"});
assert.equal((await getJobCriteria("job-a"))[0]?.name, "Colaboração");
await deleteJobCriterion("job-a", first.id);
assert.deepEqual(await getJobCriteria("job-a"), []);
assert.equal((await getJobCriteria("job-b"))[0]?.id, otherJob.id);

await assert.rejects(createJobCriterion("job-a", {name: "   "}), (error: unknown) =>
	error instanceof ApiError && error.kind === "validation",
);
const saved = values.get(key);
failWrites = true;
await assert.rejects(createJobCriterion("job-a", {name: "Outro critério"}), ApiError);
assert.equal(values.get(key), saved, "write errors must preserve existing data");

failWrites = false;
values.set(key, "{broken");
await assert.rejects(getJobCriteria("job-a"), ApiError);
assert.equal(values.get(key), "{broken", "corrupt data must not be silently removed");

console.log("Job criteria self-check passed (CRUD, job isolation, reload, validation, and storage errors).");
