import { type ReactElement } from 'react';
import { Badge, Divider, Group, List, Paper, Stack, Table, Text, Title } from '@mantine/core';

type EnvironmentState = {
  id: string;
  label: string;
  probability: number;
};

type ReleaseAlternative = {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  payoffs: Record<string, number>;
};

const title = "САОПІ ЛР 6. Розв'язання задач системного аналізу побудовою дерева рішень";

const states: EnvironmentState[] = [
  {
    id: 's1',
    label: 'Високий попит і низька кількість дефектів',
    probability: 0.45,
  },
  {
    id: 's2',
    label: 'Середній попит і помірна кількість дефектів',
    probability: 0.35,
  },
  {
    id: 's3',
    label: 'Низький попит або критичні дефекти',
    probability: 0.2,
  },
];

const alternatives: ReleaseAlternative[] = [
  {
    id: 'a1',
    label: 'A1: швидкий реліз на всіх користувачів',
    shortLabel: 'A1',
    description: 'Функція одразу відкривається всій аудиторії продукту.',
    payoffs: {
      s1: 100,
      s2: 40,
      s3: -35,
    },
  },
  {
    id: 'a2',
    label: 'A2: поступовий rollout через feature flags',
    shortLabel: 'A2',
    description: 'Функція вмикається малими хвилями з можливістю швидкого відкату.',
    payoffs: {
      s1: 80,
      s2: 50,
      s3: 37.5,
    },
  },
  {
    id: 'a3',
    label: 'A3: відкласти реліз і провести стабілізацію',
    shortLabel: 'A3',
    description: 'Команда переносить реліз і витрачає додатковий час на тестування.',
    payoffs: {
      s1: 35,
      s2: 45,
      s3: 37.5,
    },
  },
];

function formatNumber(value: number, digits = 2): string {
  return value.toFixed(digits).replace(/\.?0+$/, '');
}

function payoff(alternative: ReleaseAlternative, state: EnvironmentState): number {
  return alternative.payoffs[state.id] ?? 0;
}

function branchValue(alternative: ReleaseAlternative, state: EnvironmentState): number {
  return state.probability * payoff(alternative, state);
}

function expectedValue(alternative: ReleaseAlternative): number {
  return states.reduce((sum, state) => sum + branchValue(alternative, state), 0);
}

const rankedAlternatives = alternatives
  .map((alternative) => ({
    ...alternative,
    expectedValue: expectedValue(alternative),
  }))
  .sort((left, right) => right.expectedValue - left.expectedValue);

const bestAlternative = rankedAlternatives[0]!;

function alternativeY(index: number): number {
  return 100 + index * 165;
}

function stateY(alternativeIndex: number, stateIndex: number): number {
  return alternativeY(alternativeIndex) - 52 + stateIndex * 52;
}

function calculationText(alternative: ReleaseAlternative): string {
  return states
    .map(
      (state) => `${formatNumber(state.probability)} * ${formatNumber(payoff(alternative, state))}`,
    )
    .join(' + ');
}

