import { type ReactElement } from 'react';
import { Badge, Divider, Group, List, Paper, Stack, Table, Text, Title } from '@mantine/core';

type GraphNode = {
  id: string;
  label: string;
  description: string;
  x: number;
  y: number;
};

type GraphEdge = {
  from: string;
  to: string;
  weight: number;
};

type KruskalStep = {
  step: number;
  edge: string;
  weight: number;
  decision: 'Додано' | 'Відхилено';
  explanation: string;
};

const title = 'САОПІ ЛР 5. Використання графічних методів вирішення задач системного аналізу';

const nodes: GraphNode[] = [
  {
    id: 'A',
    label: 'API Gateway',
    description: 'Єдина точка входу для клієнтських запитів',
    x: 430,
    y: 60,
  },
  {
    id: 'B',
    label: 'Auth Service',
    description: 'Автентифікація та авторизація користувачів',
    x: 210,
    y: 145,
  },
  {
    id: 'C',
    label: 'User Profile',
    description: 'Профіль користувача та пов’язані дані',
    x: 330,
    y: 270,
  },
  { id: 'D', label: 'Billing', description: 'Платежі, тарифи та рахунки', x: 650, y: 275 },
  {
    id: 'E',
    label: 'Notifications',
    description: 'Email, push та системні повідомлення',
    x: 180,
    y: 370,
  },
  {
    id: 'F',
    label: 'Analytics',
    description: 'Події, метрики та аналітика використання',
    x: 520,
    y: 385,
  },
];

const edges: GraphEdge[] = [
  { from: 'A', to: 'B', weight: 4 },
  { from: 'A', to: 'C', weight: 6 },
  { from: 'A', to: 'D', weight: 9 },
  { from: 'A', to: 'E', weight: 7 },
  { from: 'A', to: 'F', weight: 10 },
  { from: 'B', to: 'C', weight: 3 },
  { from: 'B', to: 'D', weight: 8 },
  { from: 'B', to: 'E', weight: 6 },
  { from: 'B', to: 'F', weight: 9 },
  { from: 'C', to: 'D', weight: 7 },
  { from: 'C', to: 'E', weight: 5 },
  { from: 'C', to: 'F', weight: 4 },
  { from: 'D', to: 'E', weight: 6 },
  { from: 'D', to: 'F', weight: 5 },
  { from: 'E', to: 'F', weight: 3 },
];

const kruskalSteps: KruskalStep[] = [
  {
    step: 1,
    edge: 'B-C',
    weight: 3,
    decision: 'Додано',
    explanation: 'Перше ребро, цикл не утворюється.',
  },
  {
    step: 2,
    edge: 'E-F',
    weight: 3,
    decision: 'Додано',
    explanation: 'З’єднує нові вершини E та F.',
  },
  {
    step: 3,
    edge: 'A-B',
    weight: 4,
    decision: 'Додано',
    explanation: 'Приєднує компонент A до піддерева B-C.',
  },
  {
    step: 4,
    edge: 'C-F',
    weight: 4,
    decision: 'Додано',
    explanation: 'Об’єднує піддерева A-B-C та E-F.',
  },
  {
    step: 5,
    edge: 'C-E',
    weight: 5,
    decision: 'Відхилено',
    explanation: 'Утворює цикл C-F-E-C.',
  },
  {
    step: 6,
    edge: 'D-F',
    weight: 5,
    decision: 'Додано',
    explanation: 'Приєднує компонент D; усі вершини стають зв’язаними.',
  },
];

const mstEdges = new Set(['B-C', 'E-F', 'A-B', 'C-F', 'D-F']);
const mstTotal = kruskalSteps
  .filter((step) => step.decision === 'Додано')
  .reduce((sum, step) => sum + step.weight, 0);

function edgeId(from: string, to: string): string {
  return [from, to].sort().join('-');
}

function getNode(id: string): GraphNode {
  const node = nodes.find((item) => item.id === id);
  if (!node) throw new Error(`Unknown node ${id}`);
  return node;
}

function matrixWeight(row: string, column: string): number | string {
  if (row === column) return 0;
  const edge = edges.find((item) => edgeId(item.from, item.to) === edgeId(row, column));
  return edge?.weight ?? '—';
}

