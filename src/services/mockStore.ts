import type { ReviewAction } from "@/types";

/** Browser-only persistence for MOCK review actions and prototype toggles. Nothing is sent to a backend. */
const ACTIONS_KEY = "ffci2:actions:v1";
const PROTO_KEY = "ffci2:prototype:v1";
export interface PrototypeSettings { slow: boolean; error: boolean }

type Listener = () => void;
const listeners = new Set<Listener>();
let version = 0;
const isBrowser = () => typeof window !== "undefined";
function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try { const raw = window.localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
}
function write(key: string, value: unknown) { if (!isBrowser()) return; try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* in-memory only */ } }
const emit = () => { version++; listeners.forEach((l) => l()); };

let actions: ReviewAction[] | null = null;
export const getUserActions = () => (actions ??= read<ReviewAction[]>(ACTIONS_KEY, []));
export function addUserAction(a: ReviewAction) { actions = [...getUserActions(), a]; write(ACTIONS_KEY, actions); emit(); }
export function resetMockState() { actions = []; write(ACTIONS_KEY, []); emit(); }

let proto: PrototypeSettings | null = null;
export const getPrototypeSettings = (): PrototypeSettings => (proto ??= { slow: false, error: false, ...read(PROTO_KEY, {}) });
export function setPrototypeSettings(p: Partial<PrototypeSettings>) { proto = { ...getPrototypeSettings(), ...p }; write(PROTO_KEY, proto); emit(); }

export const getStoreVersion = () => version;
export function subscribeStore(l: Listener) { listeners.add(l); return () => { listeners.delete(l); }; }
