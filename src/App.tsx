import { type ReactElement } from 'react';
import { AppShell, Burger, Group, Text, Title, Box } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Routes, Route } from 'react-router-dom';
import Overview from './pages/Overview';
import TprLab1 from './decision-theory/TprLab1';
import TprLab2 from './decision-theory/TprLab2';
import { SidebarNav } from './components/SidebarNav';

function App(): ReactElement {
  const [opened, { toggle }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 280, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      footer={{ height: 48 }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Box
              component="img"
              src={import.meta.env.BASE_URL + 'favicon.svg'}
              alt="Magister Labs logo"
              w={24}
              h={24}
            />
            <Title order={4}>Magister Labs</Title>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <SidebarNav />
      </AppShell.Navbar>

      <AppShell.Main>
        <Box p="md">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/tpr-lab-1" element={<TprLab1 />} />
            <Route path="/tpr-lab-2" element={<TprLab2 />} />
            <Route
              path="*"
              element={
                <>
                  <Title order={3} mb="sm">
                    Not found
                  </Title>
                  <Text c="dimmed">The page you are looking for does not exist.</Text>
                </>
              }
            />
          </Routes>
        </Box>
      </AppShell.Main>

      <AppShell.Footer>
        <Group h="100%" px="md" justify="space-between">
          <Text size="sm" c="dimmed">
            © {new Date().getFullYear()} Magister Labs
          </Text>
          <Text size="sm" c="dimmed">
            Created by Dmytro Poshtarenko
          </Text>
        </Group>
      </AppShell.Footer>
    </AppShell>
  );
}

export default App;
