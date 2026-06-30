import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { SettingsRpc } from "~/server/rpc/settings";

export function useApiKeyStatus() {
  const { data: settings, isLoading: settingsLoading } = useQuery(SettingsRpc.getSettings());
  const { data: providers = [], isLoading: providersLoading } = useQuery(SettingsRpc.providers());

  const status = useMemo(() => {
    if (!settings) {
      return { hasKey: false, requiredEnv: undefined as string | undefined, providerName: "", isLoading: true };
    }
    const provider = providers.find(
      (p) => p.provider.id === settings.selectedProvider,
    );
    const requiredEnv = provider?.provider.env[0];
    const hasKey =
      requiredEnv !== undefined &&
      requiredEnv !== "" &&
      (settings.apiKeys[settings.selectedProvider]?.length ?? 0) > 0;

    return {
      hasKey,
      requiredEnv,
      providerName: provider?.provider.name ?? settings.selectedProvider,
      isLoading: settingsLoading || providersLoading,
    };
  }, [settings, providers, settingsLoading, providersLoading]);

  return status;
}
