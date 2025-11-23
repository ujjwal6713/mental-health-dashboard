const MINIMUM_THRESHOLD = 5;

export function shouldSuppress(count: number, threshold: number = MINIMUM_THRESHOLD): boolean {
  return count < threshold;
}

export function applySuppression<T extends { count?: number; student_count?: number }>(
  data: T[],
  threshold: number = MINIMUM_THRESHOLD,
  mode: 'remove' | 'mark' = 'mark'
): (T & { suppressed?: boolean })[] {
  if (mode === 'remove') {
    return data.filter(item => {
      const count = item.count ?? item.student_count ?? 0;
      return count >= threshold;
    });
  }

  return data.map(item => {
    const count = item.count ?? item.student_count ?? 0;
    if (count < threshold) {
      return {
        ...item,
        suppressed: true,
        average_score: undefined,
        score_percent: undefined,
      };
    }
    return { ...item, suppressed: false };
  });
}

export function formatSuppressedValue(
  value: number | string | undefined,
  count: number,
  threshold: number = MINIMUM_THRESHOLD
): string {
  if (shouldSuppress(count, threshold)) {
    return `<${threshold}*`;
  }
  return String(value ?? 'N/A');
}

export function getSuppressionWarning(threshold: number = MINIMUM_THRESHOLD): string {
  return `* Data suppressed for privacy: groups with fewer than ${threshold} students are not shown to protect individual privacy (FIPPA/PHIPA compliance).`;
}

export function isDatasetTooSmall(totalCount: number, threshold: number = MINIMUM_THRESHOLD): boolean {
  return totalCount < threshold;
}

export function applyPrivacyGuards<T extends { 
  student_count: number; 
  average_score?: number;
  [key: string]: any;
}>(
  data: T[],
  threshold: number = MINIMUM_THRESHOLD
): (T & { suppressed: boolean })[] {
  return data.map(item => ({
    ...item,
    suppressed: shouldSuppress(item.student_count, threshold),
    average_score: shouldSuppress(item.student_count, threshold) 
      ? undefined 
      : item.average_score,
  }));
}