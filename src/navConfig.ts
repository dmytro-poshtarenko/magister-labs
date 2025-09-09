export type NavChild = { label: string; path: string };
export type NavSection = { label: string; path?: string; children?: NavChild[] };

export const navigation: NavSection[] = [
  {
    label: 'Огляд',
    path: '/',
  },
  {
    label: 'Теорія прийняття рішень',
    children: [
      { label: '1. Аналіз альтернатив в умовах невизначенності', path: '/tpr-lab-1' },
      { label: '2. Вибір рішення в умовах ризику', path: '/tpr-lab-2' },
    ],
  },
];
