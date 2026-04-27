import { type ReactElement } from 'react';
import { Badge, Divider, Group, List, Paper, Stack, Table, Text, Title } from '@mantine/core';

type Criterion = {
  id: string;
  label: string;
  weight: number;
};

type Alternative = {
  id: string;
  label: string;
  description: string;
  localWeights: Record<string, number>;
};

const criteria: Criterion[] = [
  { id: 'mvp', label: 'Швидкість запуску MVP', weight: 0.3 },
  { id: 'maintainability', label: 'Підтримуваність і розвиток', weight: 0.25 },
  { id: 'scalability', label: 'Масштабованість', weight: 0.25 },
  { id: 'cost', label: 'Вартість володіння', weight: 0.2 },
];

const alternatives: Alternative[] = [
  {
    id: 'a1',
    label: 'A1: модульний моноліт',
    description: 'Один застосунок із чітким поділом на модулі.',
    localWeights: {
      mvp: 0.55,
      maintainability: 0.35,
      scalability: 0.2,
      cost: 0.45,
    },
  },
  {
    id: 'a2',
    label: 'A2: мікросервісна архітектура',
    description: 'Набір незалежних сервісів із власними межами відповідальності.',
    localWeights: {
      mvp: 0.2,
      maintainability: 0.45,
      scalability: 0.5,
      cost: 0.2,
    },
  },
  {
    id: 'a3',
    label: 'A3: безсерверний підхід (FaaS)',
    description: 'Реалізація функціональності через керовані хмарні функції.',
    localWeights: {
      mvp: 0.25,
      maintainability: 0.2,
      scalability: 0.3,
      cost: 0.35,
    },
  },
];

function combinedWeight(alternative: Alternative): number {
  return criteria.reduce((sum, criterion) => {
    const localWeight = alternative.localWeights[criterion.id] ?? 0;
    return sum + criterion.weight * localWeight;
  }, 0);
}

