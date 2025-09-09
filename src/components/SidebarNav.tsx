import { type ReactElement } from 'react';
import { NavLink, ScrollArea } from '@mantine/core';
import { IconBinaryTree, IconChevronRight, IconLayoutDashboard } from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';
import { navigation, type NavSection, type NavChild } from '../navConfig';

export function SidebarNav(): ReactElement {
  const location = useLocation();
  const sections: NavSection[] = navigation;

  return (
    <ScrollArea type="auto" style={{ height: '100%' }}>
      {sections.map((item: NavSection) =>
        item.path ? (
          <NavLink
            key={item.label}
            label={item.label}
            leftSection={<IconLayoutDashboard size={16} />}
            component={Link}
            to={item.path}
            active={location.pathname === item.path}
          />
        ) : (
          <NavLink
            key={item.label}
            label={item.label}
            leftSection={<IconBinaryTree size={16} />}
            rightSection={<IconChevronRight size={14} />}
            childrenOffset={12}
            defaultOpened
          >
            {item.children?.map((child: NavChild) => (
              <NavLink
                key={child.label}
                label={child.label}
                component={Link}
                to={child.path}
                active={location.pathname === child.path}
              />
            ))}
          </NavLink>
        ),
      )}
    </ScrollArea>
  );
}
