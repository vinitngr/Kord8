import { Database } from "lucide-react";
import { Button } from "../shared/Button";

interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
}

interface KBViewProps {
  kbs: KnowledgeBase[];
  onAdd: () => void;
}

export function KBView({ kbs, onAdd }: KBViewProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#111]">Knowledge Connectors</h1>
        <Button variant="primary" size="sm" onClick={onAdd}>Add Source</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {kbs.map(kb => (
          <div key={kb.id} className="bg-white border border-[#E5E5E5] rounded-xl p-4 space-y-3 card-hover">
            <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Database className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold">{kb.name}</h4>
            <p className="text-xs text-[#999] min-h-[32px]">{kb.description}</p>
            <div className="pt-2 flex items-center justify-between border-t border-[#F5F5F5]">
              <span className="text-[10px] text-[#BBB]">Synced 1h ago</span>
              <Button variant="ghost" size="sm" className="h-7 text-[10px] text-blue-600 hover:text-blue-700 p-0">Configure</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
