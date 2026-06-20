import { useEditor, EditorContent, ReactRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Mention from "@tiptap/extension-mention";
import Placeholder from "@tiptap/extension-placeholder";
import tippy from "tippy.js";
import type { Instance as TippyInstance } from "tippy.js";
import { useEffect, useCallback, useRef } from "react";
import { MentionList } from "./MentionList";
import type { MentionItem } from "./MentionList";
import "./prompt-editor.css";

interface PromptEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  availableTools: any[];
  availableKbs: any[];
  onMentionAdd?: (type: "tool" | "knowledge", id: string) => void;
}

// Custom mention node that renders as a badge chip
const CustomMention = Mention.extend({
  // Store type + label as attributes
  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-id"),
        renderHTML: (attributes) => {
          if (!attributes.id) return {};
          return { "data-id": attributes.id };
        },
      },
      label: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-label"),
        renderHTML: (attributes) => {
          if (!attributes.label) return {};
          return { "data-label": attributes.label };
        },
      },
      type: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-type"),
        renderHTML: (attributes) => {
          if (!attributes.type) return {};
          return { "data-type": attributes.type };
        },
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const label = HTMLAttributes["data-label"] || "";
    const type = HTMLAttributes["data-type"] || "tool";

    const wrapper = document.createElement("span");
    wrapper.className = `mention-badge ${type}`;
    wrapper.setAttribute("data-label", label);
    wrapper.setAttribute("data-type", type);
    wrapper.setAttribute("data-id", HTMLAttributes.id);
    wrapper.contentEditable = "false";

    // Icon
    const iconWrap = document.createElement("span");
    iconWrap.className = "badge-icon";
    iconWrap.innerHTML =
      type === "tool"
        ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>`;

    const textNode = document.createTextNode(label);

    wrapper.appendChild(iconWrap);
    wrapper.appendChild(textNode);

    return wrapper;
  },

  parseHTML() {
    return [{ tag: "span.mention-badge" }];
  },
});

export function PromptEditor({
  value,
  onChange,
  placeholder,
  availableTools,
  availableKbs,
  onMentionAdd,
}: PromptEditorProps) {

  // Build items from explicit props
  const buildItems = useCallback((): MentionItem[] => {
    const toolItems: MentionItem[] = (availableTools || []).map((t) => ({
      id: t.name,
      label: t.name,
      type: "tool" as const,
      service: t.serviceName,
    }));

    const kbItems: MentionItem[] = (availableKbs || []).map((kb) => ({
      id: kb.id,
      label: kb.name,
      type: "knowledge" as const,
    }));

    return [...toolItems, ...kbItems];
  }, [availableTools, availableKbs]);

  // ── Refs to break TipTap's stale closure ──
  // useEditor captures callbacks at init. These refs ensure
  // the captured closure always reads the LATEST functions.
  const buildItemsRef = useRef(buildItems);
  buildItemsRef.current = buildItems;

  const onMentionAddRef = useRef(onMentionAdd);
  onMentionAddRef.current = onMentionAdd;

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder || "Write your agent instructions..." }),
      CustomMention.configure({
        HTMLAttributes: { class: "mention-badge" },
        suggestion: {
          char: "/",
          items: ({ query }: { query: string }) => {
            // Read from ref — always fresh
            const all = buildItemsRef.current();
            if (!query) return all;
            return all.filter((item) =>
              item.label.toLowerCase().includes(query.toLowerCase())
            );
          },
          command: ({ editor, range, props }) => {
            const item = props as any;
            // Read from ref — always fresh
            onMentionAddRef.current?.(item.type as "tool" | "knowledge", item.id as string);

            editor
              .chain()
              .focus()
              .insertContentAt(range, [
                {
                  type: "mention",
                  attrs: item,
                },
                {
                  type: "text",
                  text: " ",
                },
              ])
              .run();
          },
          render: () => {
            let component: ReactRenderer | null = null;
            let popup: TippyInstance[] | null = null;

            return {
              onStart: (props: any) => {
                component = new ReactRenderer(MentionList, {
                  props,
                  editor: props.editor,
                });

                if (!props.clientRect) return;

                popup = tippy("body", {
                  getReferenceClientRect: props.clientRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: "manual",
                  placement: "bottom-start",
                  offset: [0, 8],
                  animation: false,
                });
              },
              onUpdate: (props: any) => {
                component?.updateProps(props);
                if (popup && props.clientRect) {
                  popup[0]?.setProps({
                    getReferenceClientRect: props.clientRect,
                  });
                }
              },
              onKeyDown: (props: any) => {
                if (props.event.key === "Escape") {
                  popup?.[0]?.hide();
                  return true;
                }
                return (component?.ref as any)?.onKeyDown(props) ?? false;
              },
              onExit: () => {
                popup?.[0]?.destroy();
                component?.destroy();
              },
            };
          },
        },
      }),
    ],
    content: value || "",
    onUpdate: ({ editor: ed }) => {
      const json = ed.getJSON();
      const text = serializeToPrompt(json);
      onChange(text);
    },
    editorProps: {
      attributes: { class: "tiptap" },
    },
  });

  // Sync external value changes (e.g. loading an existing agent)
  useEffect(() => {
    if (editor && value !== serializeToPrompt(editor.getJSON())) {
      // Only reset if the value actually diverged (avoids cursor jumps)
      const currentText = serializeToPrompt(editor.getJSON());
      if (value !== currentText) {
        editor.commands.setContent(value || "");
      }
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="prompt-editor-wrap">
      <EditorContent editor={editor} />
      {/* Footer hint */}
      <div className="px-8 py-3 border-t border-[#27272A] flex items-center gap-1.5">
        <span className="text-[12px] text-[#3F3F46]">
          Use{" "}
          <kbd className="inline-block px-1.5 py-0.5 rounded bg-[#27272A] border border-[#3F3F46] text-[#71717A] text-[10px] font-mono mx-0.5">
            /
          </kbd>{" "}
          to add tools & knowledge
        </span>
      </div>
    </div>
  );
}

/**
 * Serialize TipTap JSON to a flat prompt string.
 * Mention nodes become {{ tool:id }} or {{ knowledge:id }}.
 * Everything else is plain text.
 */
function serializeToPrompt(doc: any): string {
  if (!doc?.content) return "";

  const lines: string[] = [];

  for (const block of doc.content) {
    if (block.type === "paragraph") {
      let line = "";
      if (block.content) {
        for (const node of block.content) {
          if (node.type === "text") {
            line += node.text;
          } else if (node.type === "mention") {
            const type = node.attrs?.type || "tool";
            const id = node.attrs?.id || "";
            line += `{{ ${type}:${id} }}`;
          }
        }
      }
      lines.push(line);
    }
  }

  return lines.join("\n");
}
