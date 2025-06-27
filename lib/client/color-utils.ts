export function getValueBasedColor(valueScore: number | undefined | null): string {
  if (typeof valueScore !== 'number') return '#d1d5db'; // Default gray for undefined/null value
  if (valueScore >= 75) return '#22c55e'; // Green for High Value (75-100)
  if (valueScore >= 40) return '#f59e0b'; // Yellow for Medium Value (40-74)
  return '#ef4444'; // Red for Low Value (0-39)
}

export function getRoleColor(roleIdOrName: string): string {
  const roleColors: Record<string, string> = {
    'SDR': '#1E88E5',
    'CSM': '#43A047',
    'SALES': '#66BB6A',
    'SE': '#2E7D32',
    'CS': '#42A5F5',
    'OPS': '#FB8C00',
    'MKTG': '#7E57C2',
    'ENABLE': '#81C784',
    'IT': '#F57C00',
    'DEFAULT': '#9E9E9E'
  };
  
  const roleKey = Object.keys(roleColors).find(key => roleIdOrName.toUpperCase().includes(key));
  return roleKey ? roleColors[roleKey] : roleColors['DEFAULT'];
}

export function getRoleLightColor(roleIdOrName: string): string {
  const roleLightColors: Record<string, string> = {
    'SDR': '#BBDEFB',
    'CSM': '#C8E6C9',
    'SALES': '#DCEDC8',
    'SE': '#A5D6A7',
    'CS': '#90CAF9',
    'OPS': '#FFE0B2',
    'MKTG': '#D1C4E9',
    'ENABLE': '#E8F5E9',
    'IT': '#FFD54F',
    'DEFAULT': '#F5F5F5'
  };
  
  const roleKey = Object.keys(roleLightColors).find(key => roleIdOrName.toUpperCase().includes(key));
  return roleKey ? roleLightColors[roleKey] : roleLightColors['DEFAULT'];
}

export function getRoleName(roleIdOrName: string): string {
  const roleNames: Record<string, string> = {
    'SDR': 'Sales Development Rep',
    'CSM': 'Customer Success Manager',
    'SALES': 'Sales',
    'SE': 'Sales Engineer',
    'CS': 'Customer Support',
    'OPS': 'Operations',
    'MKTG': 'Marketing',
    'ENABLE': 'Seller Productivity',
    'IT': 'Systems/Infrastructure',
  };
  
  const roleKey = Object.keys(roleNames).find(key => roleIdOrName.toUpperCase().includes(key));
  return roleKey ? roleNames[roleKey] : roleIdOrName;
}

export function calculateBubbleSize(impactScore: number | undefined | null): number {
  if (typeof impactScore !== 'number') return 30; // Default size for undefined/null impact
  // Scale from 30px to 80px based on impact score (0-100)
  return 30 + (impactScore / 100) * 50;
} 