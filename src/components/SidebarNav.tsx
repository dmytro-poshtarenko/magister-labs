import { useEffect, useState, type ReactElement } from 'react';
import { NavLink, ScrollArea } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';
import { navigation, type NavSection, type NavChild } from '../navConfig';

export function SidebarNav(): ReactElement {
  const location = useLocation();
  const sections: NavSection[] = navigation;
  const activeSectionLabel =
    sections.find((item: NavSection) =>
      item.children?.some((child: NavChild) => child.path === location.pathname),
    )?.label ?? null;
  const [openedSectionLabel, setOpenedSectionLabel] = useState<string | null>(activeSectionLabel);

  useEffect(() => {
    setOpenedSectionLabel(activeSectionLabel);
  }, [activeSectionLabel]);

  return (
    <ScrollArea type="auto" style={{ height: '100%' }}>
      {sections.map((item: NavSection) => {
        const SectionIcon = item.icon;
        const isSectionOpened = openedSectionLabel === item.label;

        return item.path ? (
          <NavLink
            key={item.label}
            label={item.label}
            leftSection={<SectionIcon size={16} />}
            component={Link}
            to={item.path}
            active={location.pathname === item.path}
          />
        ) : (
          <NavLink
            key={item.label}
            label={item.label}
            leftSection={<SectionIcon size={16} />}
            rightSection={<IconChevronRight size={14} />}
            childrenOffset={12}
            opened={isSectionOpened}
            onClick={() => setOpenedSectionLabel(isSectionOpened ? null : item.label)}
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
        );
      })}
    </ScrollArea>
  );
}