export default function SaopiLab5(): ReactElement {
  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Title order={3}>{title}</Title>
          <Text c="dimmed">
            Приклад із програмної інженерії: мінімізація складності інтеграцій між компонентами
            SaaS-системи.
          </Text>
        </Stack>
        <Badge size="lg" variant="light" color="green">
          Сумарна вага дерева: {mstTotal}
        </Badge>
      </Group>

      <Paper p="md" withBorder>
        <Stack gap="xs">
          <Title order={4}>Коротко про метод</Title>
          <Text>
            Графова модель описує систему як G=(V,E), де V — вершини, а E — ребра між ними. У
            програмній інженерії вершинами можуть бути сервіси або модулі, а ребрами — інтеграції,
            залежності чи канали обміну даними.
          </Text>
          <Text>
            Якщо ребра мають ваги, можна побудувати мінімальне остовне дерево: зв’язну схему, яка
            включає всі вершини, не має циклів і має мінімальну сумарну вагу.
          </Text>
          <List type="ordered" withPadding>
            <List.Item>Упорядкувати всі ребра за зростанням ваги.</List.Item>
            <List.Item>Послідовно розглядати ребра від найменшого до найбільшого.</List.Item>
            <List.Item>Додавати ребро, якщо воно не утворює цикл.</List.Item>
            <List.Item>Зупинитися, коли дерево містить n-1 ребер.</List.Item>
          </List>
        </Stack>
      </Paper>

      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Title order={4}>Постановка задачі</Title>
          <Text>
            Команда проєктує мінімальну схему інтеграцій між ключовими компонентами SaaS-продукту.
            Потрібно з’єднати всі компоненти, але уникнути зайвих інтеграцій, які ускладнюють
            тестування, підтримку та супровід.
          </Text>
          <Table striped withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Вершина</Table.Th>
                <Table.Th>Компонент</Table.Th>
                <Table.Th>Зміст</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {nodes.map((node) => (
                <Table.Tr key={node.id}>
                  <Table.Td>{node.id}</Table.Td>
                  <Table.Td>{node.label}</Table.Td>
                  <Table.Td>{node.description}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      </Paper>

      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Title order={4}>Матриця ваг інтеграцій</Title>
          <Text c="dimmed">
            Вага ребра — умовна складність інтеграції. Менше значення означає простіший і дешевший
            зв’язок.
          </Text>
          <Table striped withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Компонент</Table.Th>
                {nodes.map((node) => (
                  <Table.Th key={node.id}>{node.id}</Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {nodes.map((row) => (
                <Table.Tr key={row.id}>
                  <Table.Td>{row.id}</Table.Td>
                  {nodes.map((column) => (
                    <Table.Td key={column.id}>{matrixWeight(row.id, column.id)}</Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      </Paper>

      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Title order={4}>SVG-граф інтеграцій</Title>
          <Text c="dimmed">
            Сірі лінії показують усі можливі інтеграції, зелені лінії — ребра мінімального дерева.
          </Text>
          <div style={{ overflowX: 'auto' }}>
            <svg
              width={820}
              height={460}
              style={{ border: '1px solid var(--mantine-color-gray-4)' }}
            >
              <rect x={0} y={0} width={820} height={460} fill="#ffffff" />

              {edges.map((edge) => {
                const from = getNode(edge.from);
                const to = getNode(edge.to);
                const selected = mstEdges.has(edgeId(edge.from, edge.to));
                const midX = (from.x + to.x) / 2;
                const midY = (from.y + to.y) / 2;
                return (
                  <g key={edgeId(edge.from, edge.to)}>
                    <line
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke={selected ? '#2f9e44' : '#ced4da'}
                      strokeWidth={selected ? 4 : 1.5}
                    />
                    <circle
                      cx={midX}
                      cy={midY}
                      r={12}
                      fill="#ffffff"
                      stroke={selected ? '#2f9e44' : '#adb5bd'}
                    />
                    <text
                      x={midX}
                      y={midY + 4}
                      fontSize={11}
                      textAnchor="middle"
                      fontWeight={selected ? 700 : 400}
                    >
                      {edge.weight}
                    </text>
                  </g>
                );
              })}

              {nodes.map((node) => (
                <g key={node.id}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={34}
                    fill="#e7f5ff"
                    stroke="#1c7ed6"
                    strokeWidth={2}
                  />
                  <text
                    x={node.x}
                    y={node.y - 5}
                    textAnchor="middle"
                    fontSize={16}
                    fontWeight={700}
                  >
                    {node.id}
                  </text>
                  <text x={node.x} y={node.y + 13} textAnchor="middle" fontSize={10}>
                    {node.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </Stack>
      </Paper>

      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Title order={4}>Кроки алгоритму Краскала</Title>
          <Table striped withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Крок</Table.Th>
                <Table.Th>Ребро</Table.Th>
                <Table.Th>Вага</Table.Th>
                <Table.Th>Рішення</Table.Th>
                <Table.Th>Пояснення</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {kruskalSteps.map((step) => (
                <Table.Tr key={step.step}>
                  <Table.Td>{step.step}</Table.Td>
                  <Table.Td>{step.edge}</Table.Td>
                  <Table.Td>{step.weight}</Table.Td>
                  <Table.Td fw={step.decision === 'Додано' ? 700 : 400}>{step.decision}</Table.Td>
                  <Table.Td>{step.explanation}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          <Divider />
          <Text>
            Мінімальне дерево містить ребра B-C, E-F, A-B, C-F та D-F. Сумарна вага дорівнює{' '}
            <b>{mstTotal}</b>. Це мінімальний набір інтеграцій, який з’єднує всі компоненти без
            циклів.
          </Text>
        </Stack>
      </Paper>
    </Stack>
  );
}
