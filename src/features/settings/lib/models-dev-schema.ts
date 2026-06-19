import { Schema } from "effect"

// --- Date string: YYYY-MM or YYYY-MM-DD ---
const DateString = Schema.String

// --- Modality ---
const Modality = Schema.Union([
  Schema.Literal("text"),
  Schema.Literal("audio"),
  Schema.Literal("image"),
  Schema.Literal("video"),
  Schema.Literal("pdf"),
])

const Modalities = Schema.Struct({
  input: Schema.Array(Modality),
  output: Schema.Array(Modality),
})

// --- Cost ---
const Cost = Schema.Struct({
  input: Schema.Number,
  output: Schema.Number,
  reasoning: Schema.optional(Schema.Number),
  cache_read: Schema.optional(Schema.Number),
  cache_write: Schema.optional(Schema.Number),
  input_audio: Schema.optional(Schema.Number),
  output_audio: Schema.optional(Schema.Number),
})

const CostTier = Schema.Struct({
  tier: Schema.Struct({
    type: Schema.Literal("context"),
    size: Schema.Number,
  }),
  input: Schema.Number,
  output: Schema.Number,
  reasoning: Schema.optional(Schema.Number),
  cache_read: Schema.optional(Schema.Number),
  cache_write: Schema.optional(Schema.Number),
})

const OutputCost = Schema.Struct({
  input: Schema.Number,
  output: Schema.Number,
  reasoning: Schema.optional(Schema.Number),
  cache_read: Schema.optional(Schema.Number),
  cache_write: Schema.optional(Schema.Number),
  input_audio: Schema.optional(Schema.Number),
  output_audio: Schema.optional(Schema.Number),
  context_over_200k: Schema.optional(Cost),
  tiers: Schema.optional(Schema.Array(CostTier)),
})

// --- Limits ---
const ProviderModelLimit = Schema.Struct({
  context: Schema.Number,
  input: Schema.optional(Schema.Number),
  output: Schema.Number,
})

// --- Reasoning options ---
const ReasoningEffortValue = Schema.Union([
  Schema.Null,
  Schema.Literal("none"),
  Schema.Literal("minimal"),
  Schema.Literal("low"),
  Schema.Literal("medium"),
  Schema.Literal("high"),
  Schema.Literal("xhigh"),
  Schema.Literal("max"),
  Schema.Literal("default"),
])

const ReasoningOptionToggle = Schema.Struct({
  type: Schema.Literal("toggle"),
})

const ReasoningOptionEffort = Schema.Struct({
  type: Schema.Literal("effort"),
  values: Schema.Array(ReasoningEffortValue),
})

const ReasoningOptionBudget = Schema.Struct({
  type: Schema.Literal("budget_tokens"),
  min: Schema.optional(Schema.Number),
  max: Schema.optional(Schema.Number),
})

const ReasoningOption = Schema.Union([
  ReasoningOptionToggle,
  ReasoningOptionEffort,
  ReasoningOptionBudget,
])

// --- Links & weights ---
const ModelLink = Schema.Struct({
  label: Schema.optional(Schema.String),
  url: Schema.String,
  type: Schema.optional(
    Schema.Union([
      Schema.Literal("announcement"),
      Schema.Literal("blog"),
      Schema.Literal("docs"),
      Schema.Literal("license"),
      Schema.Literal("model_card"),
      Schema.Literal("paper"),
      Schema.Literal("weights"),
      Schema.Literal("other"),
    ]),
  ),
})

const ModelWeights = Schema.Struct({
  label: Schema.optional(Schema.String),
  url: Schema.String,
  format: Schema.optional(Schema.String),
  quantization: Schema.optional(Schema.String),
})

// --- Benchmarks ---
const BenchmarkResult = Schema.Struct({
  name: Schema.String,
  score: Schema.Union([Schema.Number, Schema.String]),
  metric: Schema.optional(Schema.String),
  harness: Schema.optional(Schema.String),
  variant: Schema.optional(Schema.String),
  dataset: Schema.optional(Schema.String),
  version: Schema.optional(Schema.String),
  source: Schema.optional(Schema.String),
  date: Schema.optional(DateString),
})

// --- Model ---
const Model = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  family: Schema.optional(Schema.String),
  attachment: Schema.Boolean,
  reasoning: Schema.Boolean,
  reasoning_options: Schema.optional(Schema.Array(ReasoningOption)),
  tool_call: Schema.Boolean,
  interleaved: Schema.optional(
    Schema.Union([
      Schema.Literal(true),
      Schema.Struct({
        field: Schema.Union([
          Schema.Literal("reasoning_content"),
          Schema.Literal("reasoning_details"),
        ]),
      }),
    ]),
  ),
  structured_output: Schema.optional(Schema.Boolean),
  temperature: Schema.optional(Schema.Boolean),
  knowledge: Schema.optional(DateString),
  release_date: DateString,
  last_updated: DateString,
  modalities: Modalities,
  open_weights: Schema.Boolean,
  limit: ProviderModelLimit,
  status: Schema.optional(
    Schema.Union([
      Schema.Literal("alpha"),
      Schema.Literal("beta"),
      Schema.Literal("deprecated"),
    ]),
  ),
  cost: Schema.optional(OutputCost),
  license: Schema.optional(Schema.String),
  links: Schema.optional(Schema.Array(ModelLink)),
  weights: Schema.optional(Schema.Array(ModelWeights)),
  benchmarks: Schema.optional(Schema.Array(BenchmarkResult)),
  provider: Schema.optional(
    Schema.Struct({
      npm: Schema.optional(Schema.String),
      api: Schema.optional(Schema.String),
      shape: Schema.optional(
        Schema.Union([
          Schema.Literal("responses"),
          Schema.Literal("completions"),
        ]),
      ),
    }),
  ),
})

// --- Provider ---
const Provider = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  env: Schema.Array(Schema.String),
  npm: Schema.String,
  doc: Schema.optional(Schema.String),
  api: Schema.optional(Schema.String),
  models: Schema.Record(Schema.String, Model),
})

// --- API Response ---
export const ModelsDevResponse = Schema.Record(Schema.String, Provider)

export type ModelsDevResponse = typeof ModelsDevResponse.Type
export type Provider = typeof Provider.Type
export type Model = typeof Model.Type
