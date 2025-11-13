import { type ReactElement, useMemo, useState } from 'react';
import {
  Title,
  Text,
  Stack,
  Group,
  NumberInput,
  Button,
  Paper,
  Divider,
  Table,
  Checkbox,
  List,
} from '@mantine/core';

type Point = { x: number; y: number };

type VariantParams = {
  a: number; // витрата міді на транзистор A
  b: number; // витрата кадмію на транзистор B
  c: number; // прибуток від партії A
  d: number; // запас золота
};

type SolveResult = {
  feasibleVertices: Point[];
  bestPoint: Point | null;
  bestValue: number;
  allCandidates: Array<Point & { z: number; feasible: boolean }>;
};

const PROFIT_B = 290; // прибуток від партії B (з методички)
const STOCK_COPPER = 600;
const STOCK_CADMIUM = 870;

function intersectLines(
  A1: number,
  B1: number,
  C1: number,
  A2: number,
  B2: number,
  C2: number,
): Point | null {
  const det = A1 * B2 - A2 * B1;
  if (Math.abs(det) < 1e-12) return null;
  const x = (C1 * B2 - C2 * B1) / det;
  const y = (A1 * C2 - A2 * C1) / det;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
}

function closeEnough(a: Point, b: Point, eps = 1e-6): boolean {
  return Math.abs(a.x - b.x) <= eps && Math.abs(a.y - b.y) <= eps;
}

function dedupePoints(points: Point[], eps = 1e-6): Point[] {
  const res: Point[] = [];
  for (const p of points) {
    if (!res.some((q) => closeEnough(p, q, eps))) {
      res.push(p);
    }
  }
  return res;
}

function withinHalfspaces(p: Point, params: VariantParams): boolean {
  const { a, b, d } = params;
  // Перевірка напівпросторів (≤) і невід’ємності
  if (p.x < -1e-9 || p.y < -1e-9) return false;
  if (a * p.x + 0.2 * p.y - STOCK_COPPER > 1e-9) return false; // мідь
  if (0.2 * p.x + b * p.y - STOCK_CADMIUM > 1e-9) return false; // кадмій
  if (0.3 * p.x + 0.2 * p.y - d > 1e-9) return false; // золото
  return true;
}

function candidateIntersections(params: VariantParams): Point[] {
  const { a, b, d } = params;

  // Граничні прямі у вигляді A*x + B*y = C
  const L1 = { A: a, B: 0.2, C: STOCK_COPPER }; // мідь
  const L2 = { A: 0.2, B: b, C: STOCK_CADMIUM }; // кадмій
  const L3 = { A: 0.3, B: 0.2, C: d }; // золото

  const lines = [L1, L2, L3];
  const pts: Point[] = [];

  // Парні перетини трьох прямих
  for (let i = 0; i < lines.length; i += 1) {
    for (let j = i + 1; j < lines.length; j += 1) {
      const p = intersectLines(
        lines[i]!.A,
        lines[i]!.B,
        lines[i]!.C,
        lines[j]!.A,
        lines[j]!.B,
        lines[j]!.C,
      );
      if (p) pts.push(p);
    }
  }

  // Перетини з осями (x=0 або y=0) для кожної прямої
  for (const L of lines) {
    if (L.A !== 0) {
      const p = intersectLines(L.A, L.B, L.C, 1, 0, 0); // з x=0 (1*x + 0*y = 0)
      if (p) pts.push(p);
    }
    if (L.B !== 0) {
      const p = intersectLines(L.A, L.B, L.C, 0, 1, 0); // з y=0
      if (p) pts.push(p);
    }
  }

  // Початок координат
  pts.push({ x: 0, y: 0 });

  return dedupePoints(pts);
}

