import { RANKS } from '../constants/ranks';
export const resolveRank = (score) => { return Object.values(RANKS).find(r => score >= r.min) || RANKS.BETA; };
