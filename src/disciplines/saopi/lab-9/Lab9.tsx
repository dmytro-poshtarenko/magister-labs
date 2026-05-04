import { type ReactElement } from 'react';
import { Badge, Divider, Group, List, Paper, Stack, Table, Text, Title } from '@mantine/core';

type PriorityParameter = {
  id: 'I' | 'C' | 'P' | 'N';
  label: string;
  description: string;
  x: number;
  y: number;
};

type ExpertScore = {
  expert: string;
  scores: Record<PriorityParameter['id'], number>;
};

type RankedParameter = PriorityParameter & {
  weight: number;
};

const title =
  "САОПІ ЛР 9. Визначення впливовості ознак об'єкта програмної інженерії за методом розстановки пріоритетів";

const parameters: PriorityParameter[] = [
  {
    id: 'I',
    label: 'Складність інтеграції',
    description: 'Технічна складність зв’язку між сервісами',
    x: 170,
    y: 190,
  },
  {
    id: 'C',
    label: 'Вартість супроводу',
    description: 'Витрати реалізації, підтримки та змін',
    x: 420,
    y: 85,
  },
  {
    id: 'P',
    label: 'Продуктивність',
    description: 'Вплив інтеграції на затримки та пропускну здатність',
    x: 670,
    y: 190,
  },
  {
    id: 'N',
    label: 'Надійність',
    description: 'Операційний ризик і стійкість інтеграції',
    x: 420,
    y: 330,
  },
];

const expertScores: ExpertScore[] = [
  { expert: 'Експерт 1', scores: { I: 0.1, C: 0.35, P: 0.2, N: 0.35 } },
  { expert: 'Експерт 2', scores: { I: 0.35, C: 0.25, P: 0.25, N: 0.15 } },
  { expert: 'Експерт 3', scores: { I: 0.35, C: 0.2, P: 0.3, N: 0.15 } },
  { expert: 'Експерт 4', scores: { I: 0.2, C: 0.3, P: 0.3, N: 0.2 } },
];

const parameterIds = parameters.map((parameter) => parameter.id);

function formatNumber(value: number, digits = 3): string {
  return value.toFixed(digits).replace(/\.?0+$/, '');
}

function preferenceValue(
  rowId: PriorityParameter['id'],
  columnId: PriorityParameter['id'],
  scores: ExpertScore['scores'],
): number {
  if (scores[rowId] > scores[columnId]) return 2;
  if (scores[rowId] < scores[columnId]) return 0;
  return 1;
}

function buildAggregateMatrix(): number[][] {
  return parameterIds.map((rowId) =>
    parameterIds.map((columnId) => {
      const total = expertScores.reduce(
        (sum, expert) => sum + preferenceValue(rowId, columnId, expert.scores),
        0,
      );
      return total / expertScores.length;
    }),
  );
}

function normalize(values: number[]): number[] {
  const total = values.reduce((sum, value) => sum + value, 0);
  return values.map((value) => value / total);
}

function multiplyMatrixVector(matrix: number[][], vector: number[]): number[] {
  return matrix.map((row) => row.reduce((sum, value, index) => sum + value * vector[index]!, 0));
}

function calculateIterations(matrix: number[][], count: number): number[][] {
  const rowSums = matrix.map((row) => row.reduce((sum, value) => sum + value, 0));
  const iterations = [normalize(rowSums)];

  for (let index = 1; index < count; index += 1) {
    iterations.push(normalize(multiplyMatrixVector(matrix, iterations[index - 1]!)));
  }

  return iterations;
}

const aggregateMatrix = buildAggregateMatrix();
const rowSums = aggregateMatrix.map((row) => row.reduce((sum, value) => sum + value, 0));
const columnSums = parameterIds.map((_, columnIndex) =>
  aggregateMatrix.reduce((sum, row) => sum + row[columnIndex]!, 0),
);
const iterations = calculateIterations(aggregateMatrix, 5);
const finalWeights = iterations[iterations.length - 1]!;
const rankedParameters: RankedParameter[] = parameters
  .map((parameter, index) => ({ ...parameter, weight: finalWeights[index]! }))
  .sort((left, right) => right.weight - left.weight);
const bestParameter = rankedParameters[0]!;

function matrixValue(rowIndex: number, columnIndex: number): number {
  return aggregateMatrix[rowIndex]?.[columnIndex] ?? 0;
}

function rowSum(index: number): number {
  return rowSums[index] ?? 0;
}

function columnSum(index: number): number {
  return columnSums[index] ?? 0;
}

function getParameter(id: PriorityParameter['id']): PriorityParameter {
  const parameter = parameters.find((item) => item.id === id);
  if (!parameter) throw new Error(`Unknown parameter ${id}`);
  return parameter;
}

