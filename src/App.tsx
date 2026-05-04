import { type ReactElement } from 'react';
import { AppShell, Burger, Group, Text, Title, Box } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Routes, Route } from 'react-router-dom';
import Overview from './pages/Overview';
import TprLab1 from './disciplines/decision-theory/Lab1';
import TprLab2 from './disciplines/decision-theory/Lab2';
import TprLab4 from './disciplines/decision-theory/Lab4';
import TprLab5 from './disciplines/decision-theory/Lab5';
import TprLab6 from './disciplines/decision-theory/Lab6';
import TprLab7 from './disciplines/decision-theory/Lab7';
import SaopiLab2 from './disciplines/saopi/lab-2/Lab2';
import SaopiLab3 from './disciplines/saopi/lab-3/Lab3';
import SaopiLab4 from './disciplines/saopi/lab-4/Lab4';
import SaopiLab5 from './disciplines/saopi/lab-5/Lab5';
import SaopiLab6 from './disciplines/saopi/lab-6/Lab6';
import SaopiLab7 from './disciplines/saopi/lab-7/Lab7';
import SaopiLab8 from './disciplines/saopi/lab-8/Lab8';
import SaopiLab9 from './disciplines/saopi/lab-9/Lab9';
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
            <Route path="/tpr-lab-4" element={<TprLab4 />} />
            <Route path="/tpr-lab-5" element={<TprLab5 />} />
            <Route path="/tpr-lab-6" element={<TprLab6 />} />
            <Route path="/tpr-lab-7" element={<TprLab7 />} />
            <Route path="/saopi-lab-2" element={<SaopiLab2 />} />
            <Route path="/saopi-lab-3" element={<SaopiLab3 />} />
            <Route path="/saopi-lab-4" element={<SaopiLab4 />} />
            <Route path="/saopi-lab-5" element={<SaopiLab5 />} />
            <Route path="/saopi-lab-6" element={<SaopiLab6 />} />
            <Route path="/saopi-lab-7" element={<SaopiLab7 />} />
            <Route path="/saopi-lab-8" element={<SaopiLab8 />} />
            <Route path="/saopi-lab-9" element={<SaopiLab9 />} />
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
