import { useState } from "react";
import { Button } from "~/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Key02Icon } from "@hugeicons/core-free-icons";
import { SettingsDialog } from "~/features/settings/components/global-settings-dialog";

export function ApiKeyBanner({ providerName }: { providerName: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mx-auto mb-3 max-w-3xl rounded-xl border border-dashed border-muted-foreground/30 bg-muted/40 px-4 py-3 text-center text-sm text-muted-foreground">
      <div className="flex items-center justify-center gap-2">
        <HugeiconsIcon icon={Key02Icon} className="size-4" />
        <span>
          No API key configured for <strong>{providerName}</strong>.
        </span>
        <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setOpen(true)}>
          Open Settings
        </Button>
      </div>
      <SettingsDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