function solveLP(params: VariantParams): SolveResult {
  const candidates = candidateIntersections(params);
  const evaluated = candidates.map((p) => {
    const feasible = withinHalfspaces(p, params);
    const z = (params.c ?? 0) * p.x + PROFIT_B * p.y;
    return { ...p, z, feasible };
  });
  let best: { p: Point; z: number } | null = null;
  for (const row of evaluated) {
    if (!row.feasible) continue;
    if (!best || row.z > best.z) {
      best = { p: { x: row.x, y: row.y }, z: row.z };
    }
  }
  const feasibleVertices = evaluated.filter((r) => r.feasible).map((r) => ({ x: r.x, y: r.y }));

  // Сортування вершин ОДР навколо центроїда для побудови полігону
  let sortedVertices: Point[] = feasibleVertices.slice();
  if (sortedVertices.length >= 3) {
    const cx = sortedVertices.reduce((s, p) => s + p.x, 0) / sortedVertices.length;
    const cy = sortedVertices.reduce((s, p) => s + p.y, 0) / sortedVertices.length;
    sortedVertices = sortedVertices
      .slice()
      .sort((p1, p2) => Math.atan2(p1.y - cy, p1.x - cx) - Math.atan2(p2.y - cy, p2.x - cx));
  }

  return {
    feasibleVertices: sortedVertices,
    bestPoint: best?.p ?? null,
    bestValue: best?.z ?? 0,
    allCandidates: evaluated,
  };
}

function computeAxisMax(params: VariantParams, margin = 1.1): { maxX: number; maxY: number } {
  const { a, b, d } = params;
  const interceptsX: number[] = [];
  const interceptsY: number[] = [];

  // Для кожної нерівності A*x + B*y ≤ C
  const lines = [
    { A: a, B: 0.2, C: STOCK_COPPER },
    { A: 0.2, B: b, C: STOCK_CADMIUM },
    { A: 0.3, B: 0.2, C: d },
  ];
  for (const L of lines) {
    if (L.A > 0) interceptsX.push(L.C / L.A);
    if (L.B > 0) interceptsY.push(L.C / L.B);
  }
  interceptsX.push(0);
  interceptsY.push(0);

  const maxX = Math.max(...interceptsX.map((v) => (Number.isFinite(v) ? v : 0))) * margin || 1;
  const maxY = Math.max(...interceptsY.map((v) => (Number.isFinite(v) ? v : 0))) * margin || 1;
  return { maxX: Math.max(maxX, 1), maxY: Math.max(maxY, 1) };
}

function formatNumber(n: number, digits = 4): string {
  if (!Number.isFinite(n)) return '—';
  return n.toFixed(digits);
}

