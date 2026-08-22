export interface ChecklistItemState {
  id: string;
  label: string;
  checked: boolean;
  role: string;
  comment?: string;
}

export interface ChecklistSection {
  id: string;
  title: string;
  quantity: number;
  items: ChecklistItemState[];
  /** manually toggled, and set automatically the moment every item becomes checked */
  collapsed?: boolean;
}

export interface ChecklistProject {
  id: string;
  name: string;
  rawText: string;
  sections: ChecklistSection[];
  updatedAt: number;
}

/** a checklist role/poste — `name` is its stable identity (matched against ChecklistItemState.role), `assigneeName` is a display override (e.g. a person's name) */
export interface Role {
  name: string;
  color: string;
  assigneeName?: string;
}

/** quick-pick swatches offered in the role color picker (an 8th, custom slot opens a native picker), also cycled through for a custom role's default color — pale and spread across distinct hues so adjacent ones don't blend together */
export const ROLE_COLOR_PALETTE = [
  "#ffd5d2",
  "#fedec8",
  "#f8e6a0",
  "#baf3db",
  "#c6edfb",
  "#cce0ff",
  "#dfd8fd",
];

/** fixed identity color per default role/poste, as specified — distinct on purpose so they're never confused for one another */
export const DEFAULT_ROLE_COLORS: Record<string, string> = {
  "1er assistant caméra": "#8bc34a",
  "2e assistant caméra": "#c8e6c9",
  "3e assistant caméra / vidéo": "#bbdefb",
  "Assistant vidéo / HF": "#c5cae9",
  "Chef opérateur": "#7c4dff",
  DIT: "#d81b60",
};

/**
 * Resolves the color a role should have: whatever is already stored, no questions asked — a
 * stored color always wins, whether it came from the picker's presets, a custom pick, or a
 * previous default, since there is no reliable way to tell those apart after the fact (an
 * earlier attempt at guessing "was this a leftover default?" ended up reverting deliberate
 * picks that happened to match a preset swatch). Only a role with no stored color yet — brand
 * new, or forced back to blank by consumeForcedColorReset() below — falls back to its fixed
 * identity color or a palette color cycled by position.
 */
function colorForRole(name: string, storedColor: string | undefined, indexFallback: number): string {
  if (storedColor) return storedColor;
  return DEFAULT_ROLE_COLORS[name] ?? ROLE_COLOR_PALETTE[indexFallback % ROLE_COLOR_PALETTE.length];
}

export function defaultRoles(names: string[]): Role[] {
  return names.map((name, i) => ({ name, color: colorForRole(name, undefined, i) }));
}

const CURRENT_KEY = "aynil-checklist:current";
const PROJECTS_KEY = "aynil-checklist:projects";
const ROLES_KEY = "aynil-checklist:roles";
const ROLE_COLOR_RESET_KEY = "aynil-checklist:role-color-reset-v1";

/** true (once, ever) the first time this runs on a given browser — used to force every default role back to its exact specified color one time, since earlier picker experiments could have left one on some other color that later heuristics kept mistaking for a deliberate pick */
function consumeForcedColorReset(): boolean {
  if (typeof window === "undefined") return false;
  if (window.localStorage.getItem(ROLE_COLOR_RESET_KEY)) return false;
  window.localStorage.setItem(ROLE_COLOR_RESET_KEY, "1");
  return true;
}

export function loadCurrent(): ChecklistProject | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CURRENT_KEY);
    return raw ? (JSON.parse(raw) as ChecklistProject) : null;
  } catch {
    return null;
  }
}

export function saveCurrent(project: ChecklistProject) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CURRENT_KEY, JSON.stringify(project));
}

export function listProjects(): ChecklistProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PROJECTS_KEY);
    return raw ? (JSON.parse(raw) as ChecklistProject[]) : [];
  } catch {
    return [];
  }
}

export function upsertProject(project: ChecklistProject) {
  const projects = listProjects().filter((p) => p.id !== project.id);
  projects.unshift(project);
  window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects.slice(0, 30)));
}

export function deleteProject(id: string) {
  const projects = listProjects().filter((p) => p.id !== id);
  window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function newProjectId(): string {
  return `chk_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Accepts both the current Role[] shape and the legacy plain string[] shape, so existing
 * localStorage keeps working. Default roles always come back in their canonical order (healing
 * back in any that went missing from a previously saved list, from before role deletion was
 * disabled — otherwise every checklist item still pointing at that role name would show as
 * unassigned); any role the user added beyond the defaults follows, in the order it was added.
 */
export function loadRoles(defaultNames: string[]): Role[] {
  if (typeof window === "undefined") return defaultRoles(defaultNames);
  try {
    const raw = window.localStorage.getItem(ROLES_KEY);
    if (!raw) return defaultRoles(defaultNames);
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return defaultRoles(defaultNames);
    const forceReset = consumeForcedColorReset();
    const loaded: Role[] = parsed.map((r, i) =>
      typeof r === "string"
        ? { name: r, color: colorForRole(r, undefined, i) }
        : {
            name: (r as Role).name,
            color: colorForRole((r as Role).name, forceReset ? undefined : (r as Role).color, i),
            assigneeName: (r as Role).assigneeName,
          }
    );
    const byName = new Map(loaded.map((r) => [r.name, r]));
    const orderedDefaults = defaultNames.map(
      (name, i): Role => byName.get(name) ?? { name, color: colorForRole(name, undefined, i) }
    );
    const customRoles = loaded.filter((r) => !defaultNames.includes(r.name));
    return [...orderedDefaults, ...customRoles];
  } catch {
    return defaultRoles(defaultNames);
  }
}

export function saveRoles(roles: Role[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
}
