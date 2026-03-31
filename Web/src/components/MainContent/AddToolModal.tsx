import { useState } from "react";
import { Modal } from "../shared/Modal";
import { Button } from "../shared/Button";
import { Badge } from "../shared/Badge";
import { useConnections } from "../../hooks/useStore";
import { Logo } from "../shared/Logo";
import type { Connection } from "../../types";
import { AlertCircle, ArrowLeft, Check, Loader2, Plug } from "lucide-react";

interface AddToolModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddToolModal({ isOpen, onClose }: AddToolModalProps) {
  const { connections, saveConnection } = useConnections();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disconnected = connections.filter(c => !c.isConnected);
  const selectedConn = connections.find(c => c.service === selectedService);

  const reset = () => {
    setSelectedService(null);
    setFormData({});
    setError(null);
    setSaving(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async (conn: Connection) => {
    setSaving(true);
    setError(null);
    const result = await saveConnection(conn.service, formData);
    setSaving(false);

    if (result.success) {
      handleClose();
    } else {
      setError(result.error || "Connection failed.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Connect New Tool"
      className="max-w-lg"
    >
      <div className="space-y-6 text-left p-1">

        {/* ── Step 1: Service Picker ─────────────────────────────────── */}
        {!selectedService && (
          <>
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-[#111]">Available Integrations</h3>
              <p className="text-xs text-[#999]">Connect a tool to make it available for your agents.</p>
            </div>

            {disconnected.length === 0 ? (
              <div className="text-center py-10">
                <Check className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
                <p className="text-sm font-bold text-[#111]">All tools connected!</p>
                <p className="text-xs text-[#999] mt-1">Every available integration is already set up.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {disconnected.map((conn) => (
                  <button
                    key={conn.service}
                    onClick={() => setSelectedService(conn.service)}
                    className="p-4 bg-white border border-[#E5E5E5] rounded-xl flex items-start gap-3 hover:border-[#111] hover:shadow-sm transition-all group text-left"
                  >
                    <Logo service={conn.service} size="lg" className="group-hover:bg-[#111] transition-colors" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#111] truncate">{conn.label}</p>
                      <p className="text-[10px] text-[#999] line-clamp-2 mt-0.5">{conn.description}</p>
                      <p className="text-[9px] text-[#BBB] mt-1">
                        {conn.tools.length} tool{conn.tools.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {selectedService && selectedConn && (
          <>
            <div className="flex items-center gap-3">
              <button
                onClick={reset}
                className="h-8 w-8 rounded-lg bg-[#F5F5F5] hover:bg-[#EEE] flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-[#666]" />
              </button>
              <div>
                <h3 className="text-sm font-bold text-[#111]">Connect {selectedConn.label}</h3>
                <p className="text-xs text-[#999]">{selectedConn.description}</p>
              </div>
            </div>

            {selectedConn.tools.length > 1 && (
              <div className="space-y-2">
                <p className="text-[9px] font-bold text-[#999] uppercase tracking-wider">Tools Included</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedConn.tools.map((t) => {
                    const shortName = t.name.startsWith(selectedConn.service + "_") ? t.name.slice(selectedConn.service.length + 1) : t.name;
                    return (
                      <Badge key={t.name} variant="outline" className="text-[9px] py-0.5 capitalize">
                        {shortName}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Credential fields */}
            <div className="space-y-3">
              <p className="text-[9px] font-bold text-[#999] uppercase tracking-wider">Credentials</p>
              {selectedConn.fields.map((field) => (
                <div key={field.name} className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#666]">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type={field.type === "password" ? "password" : "text"}
                    className="w-full p-2.5 bg-[#FAFAFA] border border-[#E5E5E5] rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#111] focus:bg-white transition-colors"
                    placeholder={field.placeholder}
                    value={formData[field.name] || ""}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  />
                </div>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-red-600 font-medium">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="primary"
                size="sm"
                className="flex-1 h-10"
                disabled={saving}
                onClick={() => handleSave(selectedConn)}
              >
                {saving ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> {selectedConn.hasPing ? "Verifying..." : "Saving..."}</>
                ) : (
                  <><Plug className="h-3.5 w-3.5 mr-2" /> {selectedConn.hasPing ? "Verify & Connect" : "Connect"}</>
                )}
              </Button>
              <Button variant="outline" size="sm" className="h-10" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