export default function TprLab7(): ReactElement {
  // Значення за замовчуванням для варіанта 6
  const [params, setParams] = useState<VariantParams>({
    a: 0.34,
    b: 0.6,
    c: 236,
    d: 648,
  });
  const [showObjective, setShowObjective] = useState<boolean>(true);
  const [computed, setComputed] = useState<SolveResult | null>(null);

  const axis = useMemo(() => computeAxisMax(params), [params]);

  const runSolve = () => {
    const res = solveLP(params);
    setComputed(res);
  };

  // Допоміжні функції для SVG
  const width = 680;
  const height = 420;
  const padding = 44;
  const sx = (x: number) => padding + (x / axis.maxX) * (width - 2 * padding);
  const sy = (y: number) => height - padding - (y / axis.maxY) * (height - 2 * padding);

  // Лінія цільової функції через оптимум (якщо існує)
  const objectiveLine = useMemo<{ p1: Point; p2: Point } | null>(() => {
    const bp = computed?.bestPoint;
    if (!bp) return null;
    // c*x + 290*y = k, через точку оптимуму
    const k = params.c * bp.x + PROFIT_B * bp.y;
    // перетини з осями
    const xInt = params.c !== 0 ? k / params.c : Number.POSITIVE_INFINITY;
    const yInt = k / PROFIT_B;
    const p1 = { x: 0, y: yInt };
    const p2 = { x: xInt, y: 0 };
    return { p1, p2 };
  }, [computed?.bestPoint, params.c]);

  return (
    <Stack gap="md">
      <Title order={3}>ЛР №7. Графічний метод вирішення задач оптимізації</Title>

      <Stack gap="xs">
        <Text size="md">
          <b>Мета:</b> максимізувати сумарний прибуток Z = c·x1 + 290·x2 за матеріальними
          обмеженнями:
        </Text>
        <Text>
          a·x1 + 0,2·x2 ≤ 600 (мідь); 0,2·x1 + b·x2 ≤ 870 (кадмій); 0,3·x1 + 0,2·x2 ≤ d (золото); x1
          ≥ 0; x2 ≥ 0.
        </Text>
        <Text size="sm" c="dimmed">
          За замовчуванням встановлено параметри варіанта 6.
        </Text>
      </Stack>

      <Divider my="sm" />
      <Title order={4} my="xs">
        Опис
      </Title>
      <Stack gap="xs">
        <Text>
          Графічний метод застосовується для лінійних задач із двома змінними. Кожне обмеження
          малюємо як пряму на площині <b>(x1, x2)</b> і заштриховуємо сторону, де нерівність
          виконується. Перетин напівплощин утворює багатокутник —{' '}
          <b>область допустимих рішень (ОДР)</b>.
        </Text>
        <Text>
          Лінії цільової функції вигляду <b>c·x1 + 290·x2 = const</b> — це паралельні прямі. Щоб
          знайти максимум, «зсуваємо» таку пряму паралельно в напрямку зростання Z, поки вона
          востаннє торкається ОДР. Оптимум завжди знаходиться в одній з вершин ОДР.
        </Text>
        <Text fw={500}>Алгоритм у два рядки:</Text>
        <List type="ordered" withPadding>
          <List.Item>
            Побудувати вершини ОДР як перетини пар граничних прямих і осей координат.
          </List.Item>
          <List.Item>Порахувати Z у всіх вершинах і вибрати найбільше значення.</List.Item>
        </List>
        <Text size="sm" c="dimmed">
          На цій сторінці інструмент автоматично знаходить вершини ОДР, обчислює значення Z у кожній
          вершині, і показує лінію цільової функції через оптимум.
        </Text>
      </Stack>

      <Divider my="sm" />
      <Title order={4} my="xs">
        Приклад з реального життя
      </Title>
      <Stack gap="xs">
        <Text>
          Уявімо фермерське господарство, яке має вирішити, скільки гектарів засіяти двома
          культурами: <b>A — томати</b> і <b>B — перець</b>. Є обмеження на три ресурси за сезон:{' '}
          <b>вода</b>, <b>добрива</b> і <b>праця</b>. Кожен гектар томатів і перцю споживає певну
          кількість цих ресурсів, а прибуток з гектара різний. Мета —{' '}
          <b>максимізувати сезонний прибуток</b>.
        </Text>
        <Text fw={500}>Як застосувати метод:</Text>
        <List type="ordered" withPadding>
          <List.Item>Позначте змінні: x1 — площа під томати, x2 — площа під перець.</List.Item>
          <List.Item>
            Складіть обмеження: витрата води/добрив/праці на гектар помножити на площу не повинна
            перевищувати сезонний запас (три лінійні нерівності).
          </List.Item>
          <List.Item>
            Запишіть цільову функцію: Z = c·x1 + 290·x2, де коефіцієнти — прибуток з гектара кожної
            культури.
          </List.Item>
          <List.Item>Візуалізуйте ОДР та знайдіть вершини (перетини прямих і осей).</List.Item>
          <List.Item>
            Порахуйте Z у вершинах і виберіть найбільше значення — це оптимальний план.
          </List.Item>
        </List>
        <Text size="sm" c="dimmed">
          Якщо під рукою немає аграрних даних, скористайтесь прикладом з методички: x1 — кількість
          виробів типу A, x2 — кількість виробів типу B; обмеження задають витрати матеріалів
          (мідь/кадмій/золото), а коефіцієнти цільової функції — прибуток від реалізації.
        </Text>
      </Stack>

      <Divider my="sm" />
      <Title order={4} my="xs">
        Вхідні дані (параметри варіанта)
      </Title>
      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Group justify="space-between" wrap="wrap">
            <NumberInput
              label="a (мідь для A)"
              value={params.a}
              step={0.01}
              min={0}
              max={10}
              onChange={(v) =>
                setParams((p) => ({
                  ...p,
                  a: typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : 0,
                }))
              }
              w={220}
            />
            <NumberInput
              label="b (кадмій для B)"
              value={params.b}
              step={0.01}
              min={0}
              max={10}
              onChange={(v) =>
                setParams((p) => ({
                  ...p,
                  b: typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : 0,
                }))
              }
              w={220}
            />
            <NumberInput
              label="c (прибуток для A)"
              value={params.c}
              step={1}
              min={0}
              max={10000}
              onChange={(v) =>
                setParams((p) => ({
                  ...p,
                  c: typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : 0,
                }))
              }
              w={220}
            />
            <NumberInput
              label="d (запас золота)"
              value={params.d}
              step={1}
              min={0}
              max={10000}
              onChange={(v) =>
                setParams((p) => ({
                  ...p,
                  d: typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : 0,
                }))
              }
              w={220}
            />
          </Group>

          <Group justify="space-between">
            <Checkbox
              checked={showObjective}
              onChange={(e) => setShowObjective(e.currentTarget.checked)}
              label="Показувати лінію цільової функції через оптимум"
            />
            <Group>
              <Button onClick={runSolve}>Обчислити</Button>
            </Group>
          </Group>
        </Stack>
      </Paper>

      {computed && (
        <Paper p="md" withBorder>
          <Title order={4} mb="sm">
            Результати
          </Title>
          <Stack gap="xs">
            <Text>
              Оптимальна точка (x1, x2):{' '}
              <b>
                ({formatNumber(computed.bestPoint?.x ?? NaN, 3)};{' '}
                {formatNumber(computed.bestPoint?.y ?? NaN, 3)})
              </b>
              , Z = <b>{formatNumber(computed.bestValue, 2)}</b>
            </Text>
            <Text size="sm" c="dimmed">
              Масштаб осей: x1 ∈ [0; {formatNumber(axis.maxX, 2)}], x2 ∈ [0;{' '}
              {formatNumber(axis.maxY, 2)}]
            </Text>
          </Stack>

          <Divider my="sm" label="Графік (ОДР і цільова функція)" />
          <div style={{ overflowX: 'auto' }}>
            <svg
              width={width}
              height={height}
              style={{ border: '1px solid var(--mantine-color-gray-4)' }}
            >
              {/* білий фон для всього полотна */}
              <rect x={0} y={0} width={width} height={height} fill="#ffffff" />
              {/* осі координат */}
              <line
                x1={sx(0)}
                y1={sy(0)}
                x2={sx(axis.maxX)}
                y2={sy(0)}
                stroke="#000"
                strokeWidth={2}
              />
              <line
                x1={sx(0)}
                y1={sy(0)}
                x2={sx(0)}
                y2={sy(axis.maxY)}
                stroke="#000"
                strokeWidth={2}
              />
              {/* поділки на осях */}
              {Array.from({ length: 10 }).map((_, i) => {
                const tx = (i + 1) * (axis.maxX / 10);
                const ty = (i + 1) * (axis.maxY / 10);
                return (
                  <g key={i}>
                    <line x1={sx(tx)} y1={sy(0) - 4} x2={sx(tx)} y2={sy(0) + 4} stroke="#000" />
                    <text x={sx(tx)} y={sy(0) + 16} fontSize={10} textAnchor="middle">
                      {tx.toFixed(0)}
                    </text>
                    <line x1={sx(0) - 4} y1={sy(ty)} x2={sx(0) + 4} y2={sy(ty)} stroke="#000" />
                    <text x={sx(0) - 8} y={sy(ty) + 4} fontSize={10} textAnchor="end">
                      {ty.toFixed(0)}
                    </text>
                  </g>
                );
              })}

              {/* багатокутник області допустимих рішень */}
              {computed.feasibleVertices.length >= 3 && (
                <polygon
                  points={computed.feasibleVertices.map((p) => `${sx(p.x)},${sy(p.y)}`).join(' ')}
                  fill="rgba(76, 175, 80, 0.18)"
                  stroke="rgba(76, 175, 80, 0.9)"
                  strokeWidth={2}
                />
              )}

              {/* граничні прямі обмежень (обрізані перетинами з осями в межах видимої області) */}
              {(() => {
                const segs = [
                  { A: params.a, B: 0.2, C: STOCK_COPPER, color: '#3f51b5' },
                  { A: 0.2, B: params.b, C: STOCK_CADMIUM, color: '#e91e63' },
                  { A: 0.3, B: 0.2, C: params.d, color: '#ff9800' },
                ];
                return segs.map((L, idx) => {
                  const xInt = L.A !== 0 ? L.C / L.A : Infinity;
                  const yInt = L.B !== 0 ? L.C / L.B : Infinity;
                  const p1 = { x: 0, y: Math.min(yInt, axis.maxY) };
                  const p2 = { x: Math.min(xInt, axis.maxX), y: 0 };
                  return (
                    <g key={idx}>
                      <line
                        x1={sx(p1.x)}
                        y1={sy(p1.y)}
                        x2={sx(p2.x)}
                        y2={sy(p2.y)}
                        stroke={L.color}
                        strokeWidth={2}
                      />
                    </g>
                  );
                });
              })()}

              {/* лінія цільової функції через оптимум */}
              {showObjective &&
                objectiveLine &&
                Number.isFinite(objectiveLine.p1.y) &&
                Number.isFinite(objectiveLine.p2.x) && (
                  <line
                    x1={sx(0)}
                    y1={sy(Math.min(objectiveLine.p1.y, axis.maxY))}
                    x2={sx(Math.min(objectiveLine.p2.x, axis.maxX))}
                    y2={sy(0)}
                    stroke="#222"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                  />
                )}

              {/* позначення оптимальної точки */}
              {computed.bestPoint && (
                <g>
                  <circle
                    cx={sx(computed.bestPoint.x)}
                    cy={sy(computed.bestPoint.y)}
                    r={5}
                    fill="#1b5e20"
                  />
                  <text
                    x={sx(computed.bestPoint.x) + 8}
                    y={sy(computed.bestPoint.y) - 8}
                    fontSize={12}
                    fill="#1b5e20"
                  >
                    Опт({formatNumber(computed.bestPoint.x, 2)};{' '}
                    {formatNumber(computed.bestPoint.y, 2)})
                  </text>
                </g>
              )}
            </svg>
          </div>

          <Divider my="sm" label="Кандидатні точки (перевірені)" />
          <Table withTableBorder withColumnBorders stickyHeader striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>#</Table.Th>
                <Table.Th>x1</Table.Th>
                <Table.Th>x2</Table.Th>
                <Table.Th>Z = c*x1 + 290*x2</Table.Th>
                <Table.Th>Допустима</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {computed.allCandidates.map((r, i) => (
                <Table.Tr key={i}>
                  <Table.Td>{i + 1}</Table.Td>
                  <Table.Td>{formatNumber(r.x, 4)}</Table.Td>
                  <Table.Td>{formatNumber(r.y, 4)}</Table.Td>
                  <Table.Td>{formatNumber(r.z, 2)}</Table.Td>
                  <Table.Td>{r.feasible ? 'так' : 'ні'}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}
    </Stack>
  );
}
