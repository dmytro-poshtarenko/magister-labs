import { type ReactElement } from 'react';
import { Badge, Divider, Group, List, Paper, Stack, Table, Text, Title } from '@mantine/core';

type GroupCriterion = {
  id: string;
  label: string;
  weight: number;
};

type LeafCriterion = {
  id: string;
  parentId: string;
  label: string;
  localWeight: number;
};

type Alternative = {
  id: string;
  label: string;
  description: string;
  localWeights: Record<string, number>;
};

const title =
  "САОПІ ЛР 4. Використання методу аналізу ієрархій для вирішення багаторівневих задач системного аналізу об'єктів програмної інженерії";

const groupCriteria: GroupCriterion[] = [
  { id: 'product', label: 'Продуктова цінність', weight: 0.45 },
  { id: 'engineering', label: 'Інженерна стійкість', weight: 0.55 },
];

const leafCriteria: LeafCriterion[] = [
  { id: 'mvp', parentId: 'product', label: 'Швидкість запуску MVP', localWeight: 0.55 },
  { id: 'flexibility', parentId: 'product', label: 'Бізнес-гнучкість', localWeight: 0.45 },
  { id: 'maintainability', parentId: 'engineering', label: 'Підтримуваність', localWeight: 0.4 },
  { id: 'scalability', parentId: 'engineering', label: 'Масштабованість', localWeight: 0.35 },
  { id: 'risk', parentId: 'engineering', label: 'Операційний ризик', localWeight: 0.25 },
];

const alternatives: Alternative[] = [
  {
    id: 'a1',
    label: 'A1: модульний моноліт',
    description: 'Один застосунок із чітким поділом на модулі та спільною інфраструктурою.',
    localWeights: {
      mvp: 0.55,
      flexibility: 0.4,
      maintainability: 0.35,
      scalability: 0.2,
      risk: 0.45,
    },
  },
  {
    id: 'a2',
    label: 'A2: мікросервісна архітектура',
    description: 'Набір незалежних сервісів із власними межами відповідальності.',
    localWeights: {
      mvp: 0.2,
      flexibility: 0.4,
      maintainability: 0.45,
      scalability: 0.5,
      risk: 0.2464,
    },
  },
  {
    id: 'a3',
    label: 'A3: безсерверний підхід (FaaS)',
    description: 'Реалізація бізнес-можливостей через керовані хмарні функції.',
    localWeights: {
      mvp: 0.25,
      flexibility: 0.2,
      maintainability: 0.2,
      scalability: 0.3,
      risk: 0.3036,
    },
  },
];

function parentWeight(parentId: string): number {
  return groupCriteria.find((criterion) => criterion.id === parentId)?.weight ?? 0;
}

function globalWeight(criterion: LeafCriterion): number {
  return parentWeight(criterion.parentId) * criterion.localWeight;
}

