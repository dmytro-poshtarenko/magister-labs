import { type ReactElement } from 'react';
import { Badge, Divider, Group, List, Paper, Stack, Table, Text, Title } from '@mantine/core';

type Point = {
  x: number;
  y: number;
};

type Constraint = {
  id: string;
  label: string;
  formula: string;
  a: number;
  b: number;
  c: number;
  color: string;
};

type ResourceRow = {
  resource: string;
  feature: number;
  quality: number;
  limit: number;
};

type Vertex = Point & {
  name: string;
  description: string;
};

const objective = {
  featureValue: 35,
  qualityValue: 45,
};

const resourceRows: ResourceRow[] = [
  { resource: 'Ресурс розробки, людино-дні', feature: 4, quality: 2, limit: 40 },
  { resource: 'Ресурс рев’ю та тестування, людино-дні', feature: 2, quality: 5, limit: 50 },
  { resource: 'Максимальна кількість модулів функціональності', feature: 1, quality: 0, limit: 8 },
  { resource: 'Максимальна кількість модулів якості', feature: 0, quality: 1, limit: 8 },
];

const constraints: Constraint[] = [
  {
    id: 'development',
    label: 'Ресурс розробки',
    formula: '4x1 + 2x2 <= 40',
    a: 4,
    b: 2,
    c: 40,
    color: '#1c7ed6',
  },
  {
    id: 'reviewTesting',
    label: 'Ресурс рев’ю та тестування',
    formula: '2x1 + 5x2 <= 50',
    a: 2,
    b: 5,
    c: 50,
    color: '#d6336c',
  },
  {
    id: 'featureCap',
    label: 'Обмеження модулів функціональності',
    formula: 'x1 <= 8',
    a: 1,
    b: 0,
    c: 8,
    color: '#f08c00',
  },
  {
    id: 'qualityCap',
    label: 'Обмеження модулів якості',
    formula: 'x2 <= 8',
    a: 0,
    b: 1,
    c: 8,
    color: '#7048e8',
  },
];

const vertices: Vertex[] = [
  { name: 'A', x: 0, y: 0, description: 'Початок координат' },
  { name: 'B', x: 8, y: 0, description: 'Обмеження модулів функціональності на осі x1' },
  {
    name: 'C',
    x: 8,
    y: 4,
    description: 'Перетин обмеження модулів функціональності та ресурсу розробки',
  },
  {
    name: 'D',
    x: 6.25,
    y: 7.5,
    description: 'Перетин ресурсу розробки та ресурсу рев’ю/тестування',
  },
  {
    name: 'E',
    x: 5,
    y: 8,
    description: 'Перетин ресурсу рев’ю/тестування та обмеження модулів якості',
  },
  { name: 'F', x: 0, y: 8, description: 'Обмеження модулів якості на осі x2' },
];

const bestVertex = vertices[3]!;
const bestValue = objective.featureValue * bestVertex.x + objective.qualityValue * bestVertex.y;

function valueAt(point: Point): number {
  return objective.featureValue * point.x + objective.qualityValue * point.y;
}

function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '-';
  const fixed = value.toFixed(digits);
  return fixed.replace(/\.?0+$/, '');
}

function dedupePoints(points: Point[]): Point[] {
  const result: Point[] = [];
  for (const point of points) {
    const exists = result.some(
      (item) => Math.abs(item.x - point.x) < 1e-9 && Math.abs(item.y - point.y) < 1e-9,
    );
    if (!exists) result.push(point);
  }
  return result;
}

function getLineSegment(constraint: Constraint, maxX: number, maxY: number): [Point, Point] | null {
  const candidates: Point[] = [];

  if (constraint.b !== 0) {
    candidates.push({ x: 0, y: constraint.c / constraint.b });
    candidates.push({ x: maxX, y: (constraint.c - constraint.a * maxX) / constraint.b });
  }

  if (constraint.a !== 0) {
    candidates.push({ x: constraint.c / constraint.a, y: 0 });
    candidates.push({ x: (constraint.c - constraint.b * maxY) / constraint.a, y: maxY });
  }

  const visible = dedupePoints(
    candidates.filter(
      (point) =>
        Number.isFinite(point.x) &&
        Number.isFinite(point.y) &&
        point.x >= -1e-9 &&
        point.x <= maxX + 1e-9 &&
        point.y >= -1e-9 &&
        point.y <= maxY + 1e-9,
    ),
  );

  const first = visible[0];
  const second = visible[1];
  if (!first || !second) return null;
  return [first, second];
}