export default function SaopiLab9(): ReactElement {
  const graphWidth = 840;
  const graphHeight = 420;

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Title order={3}>{title}</Title>
          <Text c="dimmed">
            Варіант №8. Приклад із програмної інженерії: визначення ваг параметрів інтеграційної
            моделі SaaS-компонентів на основі експертних переваг.
          </Text>
        </Stack>
        <Badge size="lg" variant="light" color="green">
          Найвищий пріоритет: {bestParameter.id}
        </Badge>
      </Group>

      <Paper p="md" withBorder>
        <Stack gap="xs">
          <Title order={4}>Коротко про метод</Title>
          <Text>
            Метод розстановки пріоритетів подає експертні переваги як матрицю суміжності. Якщо
            параметр у рядку важливіший за параметр у стовпці, елемент матриці дорівнює 2; якщо вони
            рівні — 1; якщо менш важливий — 0.
          </Text>
          <Text>
            Далі обчислюється ітерована сила параметрів: P(k)=A*P(k-1). Після кожної ітерації вектор
            нормується до суми 1, а стабілізовані значення використовуються як вагові коефіцієнти.
          </Text>
          <List type="ordered" withPadding>
            <List.Item>Задати параметри та експертні оцінки.</List.Item>
            <List.Item>Побудувати матриці парних переваг для кожного експерта.</List.Item>
            <List.Item>Агрегувати експертні матриці в одну матрицю суміжності.</List.Item>
            <List.Item>Виконати ітераційний розрахунок нормованої сили параметрів.</List.Item>
            <List.Item>Отримати ваги та ранжування параметрів.</List.Item>
          </List>
        </Stack>
      </Paper>

      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Title order={4}>Постановка задачі</Title>
          <Text>
            У ЛР5 ваги ребер графа інтеграцій описували умовну складність зв’язку між сервісами. У
            цій роботі деталізуємо, які параметри мають найбільше впливати на таку вагу під час
            вибору схеми інтеграцій SaaS-компонентів.
          </Text>
          <Table striped withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Позначення</Table.Th>
                <Table.Th>Параметр</Table.Th>
                <Table.Th>Зміст</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {parameters.map((parameter) => (
                <Table.Tr key={parameter.id}>
                  <Table.Td>{parameter.id}</Table.Td>
                  <Table.Td>{parameter.label}</Table.Td>
                  <Table.Td>{parameter.description}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      </Paper>

      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Title order={4}>Оцінки експертів для варіанта №8</Title>
          <Table striped withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Експерт</Table.Th>
                {parameterIds.map((id) => (
                  <Table.Th key={id}>{id}</Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {expertScores.map((expert) => (
                <Table.Tr key={expert.expert}>
                  <Table.Td>{expert.expert}</Table.Td>
                  {parameterIds.map((id) => (
                    <Table.Td key={id}>{formatNumber(expert.scores[id], 2)}</Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      </Paper>

      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Title order={4}>Агрегована матриця суміжності</Title>
          <Text c="dimmed">
            Значення в матриці є середнім результатом парних порівнянь чотирьох експертів.
          </Text>
          <Table striped withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Параметр</Table.Th>
                {parameterIds.map((id) => (
                  <Table.Th key={id}>{id}</Table.Th>
                ))}
                <Table.Th>Сума</Table.Th>
                <Table.Th>P0(1)</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {parameters.map((parameter, rowIndex) => (
                <Table.Tr key={parameter.id}>
                  <Table.Td>{parameter.id}</Table.Td>
                  {parameterIds.map((id, columnIndex) => (
                    <Table.Td key={id}>
                      {formatNumber(matrixValue(rowIndex, columnIndex), 2)}
                    </Table.Td>
                  ))}
                  <Table.Td>{formatNumber(rowSum(rowIndex), 2)}</Table.Td>
                  <Table.Td>{formatNumber(iterations[0]?.[rowIndex] ?? 0)}</Table.Td>
                </Table.Tr>
              ))}
              <Table.Tr>
                <Table.Td fw={700}>Σ</Table.Td>
                {parameterIds.map((id, columnIndex) => (
                  <Table.Td key={id} fw={700}>
                    {formatNumber(columnSum(columnIndex), 2)}
                  </Table.Td>
                ))}
                <Table.Td fw={700}>
                  {formatNumber(
                    rowSums.reduce((sum, value) => sum + value, 0),
                    2,
                  )}
                </Table.Td>
                <Table.Td fw={700}>1</Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Stack>
      </Paper>

      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Title order={4}>SVG-граф переваг</Title>
          <Text c="dimmed">
            Суцільні стрілки показують перевагу над параметром N, пунктирні лінії — майже рівні
            відносини між трьома найсильнішими параметрами.
          </Text>
          <div style={{ overflowX: 'auto' }}>
            <svg
              width={graphWidth}
              height={graphHeight}
              viewBox={`0 0 ${graphWidth} ${graphHeight}`}
              style={{ border: '1px solid var(--mantine-color-gray-4)' }}
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="#475569" />
                </marker>
              </defs>
              <rect x={0} y={0} width={graphWidth} height={graphHeight} fill="#ffffff" />

              <line
                x1={getParameter('C').x}
                y1={getParameter('C').y + 32}
                x2={getParameter('N').x}
                y2={getParameter('N').y - 48}
                stroke="#475569"
                strokeWidth={2}
                markerEnd="url(#arrowhead)"
              />
              <text x={438} y={205} fontSize={12}>
                1.75
              </text>

              <line
                x1={getParameter('P').x - 64}
                y1={getParameter('P').y + 28}
                x2={getParameter('N').x + 70}
                y2={getParameter('N').y - 26}
                stroke="#475569"
                strokeWidth={2}
                markerEnd="url(#arrowhead)"
              />
              <text x={572} y={282} fontSize={12}>
                1.50
              </text>

              <line
                x1={getParameter('I').x + 64}
                y1={getParameter('I').y + 28}
                x2={getParameter('N').x - 70}
                y2={getParameter('N').y - 26}
                stroke="#475569"
                strokeWidth={2}
                markerEnd="url(#arrowhead)"
              />
              <text x={260} y={282} fontSize={12}>
                1.25
              </text>

              <line
                x1={getParameter('I').x + 78}
                y1={getParameter('I').y - 22}
                x2={getParameter('C').x - 86}
                y2={getParameter('C').y + 20}
                stroke="#94a3b8"
                strokeDasharray="6 5"
              />
              <line
                x1={getParameter('C').x + 86}
                y1={getParameter('C').y + 20}
                x2={getParameter('P').x - 78}
                y2={getParameter('P').y - 22}
                stroke="#94a3b8"
                strokeDasharray="6 5"
              />
              <line
                x1={getParameter('I').x + 92}
                y1={getParameter('I').y}
                x2={getParameter('P').x - 92}
                y2={getParameter('P').y}
                stroke="#94a3b8"
                strokeDasharray="6 5"
              />

              {parameters.map((parameter) => {
                const ranked = rankedParameters.find((item) => item.id === parameter.id)!;
                const isBest = parameter.id === bestParameter.id;
                return (
                  <g key={parameter.id}>
                    <rect
                      x={parameter.x - 86}
                      y={parameter.y - 36}
                      width={172}
                      height={72}
                      rx={10}
                      fill={isBest ? '#dcfce7' : '#f8fafc'}
                      stroke={isBest ? '#16a34a' : '#64748b'}
                      strokeWidth={isBest ? 3 : 1.5}
                    />
                    <text
                      x={parameter.x}
                      y={parameter.y - 10}
                      textAnchor="middle"
                      fontSize={14}
                      fontWeight={700}
                    >
                      {parameter.id}: {parameter.label}
                    </text>
                    <text x={parameter.x} y={parameter.y + 10} textAnchor="middle" fontSize={12}>
                      вага = {formatNumber(ranked.weight)}
                    </text>
                    <text x={parameter.x} y={parameter.y + 27} textAnchor="middle" fontSize={11}>
                      місце {rankedParameters.findIndex((item) => item.id === parameter.id) + 1}
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
          <Title order={4}>Ітерації нормованої сили</Title>
          <Table striped withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Ітерація</Table.Th>
                {parameterIds.map((id) => (
                  <Table.Th key={id}>{id}</Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {iterations.map((iteration, index) => (
                <Table.Tr key={index}>
                  <Table.Td>P0({index + 1})</Table.Td>
                  {iteration.map((value, valueIndex) => (
                    <Table.Td key={parameterIds[valueIndex]}>{formatNumber(value)}</Table.Td>
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
          <Table striped withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Місце</Table.Th>
                <Table.Th>Параметр</Table.Th>
                <Table.Th>Вага</Table.Th>
                <Table.Th>Інтерпретація</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rankedParameters.map((parameter, index) => (
                <Table.Tr key={parameter.id}>
                  <Table.Td>{index + 1}</Table.Td>
                  <Table.Td fw={parameter.id === bestParameter.id ? 700 : 400}>
                    {parameter.id}: {parameter.label}
                  </Table.Td>
                  <Table.Td fw={parameter.id === bestParameter.id ? 700 : 400}>
                    {formatNumber(parameter.weight)}
                  </Table.Td>
                  <Table.Td>
                    {parameter.id === bestParameter.id
                      ? 'Найбільша узгоджена впливовість за оцінками експертів'
                      : 'Враховується в інтегральній вазі інтеграції'}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          <Divider />
          <Text>
            Порівняно з ЛР5, де ребро графа мало одну умовну вагу, ЛР9 показує структуру цієї ваги:
            найсильніше потрібно враховувати <b>{bestParameter.label.toLowerCase()}</b>, а також
            продуктивність і складність інтеграції.
          </Text>
        </Stack>
      </Paper>
    </Stack>
  );
}
