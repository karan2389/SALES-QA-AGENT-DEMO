import type { ManagerReview } from "@/types";

/**
 * Local (browser) persistence for MOCK frontend state only: manager reviews and prototype toggles.
 * Nothing here is saved to a backend.
 */
const REVIEWS_KEY = "ffci:mock-reviews:v1";
const PROTO_KEY = "ffci:prototype:v1";

export interface PrototypeSettings { slow: boolean; error: boolean }
const DEFAULT_PROTO: PrototypeSettings = { slow: false, error: false };

type Listener = () => void;
const listeners = new Set<Listener>();
let version = 0;

const isBrowser = () => typeof window !== "undefined";
function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  if (!isBrowser()) return;
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable: keep running in-memory only */ }
}
function emit() {
  version++;
  listeners.forEach((l) => l());
}

let memoryReviews: ManagerReview[] | null = null;
export const getUserReviews = (): ManagerReview[] => (memoryReviews ??= read<ManagerReview[]>(REVIEWS_KEY, []));
export function addUserReview(r: ManagerReview) {
  memoryReviews = [...getUserReviews(), r];
  write(REVIEWS_KEY, memoryReviews);
  emit();
}
export function addUserReviews(rs: ManagerReview[]) {
  memoryReviews = [...getUserReviews(), ...rs];
  write(REVIEWS_KEY, memoryReviews);
  emit();
}
export function resetMockState() {
  memoryReviews = [];
  write(REVIEWS_KEY, []);
  emit();
}

let proto: PrototypeSettings | null = null;
export const getPrototypeSettings = (): PrototypeSettings => (proto ??= { ...DEFAULT_PROTO, ...read(PROTO_KEY, DEFAULT_PROTO) });
export function setPrototypeSettings(p: Partial<PrototypeSettings>) {
  proto = { ...getPrototypeSettings(), ...p };
  write(PROTO_KEY, proto);
  emit();
}

export const getStoreVersion = () => version;
export function subscribeStore(l: Listener) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}
