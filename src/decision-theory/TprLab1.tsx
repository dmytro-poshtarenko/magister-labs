import { type ReactElement, useMemo, useState } from 'react';
import {
  Title,
  Text,
  Stack,
  Group,
  NumberInput,
  Button,
  Paper,
  Table,
  SegmentedControl,
  Slider,
  Switch,
  TextInput,
  Divider,
  Alert,
} from '@mantine/core';

type Orientation = 'gain' | 'cost';

type CriteriaResults = {
  maximax: number[];
  wald: number[];
  hurwicz: number[];
  laplace: number[];
  bestIndexByCriterion: {
    maximax: number;
    wald: number;
    hurwicz: number;
    laplace: number;
  };
};

function createMatrix(rows: number, cols: number, fill = 0): number[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => fill));
}

function resizeMatrix(matrix: number[][], rows: number, cols: number): number[][] {
  const next = matrix.map((r) => r.slice(0, cols));
  while (next.length < rows) next.push(Array.from({ length: cols }, () => 0));
  for (const r of next) while (r.length < cols) r.push(0);
  return next.slice(0, rows);
}

function normalizeWeights(weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + (isFinite(b) ? b : 0), 0);
  if (sum <= 0) return Array.from({ length: weights.length }, () => 1 / weights.length);
  return weights.map((w) => w / sum);
}

function computeResults(
  payoffs: number[][],
  weights: number[] | null,
  q: number,
  orientation: Orientation,
): CriteriaResults {
  const m = payoffs.length;
  const n = m > 0 ? payoffs[0]!.length : 0;
  const safeWeights = weights ? normalizeWeights(weights) : Array.from({ length: n }, () => 1 / n);

  const isGain = orientation === 'gain';

  const rowMax = (row: number[]) =>
    row.length ? row.reduce((a, b) => (b > a ? b : a), row[0]!) : 0;
  const rowMin = (row: number[]) =>
    row.length ? row.reduce((a, b) => (b < a ? b : a), row[0]!) : 0;
  const rowAvg = (row: number[]) => row.reduce((acc, v, j) => acc + v * (safeWeights[j] ?? 0), 0);

  const maximax: number[] = [];
  const wald: number[] = [];
  const hurwicz: number[] = [];
  const laplace: number[] = [];

  for (let i = 0; i < m; i += 1) {
    const row = payoffs[i] ?? [];
    const max = rowMax(row);
    const min = rowMin(row);
    const best = isGain ? max : min;
    const worst = isGain ? min : max;

    maximax.push(isGain ? max : min);
    wald.push(isGain ? min : max);
    hurwicz.push(q * worst + (1 - q) * best);
    laplace.push(rowAvg(row));
  }

  const selectIndex = (arr: number[], pickBest: boolean): number => {
    if (arr.length === 0) return 0;
    let idx = 0;
    let current = arr[0]!;
    for (let i = 1; i < arr.length; i += 1) {
      const candidate = arr[i]!;
      if ((pickBest && candidate > current) || (!pickBest && candidate < current)) {
        current = candidate;
        idx = i;
      }
    }
    return idx;
  };

  const bestIndexByCriterion = {
    maximax: selectIndex(maximax, isGain),
    wald: selectIndex(wald, isGain),
    hurwicz: selectIndex(hurwicz, isGain),
    laplace: selectIndex(laplace, isGain),
  };

  return { maximax, wald, hurwicz, laplace, bestIndexByCriterion };
}