export default function SaopiLab6(): ReactElement {
  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Title order={3}>{title}</Title>
          <Text c="dimmed">
            Приклад із програмної інженерії: вибір стратегії релізу нової функціональності
            SaaS-продукту в умовах невизначеності.
          </Text>
        </Stack>
        <Badge size="lg" variant="light" color="green">
          Найкраще рішення: поступовий rollout
        </Badge>
      </Group>

      <Paper p="md" withBorder>
        <Stack gap="xs">
          <Title order={4}>Коротко про метод</Title>
          <Text>
            Дерево рішень показує послідовність вибору та можливих випадкових подій. Квадратна
            вершина позначає момент прийняття рішення, круглі вершини — стани середовища з
            імовірностями, а кінцеві гілки — платежі або виграші.
          </Text>
          <Text>
            Для кожної альтернативи обчислюється очікуване значення: EV(Ai) = Σ p_j * x_ij. Якщо
            задача максимізує ефект, обирається альтернатива з найбільшим EV.
          </Text>
          <List type="ordered" withPadding>
            <List.Item>Визначити доступні альтернативи рішення.</List.Item>
            <List.Item>Описати можливі стани середовища та їх імовірності.</List.Item>
            <List.Item>Заповнити матрицю платежів для кожної пари альтернатива-стан.</List.Item>
            <List.Item>Побудувати дерево рішень і порахувати EV для кожної альтернативи.</List.Item>
            <List.Item>Обрати альтернативу з найбільшою очікуваною цінністю.</List.Item>
          </List>
        </Stack>
      </Paper>

      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Title order={4}>Постановка задачі</Title>
          <Text>
            Команда готує реліз нової функції SaaS-продукту. Потрібно вибрати стратегію релізу,
            враховуючи, що після запуску попит і кількість дефектів можуть відрізнятися від
            прогнозу.
          </Text>
          <Table striped withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Альтернатива</Table.Th>
                <Table.Th>Опис</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {alternatives.map((alternative) => (
                <Table.Tr key={alternative.id}>
                  <Table.Td>{alternative.label}</Table.Td>
                  <Table.Td>{alternative.description}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      </Paper>

      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Title order={4}>Імовірності та платежі</Title>
          <Text c="dimmed">
            Платежі подано в умовних балах бізнес-цінності. Додатне значення означає корисний ефект,
            від’ємне — втрати через дефекти, підтримку або репутаційний ризик.
          </Text>
          <Table striped withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Альтернатива</Table.Th>
                {states.map((state) => (
                  <Table.Th key={state.id}>
                    {state.label}, p={formatNumber(state.probability)}
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {alternatives.map((alternative) => (
                <Table.Tr key={alternative.id}>
                  <Table.Td>{alternative.label}</Table.Td>
                  {states.map((state) => (
                    <Table.Td key={state.id}>{formatNumber(payoff(alternative, state))}</Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      </Paper>

      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Title order={4}>SVG-дерево рішень</Title>
          <Text c="dimmed">
            Квадрат — вибір стратегії, кола — випадкові стани середовища, кінцеві прямокутники —
            платежі та внески в очікуване значення.
          </Text>
          <div style={{ overflowX: 'auto' }}>
            <svg
              width={980}
              height={560}
              viewBox="0 0 980 560"
              style={{ border: '1px solid var(--mantine-color-gray-4)' }}
            >
              <rect x={0} y={0} width={980} height={560} fill="#ffffff" />

              <rect x={28} y={234} width={116} height={72} rx={8} fill="#dbeafe" stroke="#2563eb" />
              <text x={86} y={260} textAnchor="middle" fontSize={13} fontWeight={700}>
                Рішення
              </text>
              <text x={86} y={280} textAnchor="middle" fontSize={11}>
                стратегія
              </text>
              <text x={86} y={296} textAnchor="middle" fontSize={11}>
                релізу
              </text>

              {alternatives.map((alternative, alternativeIndex) => {
                const y = alternativeY(alternativeIndex);
                const isBest = alternative.id === bestAlternative.id;
                return (
                  <g key={alternative.id}>
                    <line x1={144} y1={270} x2={272} y2={y} stroke="#94a3b8" strokeWidth={1.5} />
                    <text x={200} y={(270 + y) / 2 - 8} fontSize={11} fill="#334155">
                      {alternative.shortLabel}
                    </text>

                    <rect
                      x={272}
                      y={y - 32}
                      width={166}
                      height={64}
                      rx={8}
                      fill={isBest ? '#dcfce7' : '#f8fafc'}
                      stroke={isBest ? '#16a34a' : '#64748b'}
                      strokeWidth={isBest ? 3 : 1.5}
                    />
                    <text x={355} y={y - 9} textAnchor="middle" fontSize={12} fontWeight={700}>
                      {alternative.shortLabel}
                    </text>
                    <text x={355} y={y + 9} textAnchor="middle" fontSize={11}>
                      EV={formatNumber(expectedValue(alternative))}
                    </text>
                    <text x={355} y={y + 25} textAnchor="middle" fontSize={10}>
                      {isBest ? 'оптимально' : 'альтернатива'}
                    </text>

                    <line x1={438} y1={y} x2={532} y2={y} stroke="#94a3b8" strokeWidth={1.5} />
                    <circle
                      cx={560}
                      cy={y}
                      r={34}
                      fill="#fef3c7"
                      stroke="#d97706"
                      strokeWidth={2}
                    />
                    <text x={560} y={y - 4} textAnchor="middle" fontSize={11} fontWeight={700}>
                      Стан
                    </text>
                    <text x={560} y={y + 12} textAnchor="middle" fontSize={10}>
                      середовища
                    </text>

                    {states.map((state, stateIndex) => {
                      const terminalY = stateY(alternativeIndex, stateIndex);
                      const value = branchValue(alternative, state);
                      return (
                        <g key={`${alternative.id}-${state.id}`}>
                          <line
                            x1={594}
                            y1={y}
                            x2={702}
                            y2={terminalY}
                            stroke="#cbd5e1"
                            strokeWidth={1.5}
                          />
                          <text x={632} y={(y + terminalY) / 2 - 5} fontSize={10} fill="#475569">
                            {state.id.toUpperCase()}, p={formatNumber(state.probability)}
                          </text>
                          <rect
                            x={702}
                            y={terminalY - 22}
                            width={224}
                            height={44}
                            rx={6}
                            fill="#ffffff"
                            stroke="#94a3b8"
                          />
                          <text x={714} y={terminalY - 4} fontSize={10} fontWeight={700}>
                            x={formatNumber(payoff(alternative, state))}
                          </text>
                          <text x={714} y={terminalY + 12} fontSize={10}>
                            внесок: {formatNumber(value)}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </svg>
          </div>
        </Stack>
      </Paper>

      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Title order={4}>Розрахунок очікуваних значень</Title>
          <Table striped withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Альтернатива</Table.Th>
                <Table.Th>Формула</Table.Th>
                <Table.Th>EV</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rankedAlternatives.map((alternative) => (
                <Table.Tr key={alternative.id}>
                  <Table.Td fw={alternative.id === bestAlternative.id ? 700 : 400}>
                    {alternative.label}
                  </Table.Td>
                  <Table.Td>{calculationText(alternative)}</Table.Td>
                  <Table.Td fw={alternative.id === bestAlternative.id ? 700 : 400}>
                    {formatNumber(alternative.expectedValue)}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      </Paper>

      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Title order={4}>Підсумкове ранжування</Title>
          <Table striped withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Місце</Table.Th>
                <Table.Th>Альтернатива</Table.Th>
                <Table.Th>Очікуване значення</Table.Th>
                <Table.Th>Інтерпретація</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rankedAlternatives.map((alternative, index) => (
                <Table.Tr key={alternative.id}>
                  <Table.Td>{index + 1}</Table.Td>
                  <Table.Td fw={alternative.id === bestAlternative.id ? 700 : 400}>
                    {alternative.label}
                  </Table.Td>
                  <Table.Td fw={alternative.id === bestAlternative.id ? 700 : 400}>
                    {formatNumber(alternative.expectedValue)}
                  </Table.Td>
                  <Table.Td>
                    {alternative.id === bestAlternative.id
                      ? 'Найбільша очікувана цінність'
                      : 'Поступається за очікуваною цінністю'}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          <Divider />
          <Text>
            Оптимальна стратегія — <b>{bestAlternative.label}</b>. Вона дає очікувану цінність{' '}
            <b>{formatNumber(bestAlternative.expectedValue)}</b> бала і краще контролює ризики
            релізу, ніж запуск одразу на всю аудиторію.
          </Text>
        </Stack>
      </Paper>
    </Stack>
  );
}
