import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";

// Shared server-side KORA caller. Owns the "talk to Claude and get validated
// JSON back" mechanics for every AI route: client instantiation, structured
// outputs via the SDK's native zod support (no more hand-typed JSON schemas in
// prompts or markdown-fence stripping), one repair retry when the response
// fails validation, and optional prompt caching for large static system
// prompts. Auth, rate limiting, and DB access stay in the routes.

export class KoraConfigError extends Error {
  constructor() {
    super("ANTHROPIC_API_KEY is not configured.");
  }
}

export class KoraUpstreamError extends Error {}

export class KoraValidationError extends Error {}

let client: Anthropic | null = null;

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new KoraConfigError();
  if (!client) client = new Anthropic({ apiKey });
  return client;
}

export interface KoraCallParams<S extends z.ZodType> {
  model: string;
  maxTokens: number;
  system?: string;
  /** Wrap the system prompt in a cache_control block — only worth it for large, static prompts. */
  cacheSystemPrompt?: boolean;
  messages: Anthropic.Messages.MessageParam[];
  schema: S;
  thinking?: { type: "adaptive" };
  /**
   * Model to use for the schema-repair retry, if it should differ from `model`.
   * Repair is mechanical JSON-shape fixing, not a judgment task, so callers can
   * route it to a cheaper model. Defaults to `model`. Note: the repair call never
   * carries `thinking` regardless of `params.thinking` — cheaper repair models
   * (e.g. Haiku 4.5) don't support adaptive thinking, and repair doesn't need it.
   */
  repairModel?: string;
}

export interface KoraCallResult<T> {
  data: T;
  raw: Anthropic.Messages.Message;
}

const REPAIR_INSTRUCTION =
  "Your previous response did not match the required output schema. Re-emit the full response as valid " +
  "JSON matching the schema exactly — check required fields, enum values, field types, and array lengths.";

export async function callKoraStructured<S extends z.ZodType>(
  params: KoraCallParams<S>
): Promise<KoraCallResult<z.infer<S>>> {
  const anthropic = getClient();

  const system =
    params.system === undefined
      ? undefined
      : params.cacheSystemPrompt
        ? [{ type: "text" as const, text: params.system, cache_control: { type: "ephemeral" as const } }]
        : params.system;

  const base = {
    model: params.model,
    max_tokens: params.maxTokens,
    ...(system !== undefined ? { system } : {}),
    ...(params.thinking ? { thinking: params.thinking } : {}),
    output_config: { format: zodOutputFormat(params.schema) },
  };

  // Use the streaming API rather than `messages.parse` (non-streaming): the SDK
  // hard-caps non-streaming calls at 10 minutes, and Opus with adaptive thinking
  // can legitimately run longer than that on a big beat/slide script — a
  // streamed call has no such ceiling since tokens arrive incrementally.
  let first: Anthropic.Messages.Message & { parsed_output?: unknown };
  try {
    first = await anthropic.messages.stream({ ...base, messages: params.messages }).finalMessage();
  } catch (err) {
    if (err instanceof KoraConfigError) throw err;
    throw new KoraUpstreamError(String(err));
  }
  if (first.parsed_output !== null && first.parsed_output !== undefined) {
    return { data: first.parsed_output as z.infer<S>, raw: first };
  }

  // One repair attempt: hand the model its own reply plus a corrective turn.
  // Never carries `thinking` — a repair model like Haiku 4.5 may not support
  // adaptive thinking, and pure JSON-shape fixing doesn't need it anyway.
  const repairMessages: Anthropic.Messages.MessageParam[] = [
    ...params.messages,
    { role: "assistant", content: first.content as Anthropic.Messages.ContentBlockParam[] },
    { role: "user", content: REPAIR_INSTRUCTION },
  ];
  const repairBase = { ...base, model: params.repairModel ?? params.model, thinking: undefined };

  let second: Anthropic.Messages.Message & { parsed_output?: unknown };
  try {
    second = await anthropic.messages.stream({ ...repairBase, messages: repairMessages }).finalMessage();
  } catch (err) {
    throw new KoraUpstreamError(String(err));
  }
  if (second.parsed_output !== null && second.parsed_output !== undefined) {
    return { data: second.parsed_output as z.infer<S>, raw: second };
  }

  throw new KoraValidationError("KORA returned an invalid structure after a retry.");
}
