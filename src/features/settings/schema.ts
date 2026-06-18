import { Schema } from 'effect'

export const ProviderMeta = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  env: Schema.Array(Schema.String),
  api: Schema.String,
  npm: Schema.String,
})
export type ProviderMeta = typeof ProviderMeta.Type

export const ModelMeta = Schema.Struct({
  id: Schema.String,
  name: Schema.optional(Schema.String),
})
export type ModelMeta = typeof ModelMeta.Type

export const ProviderWithModels = Schema.Struct({
  provider: ProviderMeta,
  models: Schema.Array(ModelMeta),
})
export type ProviderWithModels = typeof ProviderWithModels.Type

export const Settings = Schema.Struct({
  selectedProvider: Schema.String,
  selectedModel: Schema.String,
  apiKeys: Schema.Record(Schema.String, Schema.String),
})
export type Settings = typeof Settings.Type

export const DEFAULT_SETTINGS: Settings = {
  selectedProvider: 'opencode-go',
  selectedModel: 'kimi-k2.7-code',
  apiKeys: {},
}
