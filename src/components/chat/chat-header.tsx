"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useChatStore } from "@/store/chat-store";

type Agent = { id: string; name: string };

type ChatHeaderProps = {
  conversationId: string;
  contactName: string | null | undefined;
  assignedTo?: Agent | null;
  status: "open" | "closed";
  agents?: Agent[]; // optional list for menu
};

export function ChatHeader({
  conversationId,
  contactName,
  assignedTo,
  status,
  agents = [],
}: ChatHeaderProps) {
  const me = useChatStore((s) => s.me);
  const setAssignment = useChatStore((s) => s.setAssignment);
  const setStatus = useChatStore((s) => s.setStatus);

  const [busy, setBusy] = useState<null | "assign" | "status">(null);
  const isOpen = status === "open";

  const assignMenu: Agent[] = useMemo(() => {
    const base: Agent[] = [];
    if (me) base.push({ id: me.id, name: `${me.name} (me)` });
    for (const a of agents) {
      if (!me || a.id !== me.id) base.push(a);
    }
    base.push({ id: "", name: "Unassign" } as Agent);
    return base;
  }, [agents, me]);

  async function assign(agent: Agent | null) {
    if (busy) return;
    setBusy("assign");
    const prev = assignedTo ?? null;

    // optimistic
    setAssignment(conversationId, agent);

    try {
      const res = await fetch(`/api/chats/${conversationId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId: agent?.id ?? null }),
      });
      if (!res.ok) throw new Error(await res.text());
    } catch (err) {
      setAssignment(conversationId, prev); // rollback
      console.error(err);
      // TODO replace alert with your toast
      alert("Failed to change assignment");
    } finally {
      setBusy(null);
    }
  }

  async function toggleStatus() {
    if (busy) return;
    setBusy("status");
    const prev = status;
    const next = isOpen ? "closed" : "open";

    // optimistic
    setStatus(conversationId, next as "open" | "closed");

    try {
      const res = await fetch(`/api/chats/${conversationId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error(await res.text());
    } catch (err) {
      setStatus(conversationId, prev); // rollback
      console.error(err);
      alert("Failed to change status");
    } finally {
      setBusy(null);
    }
  }

  const displayName = (contactName ?? "").trim() || "Unknown Contact";

  return (
    <div className="border-b bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-200" />
          <div>
            <div className="text-sm font-medium text-gray-900">{displayName}</div>
            <div className="text-xs text-gray-500 mt-1">
              {assignedTo ? `Assigned to ${assignedTo.name}` : "Unassigned"} ·{" "}
              <span className={isOpen ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                {status}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Assignment menu */}
          <div className="relative">
            <button
              type="button"
              disabled={busy === "assign" || assignMenu.length === 0}
              className="inline-flex items-center rounded-xl border px-3 py-1.5 text-sm shadow-sm disabled:opacity-50"
              onClick={(e) => {
                const el = (e.currentTarget.nextSibling as HTMLDivElement) || null;
                if (el) el.classList.toggle("hidden");
              }}
            >
              {assignedTo ? `Assigned: ${assignedTo.name}` : "Assign"}
              <ChevronDown className="ml-1 h-4 w-4" />
            </button>
            <div className="absolute right-0 z-20 mt-1 w-56 rounded-xl border bg-white shadow-lg hidden">
              <ul className="max-h-64 overflow-auto py-1 text-sm">
                {assignMenu.map((a) => (
                  <li key={a.id || "unassign"}>
                    <button
                      className="w-full text-left px-3 py-2 hover:bg-gray-50"
                      onClick={async (e) => {
                        (e.currentTarget.closest("div") as HTMLDivElement)?.classList.add("hidden");
                        await assign(a.id ? { id: a.id, name: a.name.replace(" (me)", "") } : null);
                      }}
                    >
                      {a.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Status toggle */}
          <button
            type="button"
            disabled={busy === "status"}
            onClick={toggleStatus}
            className={`rounded-xl px-3 py-1.5 text-sm shadow-sm border disabled:opacity-50 ${
              isOpen
                ? "bg-green-50 border-green-200 hover:bg-green-100"
                : "bg-red-50 border-red-200 hover:bg-red-100"
            }`}
          >
            {isOpen ? "Mark Closed" : "Reopen"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatHeader;