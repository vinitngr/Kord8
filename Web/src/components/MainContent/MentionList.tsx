import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { Cpu, Database } from "lucide-react";

export interface MentionItem {
  id: string;
  label: string;
  type: "tool" | "knowledge";
  service?: string;
}

interface MentionListProps {
  items: MentionItem[];
  command: (item: { id: string; label: string; type: string }) => void;
}

export const MentionList = forwardRef<any, MentionListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<"tools" | "knowledge">("tools");

    const toolItems = items.filter((i) => i.type === "tool");
    const kbItems = items.filter((i) => i.type === "knowledge");
    const visibleItems = activeTab === "tools" ? toolItems : kbItems;

    useEffect(() => setSelectedIndex(0), [items, activeTab]);

    const selectItem = (index: number) => {
      const item = visibleItems[index];
      if (item) {
        command({ id: item.id, label: item.label, type: item.type });
      }
    };

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === "ArrowUp") {
          setSelectedIndex((prev) =>
            prev <= 0 ? visibleItems.length - 1 : prev - 1
          );
          return true;
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((prev) =>
            prev >= visibleItems.length - 1 ? 0 : prev + 1
          );
          return true;
        }
        if (event.key === "Enter") {
          selectItem(selectedIndex);
          return true;
        }
        if (event.key === "Tab") {
          // Switch tabs
          setActiveTab((t) => (t === "tools" ? "knowledge" : "tools"));
          return true;
        }
        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className="mention-dropdown">
          <div className="mention-empty">No tools or knowledge sources configured.</div>
        </div>
      );
    }

    return (
      <div className="mention-dropdown">
        {/* Tab Bar — Zapier style */}
        <div className="mention-tabs">
          <button
            className={`mention-tab ${activeTab === "tools" ? "active" : ""}`}
            onMouseDown={(e) => { e.preventDefault(); setActiveTab("tools"); }}
          >
            Tools
            <span className="mention-tab-count">{toolItems.length}</span>
          </button>
          <button
            className={`mention-tab ${activeTab === "knowledge" ? "active" : ""}`}
            onMouseDown={(e) => { e.preventDefault(); setActiveTab("knowledge"); }}
          >
            Knowledge
            <span className="mention-tab-count">{kbItems.length}</span>
          </button>
        </div>

        {/* Item List */}
        <div className="mention-list">
          {visibleItems.length === 0 ? (
            <div className="mention-empty">
              No {activeTab === "tools" ? "tools" : "knowledge sources"} added yet.
            </div>
          ) : (
            visibleItems.map((item, index) => (
              <button
                key={item.id}
                className={`mention-item ${index === selectedIndex ? "selected" : ""}`}
                onMouseDown={(e) => { e.preventDefault(); selectItem(index); }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className={`mention-item-icon ${item.type === "tool" ? "tool" : "kb"}`}>
                  {item.type === "tool" ? (
                    <Cpu className="h-4 w-4" />
                  ) : (
                    <Database className="h-4 w-4" />
                  )}
                </div>
                <div className="mention-item-text">
                  <span className="mention-item-label">{item.label}</span>
                  {item.service && (
                    <span className="mention-item-service">{item.service}</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="mention-footer">
          <kbd>↑↓</kbd> navigate · <kbd>Enter</kbd> select · <kbd>Tab</kbd> switch
        </div>
      </div>
    );
  }
);

MentionList.displayName = "MentionList";
