import { PENALTIES } from '../constants/penalties';

export const computePenalties = (gapDays, ignoredTasks) => {
  let penalty = 0;
  
  // Sequence penalty
  if (gapDays === 1) penalty += PENALTIES.INACTIVE_1_DAY;
  else if (gapDays === 2) penalty += PENALTIES.INACTIVE_2_DAYS * 2;
  else if (gapDays >= 3 && gapDays < 7) penalty += PENALTIES.INACTIVE_3_PLUS_DAYS * gapDays;
  else if (gapDays >= 7) penalty += PENALTIES.NO_LOG_7_PLUS_DAYS * gapDays;
  
  // Permanent ignores
  if (ignoredTasks > 0) {
    penalty += PENALTIES.IGNORED_PERMANENT_3_DAYS * ignoredTasks * gapDays;
  }
  
  return penalty;
};