export default function TprLab1(): ReactElement {
  const [numAlt, setNumAlt] = useState<number>(3);
  const [numStates, setNumStates] = useState<number>(3);
  const [matrix, setMatrix] = useState<number[][]>(() => createMatrix(3, 3));
  const [altNames, setAltNames] = useState<string[]>(['A1', 'A2', 'A3']);
  const [stateNames, setStateNames] = useState<string[]>(['F1', 'F2', 'F3']);
  const [useProb, setUseProb] = useState<boolean>(false);
  const [probabilities, setProbabilities] = useState<number[]>([0.33, 0.33, 0.34]);
  const [orientation, setOrientation] = useState<Orientation>('gain');
  const [q, setQ] = useState<number>(0.5); // pessimism
  const [computed, setComputed] = useState<CriteriaResults | null>(null);

  // Keep dimensions in sync
  const syncDimensions = (alts: number, states: number) => {
    setMatrix((prev) => resizeMatrix(prev, alts, states));
    setAltNames((prev) => {
      const next = prev.slice(0, alts);
      while (next.length < alts) next.push(`A${next.length + 1}`);
      return next;
    });
    setStateNames((prev) => {
      const next = prev.slice(0, states);
      while (next.length < states) next.push(`F${next.length + 1}`);
      return next;
    });
    setProbabilities((prev) => {
      const next = prev.slice(0, states);
      while (next.length < states) next.push(1 / states);
      return next;
    });
  };

  const probSum = useMemo(
    () => probabilities.slice(0, numStates).reduce((a, b) => a + (isFinite(b) ? b : 0), 0),
    [probabilities, numStates],
  );
  const probValid = !useProb || Math.abs(probSum - 1) < 1e-6;

  const runCompute = () => {
    const weights = useProb ? probabilities.slice(0, numStates) : null;
    setComputed(
      computeResults(
        matrix.slice(0, numAlt).map((r) => r.slice(0, numStates)),
        weights,
        q,
        orientation,
      ),
    );
  };

  return (
    <Stack gap="md">
      <Title order={3}>ЛР №1. Аналіз альтернатив в умовах невизначеності.</Title>
      <Stack gap="xs">
        <Text size="md">
          <b>Мета:</b> засвоєння навичок оптимізації рішень в умовах невизначеності.
        </Text>
        <Divider my="sm" />
        <Title order={4} my="xs">
          Опис
        </Title>
        <Stack gap="xs">
          <Text>
            <b>Критерій Максимакс</b> (оптимістичний): обирає альтернативу з найкращим можливим
            результатом. Корисно, якщо ви орієнтовані на максимум вигоди і готові до ризику.
          </Text>
          <Text>
            <b>Критерій Вальда</b> (песимістичний, «максимін» для виграшів / «мінімакс» для витрат):
            дивиться на найгірші можливі наслідки та обирає альтернативу з найкращим з найгірших
            результатів. Підходить, коли важлива обережність.
          </Text>
          <Text>
            <b>Критерій Гурвіца</b>: баланс між оптимізмом і песимізмом. Параметр q (0…1) задає
            «ступінь песимізму»: чим більший q, тим більше ваги найгіршому випадку.
          </Text>
          <Text>
            <b>Критерій Лапласа / Байєса–Лапласа</b>: якщо ймовірності станів невідомі — вважаємо їх
            рівними (Лаплас); якщо відомі — зважуємо результати за цими ймовірностями
            (Байєса–Лапласа).
          </Text>
        </Stack>
      </Stack>
      <Divider my="sm" />
      <Title order={4} my="xs">
        Приклад з реального життя
      </Title>
      <Stack gap="xs">
        <Text>
          Агроном планує посів на полі. <b>Альтернативи</b>: виростити пшеницю, кукурудзу або
          соняшник. <b>Стани</b>: дощове літо, нормальне, посушливе. Табличні значення — очікуваний
          прибуток (або витрати) для кожної культури за кожного стану погоди.
        </Text>
        <Text>
          За <b>Максимаксом</b> агроном обере культуру з найбільшим можливим прибутком (наприклад,
          кукурудза при дощовому літі), приймаючи ризик, що літо може бути посушливим.
        </Text>
        <Text>
          За <b>Вальдом</b> він сконцентрується на гіршому сценарії для кожної культури й обере ту,
          де навіть у найгіршому разі втрати мінімальні або прибуток найвищий серед мінімумів
          (обережна стратегія).
        </Text>
        <Text>
          За <b>Гурвицем</b> агроном відрегулює баланс оптимізму‑песимізму за допомогою q:
          наприклад, q=0.7 надає більшу вагу гіршому результату, q=0.3 — кращому.
        </Text>
        <Text>
          За <b>Лапласом</b> (якщо немає достовірних прогнозів) усі погоди вважаються
          рівноймовірними; за <b>Байєса–Лапласа</b> (якщо є прогнози ймовірностей) — культура з
          найбільшим середнім зваженим прибутком буде раціональним вибором.
        </Text>
      </Stack>

      <Divider my="sm" />
      <Title order={4} my="xs">
        Імплементація
      </Title>

      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Group grow>
            <NumberInput
              label="Кількість альтернатив"
              min={1}
              value={numAlt}
              onChange={(v) => {
                const n = Number(v) || 1;
                setNumAlt(n);
                syncDimensions(n, numStates);
              }}
            />
            <NumberInput
              label="Кількість станів природи"
              min={1}
              value={numStates}
              onChange={(v) => {
                const n = Number(v) || 1;
                setNumStates(n);
                syncDimensions(numAlt, n);
              }}
            />
          </Group>

          <Group justify="space-between" align="center">
            <SegmentedControl
              value={orientation}
              onChange={(v: string) => setOrientation(v as Orientation)}
              data={[
                { label: 'Виграші', value: 'gain' },
                { label: 'Витрати', value: 'cost' },
              ]}
            />
            <Group>
              <Text size="sm">Коеф. песимізму q: {q.toFixed(2)}</Text>
              <Slider min={0} max={1} step={0.01} value={q} onChange={setQ} w={200} />
            </Group>
            <Group>
              <Switch
                checked={useProb}
                onChange={(e) => setUseProb(e.currentTarget.checked)}
                label="Відомі ймовірності станів"
              />
            </Group>
          </Group>

          <Divider label="Назви альтернатив і станів" />
          <Group align="flex-start" grow>
            <Stack gap={6}>
              <Text fw={500}>Альтернативи</Text>
              {Array.from({ length: numAlt }).map((_, i) => (
                <TextInput
                  key={i}
                  value={altNames[i] ?? ''}
                  onChange={(e) => {
                    const next = altNames.slice();
                    next[i] = e.currentTarget.value;
                    setAltNames(next);
                  }}
                />
              ))}
            </Stack>
            <Stack gap={6}>
              <Text fw={500}>Стани</Text>
              {Array.from({ length: numStates }).map((_, j) => (
                <TextInput
                  key={j}
                  value={stateNames[j] ?? ''}
                  onChange={(e) => {
                    const next = stateNames.slice();
                    next[j] = e.currentTarget.value;
                    setStateNames(next);
                  }}
                />
              ))}
            </Stack>
          </Group>

          <Divider label="Матриця виграшів/витрат" />
          <Table striped withTableBorder withColumnBorders stickyHeader>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Альтерн.</Table.Th>
                {Array.from({ length: numStates }).map((_, j) => (
                  <Table.Th key={j}>{stateNames[j] ?? `F${j + 1}`}</Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {Array.from({ length: numAlt }).map((_, i) => (
                <Table.Tr key={i}>
                  <Table.Td>{altNames[i] ?? `A${i + 1}`}</Table.Td>
                  {Array.from({ length: numStates }).map((_, j) => (
                    <Table.Td key={j}>
                      <NumberInput
                        value={matrix[i] && matrix[i][j] !== undefined ? matrix[i][j] : 0}
                        onChange={(v: number | string | null) => {
                          const num =
                            typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : 0;
                          setMatrix((prev) => {
                            const next = resizeMatrix(prev, numAlt, numStates);
                            const row = next[i];
                            if (!row) return prev;
                            row[j] = Number.isFinite(num) ? num : 0;
                            return next.map((r) => r.slice());
                          });
                        }}
                        step={0.1}
                      />
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          {useProb && (
            <>
              <Divider label="Ймовірності станів (сума = 1)" />
              <Group>
                {Array.from({ length: numStates }).map((_, j) => (
                  <NumberInput
                    key={j}
                    label={stateNames[j] ?? `F${j + 1}`}
                    value={probabilities[j] ?? 0}
                    onChange={(v) => {
                      const valNum =
                        typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : 0;
                      setProbabilities((prev) => {
                        const next = prev.slice(0, numStates);
                        next[j] = Number.isFinite(valNum) ? valNum : 0;
                        return next;
                      });
                    }}
                    min={0}
                    step={0.01}
                  />
                ))}
              </Group>
              {!probValid && (
                <Alert color="red" title="Сума ймовірностей має дорівнювати 1">
                  Поточна сума: {probSum.toFixed(3)}
                </Alert>
              )}
            </>
          )}

          <Group>
            <Button onClick={runCompute} disabled={useProb && !probValid}>
              Обчислити
            </Button>
          </Group>
        </Stack>
      </Paper>

      {computed && (
        <Paper p="md" withBorder>
          <Title order={4} mb="sm">
            Результати
          </Title>
          <Text size="sm" c="dimmed" mb="sm">
            Орієнтація: {orientation === 'gain' ? 'максимізація виграшів' : 'мінімізація витрат'}; q
            = {q.toFixed(2)}; метод Лапласа —
            {useProb
              ? ' з відомими ймовірностями (Байєса–Лапласа).'
              : ' з рівноймовірними станами.'}
          </Text>

          <Table withTableBorder withColumnBorders stickyHeader>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Альтернатива</Table.Th>
                <Table.Th>Максимакс</Table.Th>
                <Table.Th>Вальда</Table.Th>
                <Table.Th>Гурвіца</Table.Th>
                <Table.Th>{useProb ? 'Байєса–Лапласа' : 'Лапласа'}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {computed.maximax.map((_, i) => (
                <Table.Tr key={i}>
                  <Table.Td>{altNames[i] ?? `A${i + 1}`}</Table.Td>
                  <Table.Td fw={computed.bestIndexByCriterion.maximax === i ? 700 : 400}>
                    {(computed.maximax[i] ?? 0).toFixed(3)}
                  </Table.Td>
                  <Table.Td fw={computed.bestIndexByCriterion.wald === i ? 700 : 400}>
                    {(computed.wald[i] ?? 0).toFixed(3)}
                  </Table.Td>
                  <Table.Td fw={computed.bestIndexByCriterion.hurwicz === i ? 700 : 400}>
                    {(computed.hurwicz[i] ?? 0).toFixed(3)}
                  </Table.Td>
                  <Table.Td fw={computed.bestIndexByCriterion.laplace === i ? 700 : 400}>
                    {(computed.laplace[i] ?? 0).toFixed(3)}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          <Divider my="sm" />
          <Text>
            Найкращі альтернативи: Максимакс —{' '}
            <b>
              {altNames[computed.bestIndexByCriterion.maximax] ??
                `A${computed.bestIndexByCriterion.maximax + 1}`}
            </b>
            ; Вальда —
            <b>
              {' '}
              {altNames[computed.bestIndexByCriterion.wald] ??
                `A${computed.bestIndexByCriterion.wald + 1}`}
            </b>
            ; Гурвіца —
            <b>
              {' '}
              {altNames[computed.bestIndexByCriterion.hurwicz] ??
                `A${computed.bestIndexByCriterion.hurwicz + 1}`}
            </b>
            ; {useProb ? 'Байєса–Лапласа' : 'Лапласа'} —
            <b>
              {' '}
              {altNames[computed.bestIndexByCriterion.laplace] ??
                `A${computed.bestIndexByCriterion.laplace + 1}`}
            </b>
            .
          </Text>
        </Paper>
      )}
    </Stack>
  );
}