export default function SaopiLab2(): ReactElement {
  const width = 760;
  const height = 500;
  const padding = 58;
  const maxX = 11;
  const maxY = 11;
  const scaleX = (x: number) => padding + (x / maxX) * (width - 2 * padding);
  const scaleY = (y: number) => height - padding - (y / maxY) * (height - 2 * padding);
  const polygonPoints = vertices.map((point) => `${scaleX(point.x)},${scaleY(point.y)}`).join(' ');
  const objectiveSegment = getLineSegment(
    {
      id: 'objective',
      label: 'Цільова функція в оптимумі',
      formula: '35x1 + 45x2 = 556.25',
      a: objective.featureValue,
      b: objective.qualityValue,
      c: bestValue,
      color: '#212529',
    },
    maxX,
    maxY,
  );

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Title order={3}>
            САОПІ ЛР 2. Застосування табличного методу для формалізації задач системного аналізу
          </Title>
          <Text c="dimmed">
            Статичний приклад із програмної інженерії: розподіл ресурсу спринту між двома типами
            робіт.
          </Text>
        </Stack>
        <Badge size="lg" variant="light">
          Макс. Z = {formatNumber(bestValue)}
        </Badge>
      </Group>

      <Paper p="md" withBorder>
        <Stack gap="xs">
          <Title order={4}>Коротко про метод</Title>
          <Text>
            Табличний метод перетворює задачу системного аналізу, описану природною мовою, на
            математичну модель. Графічний метод розв’язує модель лінійного програмування з двома
            змінними через побудову обмежень, пошук області допустимих розв’язків і перевірку
            цільової функції у її вершинах.
          </Text>
          <List type="ordered" withPadding>
            <List.Item>Побудувати граничні прямі, замінивши нерівності рівностями.</List.Item>
            <List.Item>Вибрати півплощину, яка задовольняє кожне обмеження.</List.Item>
            <List.Item>Знайти допустимий багатокутник як перетин усіх півплощин.</List.Item>
            <List.Item>
              Переміщувати пряму цільової функції в напрямку зростання, доки вона не торкнеться
              останньої допустимої вершини.
            </List.Item>
          </List>
        </Stack>
      </Paper>

      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Title order={4}>Постановка задачі</Title>
          <Text>
            Нехай x1 — кількість модулів автоматизації функціональності, а x2 — кількість модулів
            автоматизації якості, запланованих на спринт. Команда прагне максимізувати цінність
            спринту з урахуванням обмежень на розробку, рев’ю, тестування та планування.
          </Text>

          <Table striped withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Ресурс або обмеження</Table.Th>
                <Table.Th>Витрати x1</Table.Th>
                <Table.Th>Витрати x2</Table.Th>
                <Table.Th>Доступний ліміт</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {resourceRows.map((row) => (
                <Table.Tr key={row.resource}>
                  <Table.Td>{row.resource}</Table.Td>
                  <Table.Td>{row.feature}</Table.Td>
                  <Table.Td>{row.quality}</Table.Td>
                  <Table.Td>{row.limit}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      </Paper>

      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Title order={4}>Математична модель</Title>
          <Text fw={600}>max Z = 35x1 + 45x2</Text>
          <Table withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Обмеження</Table.Th>
                <Table.Th>Формула</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {constraints.map((constraint) => (
                <Table.Tr key={constraint.id}>
                  <Table.Td>{constraint.label}</Table.Td>
                  <Table.Td>{constraint.formula}</Table.Td>
                </Table.Tr>
              ))}
              <Table.Tr>
                <Table.Td>Невід’ємність</Table.Td>
                <Table.Td>x1 &gt;= 0, x2 &gt;= 0</Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Stack>
      </Paper>

      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Title order={4}>Графічний результат</Title>
          <Text c="dimmed">
            Зелений багатокутник є областю допустимих розв’язків. Пунктирна лінія — це цільова
            функція в оптимальному значенні. Стрілка N = (35, 45) показує напрям зростання цільової
            функції.
          </Text>

          <div style={{ overflowX: 'auto' }}>
            <svg
              width={width}
              height={height}
              style={{ border: '1px solid var(--mantine-color-gray-4)' }}
            >
              <defs>
                <marker
                  id="arrowHead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L0,6 L8,3 z" fill="#212529" />
                </marker>
              </defs>

              <rect x={0} y={0} width={width} height={height} fill="#ffffff" />

              {Array.from({ length: 12 }).map((_, index) => (
                <g key={`grid-${index}`}>
                  <line
                    x1={scaleX(index)}
                    y1={scaleY(0)}
                    x2={scaleX(index)}
                    y2={scaleY(maxY)}
                    stroke="#edf2f7"
                  />
                  <line
                    x1={scaleX(0)}
                    y1={scaleY(index)}
                    x2={scaleX(maxX)}
                    y2={scaleY(index)}
                    stroke="#edf2f7"
                  />
                </g>
              ))}

              <line
                x1={scaleX(0)}
                y1={scaleY(0)}
                x2={scaleX(maxX)}
                y2={scaleY(0)}
                stroke="#000"
                strokeWidth={2}
              />
              <line
                x1={scaleX(0)}
                y1={scaleY(0)}
                x2={scaleX(0)}
                y2={scaleY(maxY)}
                stroke="#000"
                strokeWidth={2}
              />

              {Array.from({ length: 12 }).map((_, index) => (
                <g key={`tick-${index}`}>
                  <line
                    x1={scaleX(index)}
                    y1={scaleY(0) - 4}
                    x2={scaleX(index)}
                    y2={scaleY(0) + 4}
                    stroke="#000"
                  />
                  <text x={scaleX(index)} y={scaleY(0) + 20} fontSize={11} textAnchor="middle">
                    {index}
                  </text>
                  <line
                    x1={scaleX(0) - 4}
                    y1={scaleY(index)}
                    x2={scaleX(0) + 4}
                    y2={scaleY(index)}
                    stroke="#000"
                  />
                  <text x={scaleX(0) - 10} y={scaleY(index) + 4} fontSize={11} textAnchor="end">
                    {index}
                  </text>
                </g>
              ))}

              <text x={scaleX(maxX) - 10} y={scaleY(0) - 10} fontSize={13} textAnchor="end">
                x1
              </text>
              <text x={scaleX(0) + 12} y={scaleY(maxY) + 16} fontSize={13}>
                x2
              </text>

              <polygon
                points={polygonPoints}
                fill="rgba(64, 192, 87, 0.18)"
                stroke="#2f9e44"
                strokeWidth={2}
              />

              {constraints.map((constraint) => {
                const segment = getLineSegment(constraint, maxX, maxY);
                if (!segment) return null;
                const [start, end] = segment;
                return (
                  <g key={constraint.id}>
                    <line
                      x1={scaleX(start.x)}
                      y1={scaleY(start.y)}
                      x2={scaleX(end.x)}
                      y2={scaleY(end.y)}
                      stroke={constraint.color}
                      strokeWidth={2}
                    />
                  </g>
                );
              })}

              {objectiveSegment && (
                <line
                  x1={scaleX(objectiveSegment[0].x)}
                  y1={scaleY(objectiveSegment[0].y)}
                  x2={scaleX(objectiveSegment[1].x)}
                  y2={scaleY(objectiveSegment[1].y)}
                  stroke="#212529"
                  strokeWidth={2}
                  strokeDasharray="8 5"
                />
              )}

              <line
                x1={scaleX(0.8)}
                y1={scaleY(0.8)}
                x2={scaleX(2.4)}
                y2={scaleY(2.85)}
                stroke="#212529"
                strokeWidth={2}
                markerEnd="url(#arrowHead)"
              />
              <text x={scaleX(2.5)} y={scaleY(2.9)} fontSize={12} fill="#212529">
                N = (35, 45)
              </text>

              {vertices.map((vertex) => (
                <g key={vertex.name}>
                  <circle
                    cx={scaleX(vertex.x)}
                    cy={scaleY(vertex.y)}
                    r={vertex.name === bestVertex.name ? 6 : 4}
                    fill={vertex.name === bestVertex.name ? '#2b8a3e' : '#495057'}
                  />
                  <text
                    x={scaleX(vertex.x) + 8}
                    y={scaleY(vertex.y) - 8}
                    fontSize={12}
                    fill={vertex.name === bestVertex.name ? '#2b8a3e' : '#495057'}
                  >
                    {vertex.name}
                  </text>
                </g>
              ))}

              <text
                x={scaleX(bestVertex.x) + 10}
                y={scaleY(bestVertex.y) + 18}
                fontSize={12}
                fill="#2b8a3e"
              >
                оптимум ({formatNumber(bestVertex.x)}; {formatNumber(bestVertex.y)})
              </text>
            </svg>
          </div>

          <Group gap="xs">
            {constraints.map((constraint) => (
              <Badge key={constraint.id} color="gray" variant="light">
                {constraint.formula}
              </Badge>
            ))}
            <Badge color="green" variant="light">
              оптимум D
            </Badge>
          </Group>
        </Stack>
      </Paper>

      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Title order={4}>Перевірка вершин</Title>
          <Table striped withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Вершина</Table.Th>
                <Table.Th>x1</Table.Th>
                <Table.Th>x2</Table.Th>
                <Table.Th>Z = 35x1 + 45x2</Table.Th>
                <Table.Th>Зміст</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {vertices.map((vertex) => (
                <Table.Tr key={vertex.name}>
                  <Table.Td fw={vertex.name === bestVertex.name ? 700 : 400}>
                    {vertex.name}
                  </Table.Td>
                  <Table.Td>{formatNumber(vertex.x)}</Table.Td>
                  <Table.Td>{formatNumber(vertex.y)}</Table.Td>
                  <Table.Td fw={vertex.name === bestVertex.name ? 700 : 400}>
                    {formatNumber(valueAt(vertex))}
                  </Table.Td>
                  <Table.Td>{vertex.description}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          <Divider />
          <Text>
            Оптимальний статичний план: x1 = {formatNumber(bestVertex.x)} та x2 ={' '}
            {formatNumber(bestVertex.y)}, що дає Z = {formatNumber(bestValue)}. У реальному спринті
            цей дробовий результат потрібно округлити та повторно перевірити за тими самими
            обмеженнями.
          </Text>
        </Stack>
      </Paper>
    </Stack>
  );
}
