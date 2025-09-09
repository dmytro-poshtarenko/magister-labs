import { type ReactElement } from 'react'
import { AppShell, Burger, Group, Text, Title, Box } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Routes, Route, Navigate } from 'react-router-dom'
import { SidebarNav } from './components/SidebarNav'

function App(): ReactElement {
  const [opened, { toggle }] = useDisclosure()

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
            <Box component="img" src="/favicon.svg" alt="Magister Labs logo" w={24} h={24} />
            <Title order={4}>Magister Labs</Title>
          </Group>
          <Text size="sm" c="dimmed">Header</Text>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <SidebarNav />
      </AppShell.Navbar>

      <AppShell.Main>
        <Box p="md">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={
              <>
                <Title order={3} mb="sm">Dashboard</Title>
                <Text c="dimmed">Overview of key metrics and recent activity.</Text>
              </>
            } />
            <Route path="/activity" element={
              <>
                <Title order={3} mb="sm">Activity</Title>
                <Text c="dimmed">Latest events and logs.</Text>
              </>
            } />
            <Route path="/projects" element={
              <>
                <Title order={3} mb="sm">All projects</Title>
                <Text c="dimmed">List of all active projects.</Text>
              </>
            } />
            <Route path="/projects/archived" element={
              <>
                <Title order={3} mb="sm">Archived</Title>
                <Text c="dimmed">Archived projects archive.</Text>
              </>
            } />
            <Route path="/settings/profile" element={
              <>
                <Title order={3} mb="sm">Profile</Title>
                <Text c="dimmed">User profile settings.</Text>
              </>
            } />
            <Route path="/settings/billing" element={
              <>
                <Title order={3} mb="sm">Billing</Title>
                <Text c="dimmed">Billing methods and invoices.</Text>
              </>
            } />
            <Route path="*" element={
              <>
                <Title order={3} mb="sm">Not found</Title>
                <Text c="dimmed">The page you are looking for does not exist.</Text>
              </>
            } />
          </Routes>
        </Box>
      </AppShell.Main>

      <AppShell.Footer>
        <Group h="100%" px="md" justify="space-between">
          <Text size="sm" c="dimmed">© {new Date().getFullYear()} Magister Labs</Text>
        </Group>
      </AppShell.Footer>
    </AppShell>
  )
}

export default App