function combinedWeight(alternative: Alternative): number {
  return leafCriteria.reduce((sum, criterion) => {
    const localAlternativeWeight = alternative.localWeights[criterion.id] ?? 0;
    return sum + globalWeight(criterion) * localAlternativeWeight;
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

export default function SaopiLab4(): ReactElement {
  const chartWidth = 760;
  const chartHeight = 260;
  const leftPadding = 240;
  const rightPadding = 40;
  const topPadding = 32;
  const rowHeight = 58;
  const maxScore = Math.max(...rankedAlternatives.map((alternative) => alternative.score));
  const barWidth = (score: number) =>
    ((chartWidth - leftPadding - rightPadding) * score) / Math.max(maxScore, 0.01);

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Title order={3}>{title}</Title>
          <Text c="dimmed">
            Приклад із програмної інженерії: вибір архітектури для нового SaaS-сервісу з двома
            критеріальними рівнями.
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
            Багаторівневий метод аналізу ієрархій подає задачу як дерево: мета, групи критеріїв,
            критерії другого рівня та альтернативи. Кожен шлях від мети до альтернативи має власний
            внесок у підсумкову оцінку.
          </Text>
          <Text>
            Комбінована вага альтернативи обчислюється як сума всіх внесків: P(Ai) = Σ(вага групи ·
            вага критерію · локальна вага альтернативи).
          </Text>
          <List type="ordered" withPadding>
            <List.Item>Визначити мету та альтернативи.</List.Item>
            <List.Item>Задати критерії першого і другого рівнів.</List.Item>
            <List.Item>Обчислити глобальні ваги листових критеріїв.</List.Item>
            <List.Item>Оцінити альтернативи за кожним листовим критерієм.</List.Item>
            <List.Item>Порахувати комбіновані ваги та ранжувати альтернативи.</List.Item>
          </List>
        </Stack>
      </Paper>

      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Title order={4}>Постановка задачі</Title>
          <Text>
            Команда створює новий SaaS-сервіс і має обрати архітектурний підхід, який одночасно
            забезпечить продуктову цінність і достатню інженерну стійкість.
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
          <Title order={4}>Багаторівнева ієрархія</Title>
          <Text c="dimmed">
            Схема показує структуру методу: критерії першого рівня групують критерії другого рівня,
            за якими оцінюються альтернативи.
          </Text>
          <div style={{ overflowX: 'auto' }}>
            <svg
              width={900}
              height={430}
              style={{ border: '1px solid var(--mantine-color-gray-4)' }}
            >
              <rect x={0} y={0} width={900} height={430} fill="#ffffff" />

              <rect x={280} y={20} width={340} height={54} rx={8} fill="#e7f5ff" stroke="#1c7ed6" />
              <text x={450} y={43} textAnchor="middle" fontSize={14} fontWeight={600}>
                Мета
              </text>
              <text x={450} y={62} textAnchor="middle" fontSize={12}>
                обрати архітектуру SaaS-сервісу
              </text>

              {groupCriteria.map((criterion, index) => {
                const x = index === 0 ? 180 : 540;
                return (
                  <g key={criterion.id}>
                    <line x1={450} y1={74} x2={x + 90} y2={120} stroke="#868e96" />
                    <rect
                      x={x}
                      y={120}
                      width={180}
                      height={58}
                      rx={8}
                      fill="#fff4e6"
                      stroke="#f08c00"
                    />
                    <text x={x + 90} y={145} textAnchor="middle" fontSize={12} fontWeight={600}>
                      {criterion.label}
                    </text>
                    <text x={x + 90} y={164} textAnchor="middle" fontSize={11}>
                      вага = {formatNumber(criterion.weight, 2)}
                    </text>
                  </g>
                );
              })}

              {leafCriteria.map((criterion, index) => {
                const x = 30 + index * 170;
                const groupX = criterion.parentId === 'product' ? 270 : 630;
                return (
                  <g key={criterion.id}>
                    <line x1={groupX} y1={178} x2={x + 75} y2={224} stroke="#868e96" />
                    <rect
                      x={x}
                      y={224}
                      width={150}
                      height={62}
                      rx={8}
                      fill="#f8f9fa"
                      stroke="#495057"
                    />
                    <text x={x + 75} y={247} textAnchor="middle" fontSize={11} fontWeight={600}>
                      {criterion.label}
                    </text>
                    <text x={x + 75} y={265} textAnchor="middle" fontSize={10}>
                      лок. вага = {formatNumber(criterion.localWeight, 2)}
                    </text>
                    <text x={x + 75} y={280} textAnchor="middle" fontSize={10}>
                      глоб. вага = {formatNumber(globalWeight(criterion), 4)}
                    </text>
                  </g>
                );
              })}

              {alternatives.map((alternative, index) => {
                const x = 150 + index * 250;
                return (
                  <g key={alternative.id}>
                    {leafCriteria.map((criterion, criterionIndex) => (
                      <line
                        key={`${alternative.id}-${criterion.id}`}
                        x1={105 + criterionIndex * 170}
                        y1={286}
                        x2={x + 90}
                        y2={340}
                        stroke="#ced4da"
                      />
                    ))}
                    <rect
                      x={x}
                      y={340}
                      width={180}
                      height={58}
                      rx={8}
                      fill="#ebfbee"
                      stroke="#2f9e44"
                    />
                    <text x={x + 90} y={363} textAnchor="middle" fontSize={12} fontWeight={600}>
                      {alternative.label.split(':')[0]}
                    </text>
                    <text x={x + 90} y={382} textAnchor="middle" fontSize={11}>
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
                <Table.Th>Рівень</Table.Th>
                <Table.Th>Критерій</Table.Th>
                <Table.Th>Локальна вага</Table.Th>
                <Table.Th>Глобальна вага</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {groupCriteria.map((criterion) => (
                <Table.Tr key={criterion.id}>
                  <Table.Td>1</Table.Td>
                  <Table.Td>{criterion.label}</Table.Td>
                  <Table.Td>{formatNumber(criterion.weight, 2)}</Table.Td>
                  <Table.Td>{formatNumber(criterion.weight, 2)}</Table.Td>
                </Table.Tr>
              ))}
              {leafCriteria.map((criterion) => (
                <Table.Tr key={criterion.id}>
                  <Table.Td>2</Table.Td>
                  <Table.Td>{criterion.label}</Table.Td>
                  <Table.Td>{formatNumber(criterion.localWeight, 2)}</Table.Td>
                  <Table.Td>{formatNumber(globalWeight(criterion), 4)}</Table.Td>
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
                {leafCriteria.map((criterion) => (
                  <Table.Th key={criterion.id}>{criterion.label}</Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {alternatives.map((alternative) => (
                <Table.Tr key={alternative.id}>
                  <Table.Td>{alternative.label}</Table.Td>
                  {leafCriteria.map((criterion) => (
                    <Table.Td key={criterion.id}>
                      {formatNumber(alternative.localWeights[criterion.id] ?? 0, 4)}
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
            Стовпчики показують комбіновану вагу альтернативи з урахуванням усіх шляхів ієрархії.
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
            За побудованою багаторівневою ієрархією найкращим рішенням є{' '}
            <b>{bestAlternative.label}</b>. Він найкраще балансує продуктову цінність і інженерну
            стійкість на старті нового SaaS-сервісу.
          </Text>
        </Stack>
      </Paper>
    </Stack>
  );
}