function formatNumber(value: number, digits = 4): string {
  return value.toFixed(digits).replace(/\.?0+$/, '');
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

const rankedAlternatives = alternatives
  .map((alternative) => ({
    ...alternative,
    score: combinedWeight(alternative),
  }))
  .sort((left, right) => right.score - left.score);

const bestAlternative = rankedAlternatives[0]!;

export default function SaopiLab3(): ReactElement {
  const chartWidth = 720;
  const chartHeight = 260;
  const leftPadding = 220;
  const rightPadding = 36;
  const topPadding = 32;
  const rowHeight = 58;
  const maxScore = Math.max(...rankedAlternatives.map((alternative) => alternative.score));
  const barWidth = (score: number) =>
    ((chartWidth - leftPadding - rightPadding) * score) / Math.max(maxScore, 0.01);

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Title order={3}>
            САОПІ ЛР 3. Використання методу аналізу ієрархій для вирішення задач системного аналізу
          </Title>
          <Text c="dimmed">
            Приклад із програмної інженерії: вибір архітектурного підходу для нового сервісу.
          </Text>
        </Stack>
        <Badge size="lg" variant="light" color="green">
          Найкраще рішення: модульний моноліт
        </Badge>
      </Group>

      <Paper p="md" withBorder>
        <Stack gap="xs">
          <Title order={4}>Коротко про метод</Title>
          <Text>
            Метод аналізу ієрархій подає задачу вибору як структуру з мети, критеріїв та
            альтернатив. Для кожного критерію задається вага важливості, а для кожної альтернативи
            визначається локальна вага за цим критерієм.
          </Text>
          <Text>
            Комбінована вага альтернативи обчислюється як сума добутків ваг критеріїв на локальні
            ваги альтернативи: P(Ai) = Σ wj · pij. Альтернатива з найбільшою комбінованою вагою
            вважається найдоцільнішою.
          </Text>
          <List type="ordered" withPadding>
            <List.Item>Сформулювати мету вибору.</List.Item>
            <List.Item>Визначити критерії та їхні ваги.</List.Item>
            <List.Item>Оцінити альтернативи за кожним критерієм.</List.Item>
            <List.Item>Обчислити комбіновані ваги та побудувати ранжування.</List.Item>
          </List>
        </Stack>
      </Paper>

      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Title order={4}>Постановка задачі</Title>
          <Text>
            Команда розробляє новий сервіс і має обрати стартовий архітектурний підхід. Рішення
            повинно враховувати швидкість запуску MVP, довгострокову підтримуваність,
            масштабованість і вартість володіння.
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
          <Title order={4}>Ієрархічна структура</Title>
          <Text c="dimmed">
            Схема повторює логіку методички: мета розкладається на критерії, а кожна альтернатива
            оцінюється за всіма критеріями одного рівня.
          </Text>

          <div style={{ overflowX: 'auto' }}>
            <svg
              width={760}
              height={360}
              style={{ border: '1px solid var(--mantine-color-gray-4)' }}
            >
              <rect x={0} y={0} width={760} height={360} fill="#ffffff" />

              <rect x={230} y={20} width={300} height={54} rx={8} fill="#e7f5ff" stroke="#1c7ed6" />
              <text x={380} y={43} textAnchor="middle" fontSize={14} fontWeight={600}>
                Мета
              </text>
              <text x={380} y={62} textAnchor="middle" fontSize={12}>
                обрати архітектурний підхід
              </text>

              {criteria.map((criterion, index) => {
                const x = 30 + index * 185;
                return (
                  <g key={criterion.id}>
                    <line x1={380} y1={74} x2={x + 75} y2={128} stroke="#868e96" />
                    <rect
                      x={x}
                      y={128}
                      width={150}
                      height={62}
                      rx={8}
                      fill="#fff4e6"
                      stroke="#f08c00"
                    />
                    <text x={x + 75} y={151} textAnchor="middle" fontSize={12} fontWeight={600}>
                      K{index + 1}
                    </text>
                    <text x={x + 75} y={168} textAnchor="middle" fontSize={10}>
                      {criterion.label}
                    </text>
                    <text x={x + 75} y={183} textAnchor="middle" fontSize={10}>
                      w = {formatNumber(criterion.weight, 2)}
                    </text>
                  </g>
                );
              })}

              {alternatives.map((alternative, index) => {
                const x = 110 + index * 230;
                return (
                  <g key={alternative.id}>
                    {criteria.map((criterion, criterionIndex) => {
                      const criterionX = 105 + criterionIndex * 185;
                      return (
                        <line
                          key={`${alternative.id}-${criterion.id}`}
                          x1={criterionX}
                          y1={190}
                          x2={x + 80}
                          y2={250}
                          stroke="#ced4da"
                        />
                      );
                    })}
                    <rect
                      x={x}
                      y={250}
                      width={160}
                      height={56}
                      rx={8}
                      fill="#ebfbee"
                      stroke="#2f9e44"
                    />
                    <text x={x + 80} y={273} textAnchor="middle" fontSize={12} fontWeight={600}>
                      {alternative.label.split(':')[0]}
                    </text>
                    <text x={x + 80} y={292} textAnchor="middle" fontSize={11}>
                      P = {formatNumber(combinedWeight(alternative), 4)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </Stack>
      </Paper>

      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Title order={4}>Ваги критеріїв</Title>
          <Table striped withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Критерій</Table.Th>
                <Table.Th>Вага</Table.Th>
                <Table.Th>Частка</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {criteria.map((criterion) => (
                <Table.Tr key={criterion.id}>
                  <Table.Td>{criterion.label}</Table.Td>
                  <Table.Td>{formatNumber(criterion.weight, 2)}</Table.Td>
                  <Table.Td>{formatPercent(criterion.weight)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      </Paper>

      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Title order={4}>Локальні ваги альтернатив</Title>
          <Table striped withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Альтернатива</Table.Th>
                {criteria.map((criterion) => (
                  <Table.Th key={criterion.id}>{criterion.label}</Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {alternatives.map((alternative) => (
                <Table.Tr key={alternative.id}>
                  <Table.Td>{alternative.label}</Table.Td>
                  {criteria.map((criterion) => (
                    <Table.Td key={criterion.id}>
                      {formatNumber(alternative.localWeights[criterion.id] ?? 0, 2)}
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      </Paper>

      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Title order={4}>Підсумкове ранжування</Title>
          <Text c="dimmed">
            Значення показують комбіновану вагу альтернативи з урахуванням усіх критеріїв.
          </Text>

          <div style={{ overflowX: 'auto' }}>
            <svg
              width={chartWidth}
              height={chartHeight}
              style={{ border: '1px solid var(--mantine-color-gray-4)' }}
            >
              <rect x={0} y={0} width={chartWidth} height={chartHeight} fill="#ffffff" />
              {rankedAlternatives.map((alternative, index) => {
                const y = topPadding + index * rowHeight;
                const width = barWidth(alternative.score);
                const isBest = alternative.id === bestAlternative.id;
                return (
                  <g key={alternative.id}>
                    <text x={18} y={y + 25} fontSize={13} fontWeight={isBest ? 700 : 400}>
                      {index + 1}. {alternative.label}
                    </text>
                    <rect
                      x={leftPadding}
                      y={y}
                      width={width}
                      height={32}
                      rx={6}
                      fill={isBest ? '#2f9e44' : '#74c0fc'}
                    />
                    <text x={leftPadding + width + 10} y={y + 21} fontSize={13} fontWeight={600}>
                      {formatNumber(alternative.score, 4)} ({formatPercent(alternative.score)})
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <Table striped withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Місце</Table.Th>
                <Table.Th>Альтернатива</Table.Th>
                <Table.Th>Комбінована вага</Table.Th>
                <Table.Th>Висновок</Table.Th>
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
                    {formatNumber(alternative.score, 4)}
                  </Table.Td>
                  <Table.Td>
                    {alternative.id === bestAlternative.id
                      ? 'Найдоцільніший стартовий підхід'
                      : 'Поступається за сукупною оцінкою'}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          <Divider />
          <Text>
            За обраними вагами критеріїв найкращим рішенням є <b>{bestAlternative.label}</b>. Цей
            підхід має найкраще поєднання швидкості запуску MVP, контрольованої вартості та
            достатньої підтримуваності для початкового етапу нового сервісу.
          </Text>
        </Stack>
      </Paper>
    </Stack>
  );
}
