import { useState, useEffect } from "react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
} from "~/components/ui/combobox";
import { Separator } from "~/components/ui/separator";
import { Brain, RotateCcw, Eye, EyeOff, KeyRound, Palette } from "lucide-react";
import { SettingsRpc } from "~/features/settings/server/rpc"
import { queryKeys } from "~/lib/query-keys"
import { cn } from "~/lib/utils";
import { THEMES, type ThemeId, getTheme, setTheme } from "~/lib/theme";

interface ModelItem {
  id: string;
  name?: string;
  provider: string;
}

interface ProviderGroup {
  value: string;
  items: ModelItem[];
}
const DEFAULT_PROVIDER = "opencode-go";
const DEFAULT_MODEL = "kimi-k2.7-code";

export function GlobalSettingsPanel() {
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [showApiKey, setShowApiKey] = useState(false);
  const [themeState, setThemeState] = useState<ThemeId>(getTheme());
  const { data: settings } = useSuspenseQuery(SettingsRpc.getSettings());
  const { data: providers = [] } = useSuspenseQuery(SettingsRpc.providers());
  const queryClient = useQueryClient();

  const groups: ProviderGroup[] = providers.map((p) => ({
    value: p.provider.name,
    items: p.models.map((m) => ({
      id: m.id,
      name: m.name,
      provider: p.provider.id,
    })),
  }));

  const allModels = groups.flatMap((g) => g.items);

  const providerNameById = (() => {
    const map = new Map<string, string>();
    for (const p of providers) {
      map.set(p.provider.id, p.provider.name);
    }
    return map;
  })();

  const getModelLabel = (item: ModelItem) => {
    const providerName = providerNameById.get(item.provider);
    const modelName = item.name ?? item.id;
    return providerName ? `${modelName} ⋅ ${providerName}` : modelName;
  };

  const mutation = useMutation({
    ...SettingsRpc.updateSettings(),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.settings.all });
      const previous = queryClient.getQueryData(queryKeys.settings.all);
      queryClient.setQueryData(queryKeys.settings.all, (old: typeof settings) => ({
        ...old,
        ...variables,
      }));
      return { previous };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
      setStatus('saved');
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.settings.all, context.previous);
      }
      setStatus('error');
    },
  });
  useEffect(() => {
    if (status === 'idle') return;
    const timer = setTimeout(() => setStatus('idle'), status === 'saved' ? 2000 : 3000);
    return () => clearTimeout(timer);
  }, [status]);

  const form = useForm({
    defaultValues: {
      selectedProvider: settings.selectedProvider,
      selectedModel: settings.selectedModel,
      apiKeys: settings.apiKeys,
    },
  });

  useEffect(() => {
    if (allModels.length > 0) {
      const currentModel = form.state.values.selectedModel;
      const modelExists = allModels.some((m) => m.id === currentModel);
      if (!modelExists) {
        form.setFieldValue("selectedModel", allModels[0].id);
      }
    }
  }, [allModels]);

  const selectedModelId = form.state.values.selectedModel;
  const selectedModel = allModels.find((m) => m.id === selectedModelId);
  const selectedProviderId = selectedModel?.provider ?? form.state.values.selectedProvider;
  const selectedProvider = providers.find((p) => p.provider.id === selectedProviderId);
  const apiKeyEnv = selectedProvider?.provider.env[0] ?? "";

  const selectedGroupItem = (() => {
    if (!selectedModelId) return null;
    for (const group of groups) {
      const found = group.items.find((m) => m.id === selectedModelId);
      if (found) return found;
    }
    return null;
  })();

  const [userInput, setUserInput] = useState<string | null>(null);

  const effectiveInputValue = userInput ?? (selectedGroupItem ? getModelLabel(selectedGroupItem) : "");

  const handleModelChange = (item: ModelItem | null) => {
    if (!item) return;
    form.setFieldValue("selectedModel", item.id);
    setUserInput(getModelLabel(item));
    mutation.mutate({
      selectedProvider: item.provider,
      selectedModel: item.id,
      apiKeys: form.state.values.apiKeys,
    });
  };

  const handleApiKeyBlur = (providerId: string, value: string) => {
    const newApiKeys = { ...form.state.values.apiKeys, [providerId]: value };
    form.setFieldValue("apiKeys", newApiKeys);
    mutation.mutate({
      selectedProvider: providerId,
      selectedModel: form.state.values.selectedModel,
      apiKeys: newApiKeys,
    });
  };

  const handleResetDefaults = () => {
    form.setFieldValue("selectedProvider", DEFAULT_PROVIDER);
    form.setFieldValue("selectedModel", DEFAULT_MODEL);
    form.setFieldValue("apiKeys", {});
    mutation.mutate({
      selectedProvider: DEFAULT_PROVIDER,
      selectedModel: DEFAULT_MODEL,
      apiKeys: {},
    });
  };

  return (
    <div className="space-y-4">
      {/* Theme */}
      <div className="space-y-3">
        <div className="flex items-center gap-1 text-sm font-medium text-foreground">
          <Palette className="size-4" />
          <span>Color</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => { setTheme(theme.id); setThemeState(theme.id); }}
              className={cn(
                "size-8 rounded-full border-2 transition-all cursor-pointer shrink-0",
                themeState === theme.id
                  ? "border-foreground ring-2 ring-foreground/20 scale-110"
                  : "border-border hover:scale-105"
              )}
              style={{ backgroundColor: theme.color }}
              title={theme.label}
              aria-label={`${theme.label} theme`}
            />
          ))}
        </div>
      </div>
      
      {/* Model */}
      <div className="space-y-3">
        <div className="flex items-center gap-1 text-sm font-medium text-foreground">
          <Brain className="size-4" />
          <span>Model</span>
        </div>
        <Combobox
          items={groups}
          value={selectedGroupItem}
          onValueChange={handleModelChange}
          inputValue={effectiveInputValue}
          onInputValueChange={setUserInput}
          itemToStringLabel={(item) => getModelLabel(item)}
          itemToStringValue={(item) => item.id}
          isItemEqualToValue={(item, value) => item.id === value.id}
        >
          <ComboboxInput placeholder="Search models..." showTrigger={false} />
          <ComboboxContent>
            <ComboboxList>
              {(group) => (
                <ComboboxGroup key={group.value}>
                  <ComboboxLabel>{group.value}</ComboboxLabel>
                  {group.items.map((model: ModelItem) => (
                    <ComboboxItem key={model.id} value={model}>
                      <span>{model.name ?? model.id}</span>
                    </ComboboxItem>
                  ))}
                </ComboboxGroup>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>

      {/* API Key */}
      {apiKeyEnv && selectedProviderId && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm font-medium text-foreground">
              <KeyRound className="size-4" />
              <span>API Key</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              {showApiKey ? "Hide" : "Show"}
            </Button>
          </div>
          <Input
            type={showApiKey ? "text" : "password"}
            defaultValue={form.state.values.apiKeys[selectedProviderId] ?? ""}
            onBlur={(e) => handleApiKeyBlur(selectedProviderId, e.target.value)}
            placeholder={apiKeyEnv}
          />
        </div>
      )}

      <Separator className="my-4" />

      {/* Footer */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleResetDefaults}
          disabled={mutation.isPending}
        >
          <RotateCcw className="size-3.5" />
          Reset to Defaults
        </Button>

        {status === 'saved' && (
          <span className="text-xs text-muted-foreground animate-in fade-in duration-200">
            Saved!
          </span>
        )}
        {status === 'error' && (
          <span className="text-xs text-destructive animate-in fade-in duration-200" role="alert">
            {mutation.error instanceof Error ? mutation.error.message : 'Failed to save'}
          </span>
        )}
      </div>
    </div>
  );
}
