// Professional blue and white color palette for avatars
export const AVATAR_COLORS = [
  { id: 'avatar-1', bg: '#e8f0ff', text: '#0066cc' },
  { id: 'avatar-2', bg: '#d4e3ff', text: '#0052a3' },
  { id: 'avatar-3', bg: '#bfd6ff', text: '#003d7a' },
  { id: 'avatar-4', bg: '#c8e6f5', text: '#0066cc' },
  { id: 'avatar-5', bg: '#e0f2ff', text: '#0052a3' },
  { id: 'avatar-6', bg: '#f0f4ff', text: '#0066cc' },
  { id: 'avatar-7', bg: '#e8f0ff', text: '#0052a3' },
  { id: 'avatar-8', bg: '#dce8ff', text: '#003d7a' },
];

export function getAvatarColor(userId: string) {
  // Consistent color based on userId
  const index = userId.charCodeAt(userId.length - 1) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
