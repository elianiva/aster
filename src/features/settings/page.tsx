import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "~/components/ui/command";
import { Popover, PopoverTrigger, PopoverContent } from "~/components/ui/popover";
import { HugeiconsIcon } from "@hugeicons/react";
import { AiBrainIcon, RotateLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { updateSettings } from "./server-fns";
import { providersQueryOptions } from "./query-options";

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
  const { data: providers = [], isPending: loading } = useQuery(providersQueryOptions);

  const [providerOpen, setProviderOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      selectedProvider: settings.selectedProvider,
      selectedModel: settings.selectedModel,
      apiKeys: settings.apiKeys,
    },
    onSubmit: async ({ value }) => {
      await updateSettings({
        data: {
          selectedProvider: value.selectedProvider,
          selectedModel: value.selectedModel,
          apiKeys: value.apiKeys,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });



  const selectedProviderId = form.state.values.selectedProvider;
  const selectedProvider = providers.find((p) => p.provider.id === selectedProviderId);

  const models = useMemo(() => {
    return selectedProvider?.models ?? [];
  }, [selectedProvider]);

  useEffect(() => {
    if (selectedProvider && models.length > 0) {
      const currentModel = form.state.values.selectedModel;
      const modelExists = models.some((m) => m.id === currentModel);
      if (!modelExists) {
        form.setFieldValue("selectedModel", models[0].id);
      }
    }
  }, [selectedProvider, models]);

  const selectedModelId = form.state.values.selectedModel;
  const selectedModel = models.find((m) => m.id === selectedModelId);
  const apiKeyEnv = selectedProvider?.provider.env[0] ?? "";

  return (
    <div className="space-y-6 mx-auto max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure your AI model and preferences</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="space-y-6"
      >
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
              <div className="space-y-4">
                {/* Provider Combobox */}
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Popover open={providerOpen} onOpenChange={setProviderOpen}>
                    <PopoverTrigger
                      render={<Button variant="outline" className="w-full justify-between" />}
                    >
                      <span className={selectedProvider ? "" : "text-muted-foreground"}>
                        {selectedProvider?.provider.name ?? "Select a provider"}
                      </span>
                      <HugeiconsIcon icon={ArrowRight01Icon} className="size-4 opacity-50" />
                    </PopoverTrigger>
                    <PopoverContent className="w-[--anchor-width] p-0" align="start">
                      <Command className="border">
                        <CommandInput placeholder="Search providers..." />
                        <CommandList>
                          <CommandEmpty>No providers found.</CommandEmpty>
                          {providers.map((p) => (
                            <CommandItem
                              key={p.provider.id}
                              value={p.provider.name}
                              onSelect={() => {
                                form.setFieldValue("selectedProvider", p.provider.id);
                                setProviderOpen(false);
                              }}
                            >
                              <span className="font-medium">{p.provider.name}</span>
                              <span className="text-xs text-muted-foreground ml-auto">
                                {p.models.length} models
                              </span>
                            </CommandItem>
                          ))}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Model Combobox */}
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Popover open={modelOpen} onOpenChange={setModelOpen}>
                    <PopoverTrigger
                      render={
                        <Button
                          variant="outline"
                          className="w-full justify-between"
                          disabled={!selectedProviderId}
                        />
                      }
                    >
                      <span className={selectedModel ? "" : "text-muted-foreground"}>
                        {selectedModel?.name ?? selectedModelId ?? "Select a model"}
                      </span>
                      <HugeiconsIcon icon={ArrowRight01Icon} className="size-4 opacity-50" />
                    </PopoverTrigger>
                    <PopoverContent className="w-[--anchor-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search models..." />
                        <CommandList>
                          <CommandEmpty>No models found.</CommandEmpty>
                          <CommandGroup heading={selectedProvider?.provider.name ?? "Models"}>
                            {models.map((m) => (
                              <CommandItem
                                key={m.id}
                                value={m.name ?? m.id}
                                onSelect={() => {
                                  form.setFieldValue("selectedModel", m.id);
                                  setModelOpen(false);
                                }}
                              >
                                <span className="font-medium">{m.name ?? m.id}</span>
                                {m.name && (
                                  <span className="text-xs text-muted-foreground ml-auto">
                                    {m.id}
                                  </span>
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
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
              <form.Field name={`apiKeys.${selectedProviderId}`}>
                {(field) => (
                  <div className="space-y-2">
                    <Label>Environment Variable: {apiKeyEnv}</Label>
                    <div className="relative max-w-md">
                      <Input
                        type={showApiKey ? "text" : "password"}
                        value={(field.state.value as string) ?? ""}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Enter your API key"
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
              </form.Field>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={form.state.isSubmitting}>
            {saved ? "Saved!" : "Save Settings"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.setFieldValue("selectedProvider", "opencode-go");
              form.setFieldValue("selectedModel", "kimi-k2.7-code");
              form.setFieldValue("apiKeys", {});
            }}
          >
            <HugeiconsIcon icon={RotateLeft01Icon} className="size-4" />
            Reset to Defaults
          </Button>
        </div>
      </form>
    </div>
  );
}
