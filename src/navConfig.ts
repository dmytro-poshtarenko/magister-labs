import { IconBinaryTree, IconLayoutDashboard, IconSitemap } from '@tabler/icons-react';

export type NavChild = { label: string; path: string };
export type NavIcon = typeof IconLayoutDashboard;
export type NavSection = { label: string; icon: NavIcon; path?: string; children?: NavChild[] };

export const navigation: NavSection[] = [
  {
    label: 'Огляд',
    icon: IconLayoutDashboard,
    path: '/',
  },
  {
    label: 'Теорія прийняття рішень',
    icon: IconBinaryTree,
    children: [
      { label: '1. Аналіз альтернатив в умовах невизначенності', path: '/tpr-lab-1' },
      { label: '2. Вибір рішення в умовах ризику', path: '/tpr-lab-2' },
      { label: '4. Метод аналізу ієрархій', path: '/tpr-lab-4' },
      { label: '5. Теорія ігор', path: '/tpr-lab-5' },
      { label: '6. Метод розстановки пріоритетів', path: '/tpr-lab-6' },
      { label: '7. Графічний метод', path: '/tpr-lab-7' },
    ],
  },
  {
    label: 'Системний аналіз об’єктів програмної інженерії',
    icon: IconSitemap,
    children: [
      {
        label: '2. Застосування табличного методу для формалізації задач системного аналізу',
        path: '/saopi-lab-2',
      },
      {
        label: '3. Використання методу аналізу ієрархій для вирішення задач системного аналізу',
        path: '/saopi-lab-3',
      },
      {
        label:
          "4. Використання методу аналізу ієрархій для вирішення багаторівневих задач системного аналізу об'єктів програмної інженерії",
        path: '/saopi-lab-4',
      },
      {
        label: '5. Використання графічних методів вирішення задач системного аналізу',
        path: '/saopi-lab-5',
      },
      {
        label: "6. Розв'язання задач системного аналізу побудовою дерева рішень",
        path: '/saopi-lab-6',
      },
    ],
  },
];
