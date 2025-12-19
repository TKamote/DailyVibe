/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  const today = new Date();
  return formatDateString(today);
}

/**
 * Format a Date object to YYYY-MM-DD string
 */
export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string to Date object
 */
export function parseDateString(dateString: string): Date {
  return new Date(dateString + 'T00:00:00');
}

/**
 * Check if a date string is today
 */
export function isToday(dateString: string): boolean {
  return dateString === getTodayDateString();
}

/**
 * Check if a date string is yesterday
 */
export function isYesterday(dateString: string): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateString === formatDateString(yesterday);
}

/**
 * Get the last N days as date strings
 */
export function getLastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push(formatDateString(date));
  }
  return days;
}

/**
 * Calculate current streak from completed dates
 * Streak continues if habit was completed yesterday or today
 */
export function calculateStreak(completedDates: string[]): number {
  if (completedDates.length === 0) return 0;

  // Sort dates in descending order (most recent first)
  const sortedDates = [...completedDates].sort().reverse();
  
  let streak = 0;
  const today = getTodayDateString();
  const yesterday = formatDateString(new Date(Date.now() - 86400000));

  // Check if completed today or yesterday to start streak
  if (!sortedDates.includes(today) && !sortedDates.includes(yesterday)) {
    return 0;
  }

  // Start counting from today or yesterday
  let checkDate = sortedDates.includes(today) ? today : yesterday;
  
  for (const dateStr of sortedDates) {
    if (dateStr === checkDate) {
      streak++;
      // Move to previous day
      const date = parseDateString(checkDate);
      date.setDate(date.getDate() - 1);
      checkDate = formatDateString(date);
    } else if (dateStr < checkDate) {
      // Gap found, streak broken
      break;
    }
  }

  return streak;
}

/**
 * Generate a random color for a habit
 */
export function getRandomColor(): string {
  const colors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#F97316', // Orange
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

