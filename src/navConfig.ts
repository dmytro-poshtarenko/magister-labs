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
      { label: '4. Метод аналізу ієрархій', path: '/tpr-lab-4' },
      { label: '5. Теорія ігор', path: '/tpr-lab-5' },
      { label: '6. Метод розстановки пріоритетів', path: '/tpr-lab-6' },
      { label: '7. Графічний метод', path: '/tpr-lab-7' },
    ],
  },
];
