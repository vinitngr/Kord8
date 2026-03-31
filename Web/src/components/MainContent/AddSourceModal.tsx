import { useState } from "react";
import { Modal } from "../shared/Modal";
import { Button } from "../shared/Button";
import { FileText, Globe, Link2, Info } from "lucide-react";
import { cn } from "../../lib/utils";

interface AddSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddSourceModal({ isOpen, onClose }: AddSourceModalProps) {
  const [sourceType, setSourceType] = useState<"doc" | "web" | "connector">("doc");

  const connectors = [
    { id: "notion", name: "Notion", icon: "N" },
    { id: "github", name: "GitHub", icon: "GH" },
    { id: "slack", name: "Slack", icon: "S" },
    { id: "confluence", name: "Confluence", icon: "C" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Knowledge Source"
      className="max-w-md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onClose}>Connect Source</Button>
        </>
      }
    >
      <div className="space-y-6 text-left">
        <div className="space-y-3">
          <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider">Source Category</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "doc", label: "Files", icon: FileText },
              { id: "web", label: "Web/URL", icon: Globe },
              { id: "connector", label: "Connectors", icon: Link2 },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setSourceType(type.id as any)}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-lg border transition-all gap-2",
                  sourceType === type.id 
                    ? "border-[#111] bg-[#111]/5 text-[#111]" 
                    : "border-[#E5E5E5] bg-white text-[#999] hover:border-[#BBB]"
                )}
              >
                <type.icon className="h-4 w-4" />
                <span className="text-[10px] font-bold">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {sourceType === "connector" && (
            <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
              {connectors.map(conn => (
                <div key={conn.id} className="p-3 border border-[#F0F0F0] rounded-lg flex items-center gap-3 bg-[#FAFAFA] opacity-70 group cursor-not-allowed">
                  <div className="h-8 w-8 rounded-md bg-white border border-[#E5E5E5] flex items-center justify-center text-[10px] font-bold text-[#111]">
                    {conn.icon}
                  </div>
                  <span className="text-xs font-semibold text-[#666]">{conn.name}</span>
                </div>
              ))}
            </div>
          )}

          {sourceType === "web" && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider">Source Name</label>
                <input className="w-full p-2.5 bg-white border border-[#E5E5E5] rounded-lg text-sm focus:outline-none" placeholder="e.g. Documentation Portal" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider">Site URL</label>
                <input className="w-full p-2.5 bg-white border border-[#E5E5E5] rounded-lg text-sm focus:outline-none" placeholder="https://docs.example.com" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="crawl" className="rounded border-[#E5E5E5]" />
                <label htmlFor="crawl" className="text-xs text-[#666]">Enable recursive crawling</label>
              </div>
            </div>
          )}

          {sourceType === "doc" && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-[#999] uppercase tracking-wider">Source Name</label>
                <input className="w-full p-2.5 bg-white border border-[#E5E5E5] rounded-lg text-sm focus:outline-none" placeholder="e.g. Internal PDF Archive" />
              </div>
              <div className="p-8 border border-dashed border-[#E5E5E5] rounded-xl flex flex-col items-center justify-center gap-2 bg-[#FAFAFA] transition-all hover:bg-white hover:border-[#111] cursor-pointer group">
                <FileText className="h-6 w-6 text-[#BBB] group-hover:text-[#111]" />
                <p className="text-[10px] font-bold text-[#999] group-hover:text-[#111]">Drop PDF, TXT or Markdown files</p>
                <p className="text-[9px] text-[#BBB]">Max 50MB per file</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
          <Info className="h-4 w-4 text-blue-500 mt-0.5" />
          <p className="text-[10px] text-blue-600 leading-relaxed">
            {sourceType === "connector" 
              ? "Connectors allow you to sync data directly from external platforms. Select one to start the OAuth flow."
              : "Data sources are indexed and vectorised automatically. Estimated processing time depends on source size."}
          </p>
        </div>
      </div>
    </Modal>
  );
}
