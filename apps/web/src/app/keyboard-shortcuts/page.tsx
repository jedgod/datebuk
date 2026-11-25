"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Keyboard, Copy, Check } from "lucide-react";

interface Shortcut {
  keys: string[];
  description: string;
  scope: "Global" | "Admin" | "Staff" | "Shared";
  category: string;
}

const keyboardShortcuts: Shortcut[] = [
  // Global Navigation
  {
    keys: ["?"],
    description: "Open keyboard shortcuts help (this page)",
    scope: "Global",
    category: "Navigation",
  },
  {
    keys: ["Ctrl", "K"],
    description: "Quick search/command palette",
    scope: "Global",
    category: "Navigation",
  },
  {
    keys: ["Ctrl", "H"],
    description: "Go to home/dashboard",
    scope: "Global",
    category: "Navigation",
  },
  {
    keys: ["Ctrl", "Shift", "L"],
    description: "Logout",
    scope: "Global",
    category: "Navigation",
  },

  // Ticket Management (Staff)
  {
    keys: ["N"],
    description: "Create new ticket",
    scope: "Staff",
    category: "Tickets",
  },
  {
    keys: ["R"],
    description: "Resolve selected ticket",
    scope: "Staff",
    category: "Tickets",
  },
  {
    keys: ["T"],
    description: "Transfer ticket to another agent",
    scope: "Staff",
    category: "Tickets",
  },
  {
    keys: ["E"],
    description: "Edit selected ticket",
    scope: "Staff",
    category: "Tickets",
  },
  {
    keys: ["A"],
    description: "Add note to selected ticket",
    scope: "Staff",
    category: "Tickets",
  },
  {
    keys: ["↑"],
    description: "Select previous ticket",
    scope: "Staff",
    category: "Tickets",
  },
  {
    keys: ["↓"],
    description: "Select next ticket",
    scope: "Staff",
    category: "Tickets",
  },

  // Feedback & Communication
  {
    keys: ["Ctrl", "M"],
    description: "Open feedback modal",
    scope: "Staff",
    category: "Communication",
  },
  {
    keys: ["Shift", "E"],
    description: "Open message reply (if in ticket)",
    scope: "Staff",
    category: "Communication",
  },

  // Performance & Visibility
  {
    keys: ["Ctrl", "P"],
    description: "View performance leaderboard",
    scope: "Staff",
    category: "Performance",
  },
  {
    keys: ["Ctrl", "G"],
    description: "View tracking transparency/privacy",
    scope: "Staff",
    category: "Performance",
  },
  {
    keys: ["Ctrl", "B"],
    description: "View platform health/status",
    scope: "Staff",
    category: "Performance",
  },

  // Admin Specific
  {
    keys: ["Ctrl", "U"],
    description: "View users/staff list",
    scope: "Admin",
    category: "Admin",
  },
  {
    keys: ["Ctrl", "R"],
    description: "Go to RBAC/roles management",
    scope: "Admin",
    category: "Admin",
  },
  {
    keys: ["Ctrl", "S"],
    description: "Go to security monitoring",
    scope: "Admin",
    category: "Admin",
  },
  {
    keys: ["Ctrl", "I"],
    description: "View icon standardization guide",
    scope: "Admin",
    category: "Admin",
  },

  // System Actions
  {
    keys: ["Escape"],
    description: "Close modals and dialogs",
    scope: "Shared",
    category: "System",
  },
  {
    keys: ["Enter"],
    description: "Confirm action or submit form",
    scope: "Shared",
    category: "System",
  },
  {
    keys: ["Ctrl", "S"],
    description: "Save changes (if in edit mode)",
    scope: "Shared",
    category: "System",
  },
  {
    keys: ["Ctrl", "Z"],
    description: "Undo action (if supported)",
    scope: "Shared",
    category: "System",
  },
  {
    keys: ["Ctrl", "Y"],
    description: "Redo action (if supported)",
    scope: "Shared",
    category: "System",
  },

  // Filter & Search
  {
    keys: ["/"],
    description: "Focus on search bar",
    scope: "Shared",
    category: "Search",
  },
  {
    keys: ["Ctrl", "F"],
    description: "Filter current page",
    scope: "Staff",
    category: "Search",
  },
  {
    keys: ["Ctrl", "Backspace"],
    description: "Clear all filters",
    scope: "Staff",
    category: "Search",
  },
];

interface CopiedStates {
  [key: string]: boolean;
}

