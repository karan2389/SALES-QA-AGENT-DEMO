/**
 * Data access entry point. UI code imports ONLY from here.
 * To connect Supabase / an API later, replace the implementation re-exported below.
 */
export {
  getCalls, getCallById, getEvaluations, getSalespeople, getTranscripts, getManagerReviews, getDataset,
  getTeamAnalytics, getSalespersonProfile, updateManagerReview, markCallsForReview,
} from "./mockRepository";
export {
  getPrototypeSettings, setPrototypeSettings, resetMockState, subscribeStore, getStoreVersion,
} from "./mockStore";
