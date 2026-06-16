import { useState } from "react";
import { Shield, AlertTriangle } from "lucide-react";

interface AgeGateProps {
  onConfirm: () => void;
  onDecline?: () => void;
  contentLabel?: string;
}

export default function AgeGate({ onConfirm, onDecline, contentLabel = "this content" }: AgeGateProps) {
  const [declined, setDeclined] = useState(false);

  const handleDecline = () => {
    setDeclined(true);
    onDecline?.();
  };

  if (declined) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center gap-4 text-center p-8">
        <Shield className="w-12 h-12 text-muted-foreground opacity-40" />
        <p className="text-muted-foreground text-sm">You must be 18 or older to view this content.</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border/40 rounded-2xl p-8 max-w-sm w-full text-center">
        <div className="w-14 h-14 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-yellow-500" />
        </div>
        <h2 className="text-xl font-bold mb-2">Age Verification Required</h2>
        <p className="text-sm text-muted-foreground mb-1">
          {contentLabel} is marked as <strong className="text-foreground">explicit</strong>.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          You must be <strong className="text-foreground">18 years or older</strong> to view this content. By continuing, you confirm that you meet this requirement.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleDecline}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border/40 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            I am under 18
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            I am 18 or older
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          This confirmation is stored locally for this session only.
        </p>
      </div>
    </div>
  );
}
