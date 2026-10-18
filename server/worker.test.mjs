import { test } from "node:test";
import assert from "node:assert/strict";
import { createWorker } from "./worker.ts";
const origin = "https://kendallw64.github.io";
const details = {
  name: "Alex Morgan",
  role: "Consultant",
  department: "Cloud",
  recipient: "Sam Rivera",
  type: "Transfer",
  due: "2026-12-01",
  responsibilities: "Lead a fictional migration",
};
const body = {
  mode: "answer",
  fictionalDataOnly: true,
  sourceIds: ["migration"],
  handoff: details,
  question: "How is migration done?",
};
function database() {
  let count = 0;
  return {
    prepare() {
      return {
        bind() {
          return this;
        },
        async first() {
          return count < 10 ? { used: ++count } : null;
        },
      };
    },
  };
}
function environment() {
  return {
    GEMINI_API_KEY: "test-only-fake-key",
    GEMINI_MODEL: "test-model",
    ENABLE_GEMINI: "true",
    ALLOWED_ORIGIN: origin,
    DB: database(),
  };
}
const request = (data = body, headers = {}) =>
  new Request("https://backend.example/api/generate", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json", ...headers },
    body: JSON.stringify(data),
  });
function provider(
  output = {
    text: "Rehearse in staging.",
    sourceIds: ["migration"],
    insufficientEvidence: false,
  },
) {
  return async () =>
    Response.json({
      candidates: [
        {
          finishReason: "STOP",
          content: { parts: [{ text: JSON.stringify(output) }] },
        },
      ],
    });
}
test("configured answer calls Gemini server-side and only sends selected source content", async () => {
  const env = environment();
  let calls = 0;
  const worker = createWorker(async (url, options) => {
    calls++;
    assert.equal(new URL(url).hostname, "generativelanguage.googleapis.com");
    assert.equal(options.headers["x-goog-api-key"], env.GEMINI_API_KEY);
    const payload = JSON.parse(options.body);
    const content = JSON.parse(payload.contents[0].parts[0].text);
    assert.deepEqual(
      content.documents.map((d) => d.id),
      ["migration"],
    );
    assert.ok(!options.body.includes("Client relationship notes"));
    assert.ok(!options.body.includes(env.GEMINI_API_KEY));
    return provider()();
  });
  const result = await worker.fetch(request(), env);
  assert.equal(result.status, 200);
  const json = await result.json();
  assert.equal(json.provider, "gemini");
  assert.deepEqual(json.sourceIds, ["migration"]);
  assert.equal(calls, 1);
  assert.ok(!JSON.stringify(json).includes(env.GEMINI_API_KEY));
});
test("disabled, missing key, and missing database fail closed without a model call", async () => {
  const worker = createWorker(() => {
    throw Error("must not call");
  });
  for (const overrides of [
    { ENABLE_GEMINI: "false" },
    { GEMINI_API_KEY: "" },
    { DB: undefined },
  ])
    assert.equal(
      (await worker.fetch(request(), { ...environment(), ...overrides }))
        .status,
      503,
    );
});
test("origin restriction, preflight, invalid documents and malformed bodies", async () => {
  const worker = createWorker(() => {
    throw Error("must not call");
  });
  const env = environment();
  assert.equal(
    (await worker.fetch(request(body, { Origin: "https://evil.example" }), env))
      .status,
    403,
  );
  assert.equal(
    (
      await worker.fetch(
        new Request("https://backend.example/api/generate", {
          method: "OPTIONS",
          headers: { Origin: origin },
        }),
        env,
      )
    ).status,
    204,
  );
  assert.equal(
    (
      await worker.fetch(
        request({ ...body, sourceIds: ["private-company-file"] }),
        env,
      )
    ).status,
    400,
  );
  assert.equal(
    (await worker.fetch(request({ ...body, fictionalDataOnly: false }), env))
      .status,
    400,
  );
  assert.equal(
    (await worker.fetch(request({ ...body, question: "x".repeat(501) }), env))
      .status,
    400,
  );
  assert.equal(
    (await worker.fetch(request({ ...body, handoff: {} }), env)).status,
    400,
  );
  assert.equal(
    (await worker.fetch(request({ ...body, extra: "x".repeat(17000) }), env))
      .status,
    413,
  );
});
test("persistent daily reservation caps provider calls, including failures", async () => {
  let calls = 0;
  const worker = createWorker(async () => {
    calls++;
    return new Response("upstream private error", { status: 500 });
  });
  const env = environment();
  for (let i = 0; i < 10; i++)
    assert.equal((await worker.fetch(request(), env)).status, 502);
  assert.equal((await worker.fetch(request(), env)).status, 429);
  assert.equal(calls, 10);
});
test("invalid, missing, and unselected citations are rejected; abstention is explicit", async () => {
  for (const output of [
    { text: "Unsupported", sourceIds: ["client"], insufficientEvidence: false },
    { text: "Unsupported", sourceIds: [], insufficientEvidence: false },
  ])
    assert.equal(
      (await createWorker(provider(output)).fetch(request(), environment()))
        .status,
      502,
    );
  const response = await createWorker(
    provider({ text: "Guess", sourceIds: [], insufficientEvidence: true }),
  ).fetch(request(), environment());
  assert.match((await response.json()).text, /could not find enough/);
});
test("manual requires all six unique sourced sections", async () => {
  const sections = ["Who", "What", "When", "Where", "Why", "How"].map(
    (kind) => ({
      kind,
      body: "Sample content supported by selected evidence.",
      sourceIds: ["migration"],
    }),
  );
  const response = await createWorker(provider({ sections })).fetch(
    request({ ...body, mode: "manual" }),
    environment(),
  );
  assert.equal(response.status, 200);
  assert.equal((await response.json()).sections.length, 6);
  assert.equal(
    (
      await createWorker(provider({ sections: sections.slice(1) })).fetch(
        request({ ...body, mode: "manual" }),
        environment(),
      )
    ).status,
    502,
  );
});
test("provider errors, incomplete output, and unavailable usage database are sanitized", async () => {
  const secret = "never-return-this";
  const response = await createWorker(
    async () => new Response(secret, { status: 403 }),
  ).fetch(request(), environment());
  assert.equal(response.status, 502);
  assert.ok(!(await response.text()).includes(secret));
  assert.equal(
    (
      await createWorker(async () =>
        Response.json({ candidates: [{ finishReason: "MAX_TOKENS" }] }),
      ).fetch(request(), environment())
    ).status,
    502,
  );
  const env = environment();
  env.DB = {
    prepare() {
      throw Error(secret);
    },
  };
  assert.equal(
    (await createWorker(provider()).fetch(request(), env)).status,
    503,
  );
});
