import { useMemo } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SettingsRpc } from "~/features/settings/server/rpc"

interface ApiKeyStatus {
  hasKey: boolean;
  requiredEnv: string | undefined;
  providerName: string;
}

export function useApiKeyStatus(): ApiKeyStatus {
  const { data: settings } = useSuspenseQuery(SettingsRpc.getSettings());
  const { data: providers = [] } = useSuspenseQuery(SettingsRpc.providers());

  return useMemo(() => {
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
    };
  }, [settings, providers]);
}
