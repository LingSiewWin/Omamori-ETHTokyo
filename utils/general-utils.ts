// Simple className utility
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Format currency with Japanese locale
export function formatCurrency(amount: number, currency: 'JPYC' | 'USDC' = 'JPYC'): string {
  if (currency === 'JPYC') {
    return `¥${amount.toLocaleString('ja-JP')}`;
  }
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

// Calculate progress percentage
export function calculateProgress(current: number, target: number): number {
  return Math.min(Math.round((current / target) * 100), 100);
}

// Generate cultural wisdom
export function getCulturalWisdom(): string {
  const wisdoms = [
    'もったいない精神で今日を振り返りましょう',
    '小さな一歩が大きな変化を生みます',
    '感謝の心を忘れずに 🙏',
    '忍耐は幸運をもたらす'
  ];
  return wisdoms[Math.floor(Math.random() * wisdoms.length)];
}