function KeyboardShortcutCard({ shortcut, onCopy }: { shortcut: Shortcut; onCopy: (keys: string[]) => void }) {
  const keyDisplay = shortcut.keys.join(" + ");
  const shortcutId = keyDisplay;

  return (
    <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {shortcut.keys.map((key) => (
            <kbd
              key={key}
              className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded border border-slate-300 dark:border-slate-600 text-xs font-semibold font-mono"
            >
              {key}
            </kbd>
          ))}
        </div>
        <Badge variant="outline" className="text-xs">
          {shortcut.scope}
        </Badge>
      </div>
      <p className="text-sm text-slate-700 dark:text-slate-300">{shortcut.description}</p>
    </div>
  );
}

export default function KeyboardShortcutsPage() {
  const [copiedStates, setCopiedStates] = useState<CopiedStates>({});

  const copyKeys = (keys: string[]) => {
    navigator.clipboard.writeText(keys.join(" + "));
    const id = keys.join(" + ");
    setCopiedStates({ ...copiedStates, [id]: true });
    setTimeout(() => setCopiedStates({ ...copiedStates, [id]: false }), 2000);
  };

  const categories = Array.from(new Set(keyboardShortcuts.map((s) => s.category)));
  const scopes: Array<"Global" | "Admin" | "Staff" | "Shared"> = ["Global", "Shared", "Staff", "Admin"];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white flex items-center gap-3 mb-2">
            <Keyboard className="w-8 h-8 text-blue-600" />
            Keyboard Shortcuts
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Speed up your workflow with these keyboard shortcuts. Press <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-sm font-mono">?</kbd> anytime to return to this page.
          </p>
        </div>

        {/* Quick Tips */}
        <Card className="mb-8 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="p-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 Quick Tips</h3>
            <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>• Shortcuts are case-sensitive for some keys</li>
              <li>• On Mac, use <kbd className="px-1 py-0.5 bg-blue-200 dark:bg-blue-800 rounded text-xs">Cmd</kbd> instead of <kbd className="px-1 py-0.5 bg-blue-200 dark:bg-blue-800 rounded text-xs">Ctrl</kbd></li>
              <li>• Some shortcuts may be disabled in certain contexts</li>
              <li>• You can customize shortcuts in your user settings (coming soon)</li>
            </ul>
          </CardContent>
        </Card>

        {/* Shortcuts by Category */}
        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category}>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{category}</h2>

              {/* Filter by scope */}
              <div className="space-y-4">
                {scopes.map((scope) => {
                  const scopeShortcuts = keyboardShortcuts.filter(
                    (s) => s.category === category && s.scope === scope
                  );

                  if (scopeShortcuts.length === 0) return null;

                  return (
                    <div key={scope}>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge
                          className={`${
                            scope === "Global"
                              ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                              : scope === "Admin"
                                ? "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200"
                                : scope === "Staff"
                                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                                  : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                          }`}
                        >
                          {scope}
                        </Badge>
                      </div>
                      <div className="grid gap-3">
                        {scopeShortcuts.map((shortcut, idx) => (
                          <KeyboardShortcutCard
                            key={idx}
                            shortcut={shortcut}
                            onCopy={() => copyKeys(shortcut.keys)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Implementation Notes */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Implementation Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">For Developers</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                Keyboard shortcuts are implemented using the <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs font-mono">react-hotkeys-hook</code> library. To add new shortcuts:
              </p>
              <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded text-xs overflow-x-auto text-slate-700 dark:text-slate-300 font-mono">
{`import { useHotkeys } from "react-hotkeys-hook";

export function MyComponent() {
  useHotkeys("ctrl+k", () => {
    // Handle shortcut
  });

  return <div>...</div>;
}`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Adding New Shortcuts</h4>
              <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-400 list-decimal list-inside">
                <li>Add the shortcut definition to the keyboard shortcuts array above</li>
                <li>Implement the shortcut handler in the relevant component</li>
                <li>Test on both Mac and Windows/Linux</li>
                <li>Update this documentation</li>
              </ol>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Scope Guidelines</h4>
              <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                <li>
                  <Badge variant="outline" className="mr-2 text-xs">Global</Badge>
                  Available everywhere in the app
                </li>
                <li>
                  <Badge variant="outline" className="mr-2 text-xs">Shared</Badge>
                  Available to both Admin and Staff dashboards
                </li>
                <li>
                  <Badge variant="outline" className="mr-2 text-xs">Admin</Badge>
                  Admin dashboard only
                </li>
                <li>
                  <Badge variant="outline" className="mr-2 text-xs">Staff</Badge>
                  Staff dashboard only
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50 text-center text-sm text-slate-600 dark:text-slate-400">
          <p>Have a suggestion for a new shortcut? Submit feedback using <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs font-mono">Ctrl+M</kbd></p>
        </div>
      </div>
    </div>
  );
}
