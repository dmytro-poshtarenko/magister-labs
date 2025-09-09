import { type ReactElement } from 'react'
import { NavLink, ScrollArea } from '@mantine/core'
import { IconHome, IconSettings, IconChevronRight, IconFolder } from '@tabler/icons-react'
import { Link, useLocation } from 'react-router-dom'

type NavChild = { label: string; path: string; icon?: ReactElement }
type NavItem = { label: string; icon?: ReactElement; children?: NavChild[] }

const navItems: NavItem[] = [
  {
    label: 'Home',
    icon: <IconHome size={16} />,
    children: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Activity', path: '/activity' },
    ],
  },
  {
    label: 'Projects',
    icon: <IconFolder size={16} />,
    children: [
      { label: 'All projects', path: '/projects' },
      { label: 'Archived', path: '/projects/archived' },
    ],
  },
  {
    label: 'Settings',
    icon: <IconSettings size={16} />,
    children: [
      { label: 'Profile', path: '/settings/profile' },
      { label: 'Billing', path: '/settings/billing' },
    ],
  },
]

export function SidebarNav(): ReactElement {
  const location = useLocation()

  return (
    <ScrollArea type="auto" style={{ height: '100%' }}>
      {navItems.map((item) => (
        <NavLink
          key={item.label}
          label={item.label}
          leftSection={item.icon}
          rightSection={<IconChevronRight size={14} />}
          childrenOffset={12}
          defaultOpened
        >
          {item.children?.map((child) => (
            <NavLink
              key={child.label}
              label={child.label}
              leftSection={child.icon}
              component={Link}
              to={child.path}
              active={location.pathname === child.path}
            />
          ))}
        </NavLink>
      ))}
    </ScrollArea>
  )
}


