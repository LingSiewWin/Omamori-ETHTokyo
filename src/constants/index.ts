// Application constants
export const MASCOT_IMAGES = {
  cat: {
    closed: '/pet/pet1-closed.png',
    open: '/pet/pet1-open.png'
  },
  character1: {
    closed: '/pet/pet2-closed.png',
    open: '/pet/pet2-open.png'
  },
  character2: {
    closed: '/pet/pet3-closed.png',
    open: '/pet/pet3-open.png'
  }
} as const;

export const LOADING_ICONS = [
  '/loading-element/loading1.png',
  '/loading-element/loading2.png',
  '/loading-element/loading3.png',
  '/loading-element/loading4.png',
  '/loading-element/loading5.png',
  '/loading-element/loading6.png',
  '/loading-element/loading7.png'
] as const;

export const CULTURAL_VALUES = [
  {
    title: 'もったいない',
    subtitle: 'Mottainai',
    icon: '🌿',
    progress: 85,
    description: 'Waste prevention mindset'
  },
  {
    title: 'おもてなし',
    subtitle: 'Omotenashi',
    icon: '🤝',
    progress: 72,
    description: 'Respectful hospitality'
  },
  {
    title: '協働',
    subtitle: 'Kyōdō',
    icon: '👥',
    progress: 68,
    description: 'Community cooperation'
  },
  {
    title: '伝統',
    subtitle: 'Dentō',
    icon: '📜',
    progress: 91,
    description: 'Traditional preservation'
  }
] as const;