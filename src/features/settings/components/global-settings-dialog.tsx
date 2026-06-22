import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { GlobalSettingsPanel } from "./global-settings-panel";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <GlobalSettingsPanel />
      </DialogContent>
    </Dialog>
  );
}
