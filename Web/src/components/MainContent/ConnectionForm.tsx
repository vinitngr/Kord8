import { useState } from "react";
import { Button } from "../shared/Button";
import { Logo } from "../shared/Logo";
import type { Connection } from "../../types";
import { AlertCircle, Loader2, ShieldCheck } from "lucide-react";

interface ConnectionFormProps {
  connection: Connection;
  onSuccess: () => void;
  onCancel?: () => void;
  saveConnection: (service: string, creds: Record<string, string>) => Promise<{ success: boolean; error?: string }>;
}

export function ConnectionForm({ connection, onSuccess, onCancel, saveConnection }: ConnectionFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const result = await saveConnection(connection.service, formData);
    setSaving(false);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || "Connection failed. Please check your credentials.");
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-4 mb-4">
        <div className="h-14 w-14 rounded-2xl bg-[#09090B] border border-[#27272A] flex items-center justify-center shadow-xl">
          <Logo service={connection.service} size="lg" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#FAFAFA]">Connect {connection.label}</h3>
          <p className="text-xs text-[#A1A1AA]">{connection.description}</p>
        </div>
      </div>

      <div className="bg-[#FF4A00]/5 border border-[#FF4A00]/20 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="h-4 w-4 text-[#FF4A00] shrink-0 mt-0.5" />
        <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
          {connection.tools.length > 0 ? (
            <>By connecting {connection.label}, your agents will be able to perform actions like <span className="text-[#FAFAFA] font-medium">{connection.tools.slice(0, 2).map(t => t.name).join(', ')}</span> on your behalf.</>
          ) : (
            <>Connect your {connection.label} account to enable knowledge source synchronization and automation.</>
          )}
        </p>
      </div>

      <div className="space-y-4">
        <p className="text-[10px] font-bold text-[#52525B] uppercase tracking-widest">Authentication Credentials</p>
        {connection.fields.map((field) => (
          <div key={field.name} className="space-y-2">
            <label className="text-[11px] font-bold text-[#FAFAFA]">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type={field.type === "password" ? "password" : "text"}
              className="w-full p-3 bg-[#09090B] border border-[#27272A] rounded-xl text-xs text-[#FAFAFA] placeholder:text-[#3F3F46] focus:outline-none focus:ring-1 focus:ring-[#FF4A00]/50 focus:border-[#FF4A00]/50 transition-all shadow-inner"
              placeholder={field.placeholder}
              value={formData[field.name] || ""}
              onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
            />
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-500/5 border border-red-500/20 rounded-xl animate-in shake duration-300">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-red-400 font-medium">{error}</p>
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-[#27272A]">
        <Button
          variant="primary"
          className="flex-1 h-12 bg-[#FF4A00] hover:bg-[#E64300] border-[#FF4A00] shadow-lg shadow-[#FF4A00]/10 rounded-xl font-bold"
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Verifying Connection...</>
          ) : (
            <><ShieldCheck className="h-4 w-4 mr-2" /> {connection.hasPing ? "Verify & Authorize" : "Connect Account"}</>
          )}
        </Button>
        {onCancel && (
          <Button variant="outline" className="h-12 bg-[#000] border-[#27272A] rounded-xl px-6 text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B]" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
