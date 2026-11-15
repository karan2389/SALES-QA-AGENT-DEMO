/** Data access entry point. UI code imports ONLY from here; swap the implementation to connect real data later. */
export { getCalls, getCallById, getEvaluations, getSalespeople, getDataset, getTeamAnalytics, updateManagerReview } from "./mockRepository";
export type { ReviewInput } from "./mockRepository";
export { getPrototypeSettings, setPrototypeSettings, resetMockState, subscribeStore, getStoreVersion } from "./mockStore";
