import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
} from "~/components/ui/combobox";
import { HugeiconsIcon } from "@hugeicons/react";
import { AiBrainIcon, RotateLeft01Icon } from "@hugeicons/core-free-icons";
import { SettingsRpc } from "~/server/rpc/settings";

interface ModelItem {
  id: string;
  name?: string;
  provider: string;
}

interface ProviderGroup {
  value: string;
  items: ModelItem[];
}

interface SettingsPageProps {
  settings: {
    selectedProvider: string;
    selectedModel: string;
    apiKeys: Record<string, string>;
  };
}

export function SettingsPage({ settings }: SettingsPageProps) {
  const [saved, setSaved] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const { data: providers = [], isPending: loading } = useQuery(SettingsRpc.providers());
  const queryClient = useQueryClient();

  const groups: ProviderGroup[] = useMemo(() => {
    return providers.map((p) => ({
      value: p.provider.name,
      items: p.models.map((m) => ({
        id: m.id,
        name: m.name,
        provider: p.provider.id,
      })),
    }));
  }, [providers]);

  const allModels = useMemo(() => {
    return groups.flatMap((g) => g.items);
  }, [groups]);

  const mutation = useMutation({
    ...SettingsRpc.updateSettings(),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: SettingsRpc.settings() });
      const previous = queryClient.getQueryData(SettingsRpc.settings());
      queryClient.setQueryData(SettingsRpc.settings(), (old: typeof settings) => ({
        ...old,
        ...variables,
      }));
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(SettingsRpc.settings(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SettingsRpc.settings() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

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

  const selectedGroupItem = useMemo(() => {
    if (!selectedModelId) return null;
    for (const group of groups) {
      const found = group.items.find((m) => m.id === selectedModelId);
      if (found) return found;
    }
    return null;
  }, [selectedModelId, groups]);

  const [inputValue, setInputValue] = useState(() => {
    if (selectedGroupItem) {
      return selectedGroupItem.name ?? selectedGroupItem.id;
    }
    return "";
  });

  useEffect(() => {
    if (selectedGroupItem) {
      setInputValue(selectedGroupItem.name ?? selectedGroupItem.id);
    }
  }, [selectedGroupItem]);

  const handleModelChange = (item: ModelItem | null) => {
    if (!item) return;
    form.setFieldValue("selectedModel", item.id);
    setInputValue(item.name ?? item.id);
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
    form.setFieldValue("selectedProvider", "opencode-go");
    form.setFieldValue("selectedModel", "kimi-k2.7-code");
    form.setFieldValue("apiKeys", {});
    mutation.mutate({
      selectedProvider: "opencode-go",
      selectedModel: "kimi-k2.7-code",
      apiKeys: {},
    });
  };

  return (
    <div className="space-y-6 mx-auto max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure your AI model and preferences</p>
      </div>

      {/* Model Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={AiBrainIcon} className="size-5" />
            <CardTitle>Model</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading providers...</p>
          ) : (
            <div className="space-y-2">
              <Label>Model</Label>
              <Combobox
                items={groups}
                value={selectedGroupItem}
                onValueChange={handleModelChange}
                inputValue={inputValue}
                onInputValueChange={setInputValue}
                itemToStringLabel={(item) => item.name ?? item.id}
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
                            <span className="font-medium">{model.name ?? model.id}</span>
                            {model.name && (
                              <span className="text-xs text-muted-foreground ml-auto">
                                {model.id}
                              </span>
                            )}
                          </ComboboxItem>
                        ))}
                      </ComboboxGroup>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Key */}
      {apiKeyEnv && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedProvider?.provider.name} API Key</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedProviderId && (
              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="relative max-w-md">
                  <Input
                    type={showApiKey ? "text" : "password"}
                    defaultValue={form.state.values.apiKeys[selectedProviderId] ?? ""}
                    onBlur={(e) => handleApiKeyBlur(selectedProviderId, e.target.value)}
                    placeholder={`Enter your ${apiKeyEnv}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? "Hide" : "Show"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleResetDefaults}
          disabled={mutation.isPending}
        >
          <HugeiconsIcon icon={RotateLeft01Icon} className="size-4" />
          Reset to Defaults
        </Button>
      </div>

      {saved && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-sm text-background shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
          Saved!
        </div>
      )}
    </div>
  );
}
