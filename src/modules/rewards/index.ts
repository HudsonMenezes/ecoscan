// API pública do rewards. Outros módulos importam só daqui.
export { LEVELS } from './model/levels';
export type { Level } from './model/levels';
export { rewardFor } from './model/rewardRules';
export type { Reward } from './model/rewardRules';
export { getLedger, getWallet } from './model/ledger';
export type { LedgerEntry, Wallet } from './model/ledger';
export { claimDisposal, SCAN_TTL_MS } from './model/claimDisposal';
export type { ClaimError, ClaimResult } from './model/claimDisposal';
export { COLLECTION_POINTS, findPoint } from './model/points';
export type { CollectionPoint } from './model/points';
export { parsePointUrl } from './qr/parsePointUrl';
