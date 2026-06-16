import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Shield, X } from "lucide-react";

const STORAGE_KEY = "cp_popia_accepted";

export default function POPIABanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(STORAGE_KEY);
    if (!accepted) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto bg-card border border-border/40 rounded-2xl p-4 sm:p-5 shadow-xl">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground mb-1">
              Your privacy matters — POPIA Notice
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              CheckinPurple collects personal information to provide our services in compliance with the{" "}
              <strong className="text-foreground">Protection of Personal Information Act (POPIA)</strong>. We use
              authentication cookies only — no advertising or tracking. We do not sell your data.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <button
                onClick={accept}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                I understand
              </button>
              <Link to="/privacy" className="text-xs text-primary underline hover:opacity-80">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-xs text-muted-foreground underline hover:text-foreground">
                Terms & Conditions
              </Link>
            </div>
          </div>
          <button
            onClick={accept}
            className="p-1 rounded-lg hover:bg-card/80 text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
