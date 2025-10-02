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
  TextInput,
  Divider,
  Alert,
  Tooltip,
} from '@mantine/core';

// Орієнтація задачі: 'gain' — максимізація виграшів, 'cost' — мінімізація витрат
type Orientation = 'gain' | 'cost';

// Результати критеріїв ризику для кожної альтернативи
// ev — очікуване значення (КОЗ/EMV)
// savage — максимальний «жаль» (мінімакс Севіджа)
// meanVariance — корисність mean − k·variance
// threshold — очікуваний дефіцит/надлишок відносно порога T (менше — краще)
// mostLikely — значення у найвірогіднішому стані
type RiskCriteriaResults = {
  ev: number[];
  savage: number[];
  meanVariance: number[];
  threshold: number[];
  mostLikely: number[];
  bestIndexByCriterion: {
    ev: number;
    savage: number;
    meanVariance: number;
    threshold: number;
    mostLikely: number;
  };
};

// Створює числову матрицю rows×cols, заповнену значенням fill
function createMatrix(rows: number, cols: number, fill = 0): number[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => fill));
}

// Змінює розмір матриці: обрізає зайве та добиває нулями до потрібних розмірів
function resizeMatrix(matrix: number[][], rows: number, cols: number): number[][] {
  const next = matrix.map((r) => r.slice(0, cols));
  while (next.length < rows) next.push(Array.from({ length: cols }, () => 0));
  for (const r of next) while (r.length < cols) r.push(0);
  return next.slice(0, rows);
}

// Нормалізує ваги/ймовірності: приводить суму до 1; якщо сума некоректна — повертає рівні ваги
function normalizeWeights(weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + (isFinite(b) ? b : 0), 0);
  if (sum <= 0) return Array.from({ length: weights.length }, () => 1 / weights.length);
  return weights.map((w) => w / sum);
}

/**
 * Обчислює критерії для прийняття рішень в умовах ризику.
 * payoffs — матриця виграшів/витрат: рядки — альтернативи, стовпці — стани природи
 * probs — ймовірності станів природи (нормалізуються всередині)
 * orientation — виграші чи витрати (визначає, що є «краще/гірше»)
 * riskAversionK — рівень несхильності до ризику в моделі mean−k·variance
 * threshold — порогове значення T (використовується для підрахунку очікуваного дефіциту/надлишку)
 */
function computeRiskResults(
  payoffs: number[][],
  probs: number[],
  orientation: Orientation,
  riskAversionK: number,
  threshold: number,
): RiskCriteriaResults {
  const m = payoffs.length;
  const n = m > 0 ? payoffs[0]!.length : 0;
  const p = normalizeWeights(probs.slice(0, n));
  const isGain = orientation === 'gain';

  // Найкраще значення в кожному стовпці (для побудови матриці «жалю»)
  const colBest: number[] = Array.from({ length: n }, (_, j) => {
    const colVals: number[] = Array.from({ length: m }, (_, i) => payoffs[i]?.[j] ?? 0);
    if (colVals.length === 0) return 0;
    return isGain
      ? colVals.reduce((a, b) => (b > a ? b : a), colVals[0]!)
      : colVals.reduce((a, b) => (b < a ? b : a), colVals[0]!);
  });

  // Матриця «жалю»: наскільки гірший результат за найкращий у стані
  const regretMatrix: number[][] = Array.from({ length: m }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      const v = payoffs[i]?.[j] ?? 0;
      const best = colBest[j] ?? 0;
      const r = isGain ? best - v : v - best;
      return r < 0 ? 0 : r;
    }),
  );

  // Очікуване значення альтернативи за відомих ймовірностей
  const expectedValue = (row: number[]): number =>
    row.reduce((acc, v, j) => acc + v * (p[j] ?? 0), 0);

  // Дисперсія результату альтернативи (з урахуванням ймовірностей)
  const expectedVariance = (row: number[]): number => {
    const mean = expectedValue(row);
    return row.reduce((acc, v, j) => {
      const w = p[j] ?? 0;
      const d = v - mean;
      return acc + w * d * d;
    }, 0);
  };

  const ev: number[] = [];
  const savage: number[] = [];
  const meanVariance: number[] = [];
  const thrGap: number[] = [];
  const mostLikely: number[] = [];

  const mostProbStateIndex = (() => {
    if (p.length === 0) return 0;
    let idx = 0;
    let cur = p[0] ?? 0;
    for (let j = 1; j < p.length; j += 1) {
      const candidate = p[j] ?? 0;
      if (candidate > cur) {
        cur = candidate;
        idx = j;
      }
    }
    return idx;
  })();

  for (let i = 0; i < m; i += 1) {
    const row = payoffs[i] ?? [];
    const mean = expectedValue(row);
    const variance = expectedVariance(row);

    ev.push(mean);

    // Севіджа: мінімізуємо максимальний «жаль» у рядку
    const maxRegret =
      regretMatrix[i]?.reduce((a, b) => (b > a ? b : a), regretMatrix[i]?.[0] ?? 0) ?? 0;
    savage.push(maxRegret);

    // Корисність mean − k·variance (максимізуємо)
    const utility = isGain ? mean - riskAversionK * variance : -(mean + riskAversionK * variance);
    meanVariance.push(utility);

    // Очікуваний дефіцит/надлишок відносно порога (менше — краще)
    const gap = row.reduce((acc, v, j) => {
      const diff = isGain ? Math.max(0, threshold - v) : Math.max(0, v - threshold);
      return acc + (p[j] ?? 0) * diff;
    }, 0);
    thrGap.push(gap);

    // Критерій найвірогіднішого стану
    mostLikely.push(row[mostProbStateIndex] ?? 0);
  }

  // Повертає індекс найкращого/найгіршого елемента масиву залежно від pickBest
  const selectIndex = (arr: number[], pickBest: boolean): number => {
    if (arr.length === 0) return 0;
    let idx = 0;
    let current = arr[0] ?? 0;
    for (let i = 1; i < arr.length; i += 1) {
      const candidate = arr[i] ?? 0;
      if ((pickBest && candidate > current) || (!pickBest && candidate < current)) {
        current = candidate;
        idx = i;
      }
    }
    return idx;
  };

  const bestIndexByCriterion = {
    ev: selectIndex(ev, isGain),
    savage: selectIndex(savage, false),
    meanVariance: selectIndex(meanVariance, true),
    threshold: selectIndex(thrGap, false),
    mostLikely: selectIndex(mostLikely, isGain),
  };

  return { ev, savage, meanVariance, threshold: thrGap, mostLikely, bestIndexByCriterion };
}

export default function TprLab2(): ReactElement {
  // Кількість альтернатив та станів природи
  const [numAlt, setNumAlt] = useState<number>(3);
  const [numStates, setNumStates] = useState<number>(3);
  // Матриця значень (виграші/витрати) та підписи
  const [matrix, setMatrix] = useState<number[][]>(() => createMatrix(3, 3));
  const [altNames, setAltNames] = useState<string[]>(['A1', 'A2', 'A3']);
  const [stateNames, setStateNames] = useState<string[]>(['F1', 'F2', 'F3']);
  // Орієнтація задачі (виграші/витрати)
  const [orientation, setOrientation] = useState<Orientation>('gain');
  // Ймовірності станів, параметр ризику k і поріг T
  const [probabilities, setProbabilities] = useState<number[]>([0.33, 0.33, 0.34]);
  const [riskK, setRiskK] = useState<number>(0.5);
  const [threshold, setThreshold] = useState<number>(0);
  // Кеш результатів обчислення критеріїв
  const [computed, setComputed] = useState<RiskCriteriaResults | null>(null);

  // Синхронізує розміри матриці, назв і векторів імовірностей
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

  // Сума імовірностей (для валідації) та прапорець валідності
  const probSum = useMemo(
    () => probabilities.slice(0, numStates).reduce((a, b) => a + (isFinite(b) ? b : 0), 0),
    [probabilities, numStates],
  );
  const probValid = Math.abs(probSum - 1) < 1e-6;

  // Підготує дані та запускає обчислення критеріїв
  const runCompute = () => {
    const weights = probabilities.slice(0, numStates);
    setComputed(
      computeRiskResults(
        matrix.slice(0, numAlt).map((r) => r.slice(0, numStates)),
        weights,
        orientation,
        riskK,
        threshold,
      ),
    );
  };

  return (
    <Stack gap="md">
      <Title order={3}>ЛР №2. Вибір рішення в умовах ризику</Title>
      <Stack gap="xs">
        <Text size="md">
          <b>Мета:</b> відпрацювання вибору альтернатив за відомих ймовірностей станів природи.
        </Text>
        <Divider my="sm" />
        <Title order={4} my="xs">
          Опис
        </Title>
        <Stack gap="xs">
          <Text>
            <b>Критерій очікуваного значення (КОЗ)</b>: обираємо альтернативу з найкращим очікуваним
            результатом (зваженим за відомими ймовірностями станів). Для витрат — з найменшими
            очікуваними витратами.
          </Text>
          <Text>
            <b>Критерій мінімаксного ризику Севіджа</b>: обчислюємо «жаль» (regret) у кожному стані
            відносно найкращого в цьому стані та обираємо альтернативу з мінімальним максимальним
            «жалем».
          </Text>
          <Text>
            <b>Комбінація КОЗ і дисперсії</b>: балансуємо середнє значення та мінливість. Константа
            k задає рівень несхильності до ризику (більший k — сильніше «штрафуємо» дисперсію).
          </Text>
          <Text>
            <b>Критерій граничного рівня</b>: мінімізуємо очікуваний відхід від порога T. Для
            виграшів — очікуваний дефіцит max(0, T − значення), для витрат — очікуваний надлишок
            max(0, значення − T). Менше — краще.
          </Text>
          <Text>
            <b>Найвірогідніший стан</b>: фокус на стані з найбільшою ймовірністю та оптимізація під
            нього.
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
          соняшник. <b>Стани</b>: дощове літо, нормальне, посушливе. Ймовірності цих станів{' '}
          <b>відомі</b> з історичних даних або прогнозів (наприклад, 0.4, 0.4, 0.2).
        </Text>
        <Text>
          За <b>КОЗ</b> агроном обирає культуру з найбільшим очікуваним прибутком, обчисленим як
          зважене середнє за відомими ймовірностями станів погоди.
        </Text>
        <Text>
          За <b>Севіджа</b> він мінімізує максимальний «жаль»: порівнює кожну культуру з найкращим
          результатом у відповідному стані погоди і обирає ту, де найбільша різниця (жаль) найменша.
        </Text>
        <Text>
          За <b>КОЗ–Дисперсією</b> агроном балансує очікуваний прибуток і мінливість (ризик) цього
          прибутку. Більше значення <b>k</b> означає більшу несхильність до ризику й більший штраф
          за високу дисперсію.
        </Text>
        <Text>
          За <b>граничним рівнем</b> встановлюється поріг T (наприклад, «не менше 8 т/га» для
          виграшів), і обирається культура, яка в середньому найменше не дотягує до цього порога.
          Якщо йдеться про витрати — та, що в середньому найменше перевищує запланований бюджет.
        </Text>
        <Text>
          За <b>найвірогіднішим станом</b> агроном фокусується на погоді з найвищою ймовірністю та
          обирає культуру, яка дає найкращий результат саме в цьому стані.
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
              <Group gap={6} align="center">
                <Text size="sm">Рівень несхильності до ризику k: {riskK.toFixed(2)}</Text>
                <Tooltip
                  label="k — вага ризику у mean − k·variance; більше k — сильніший штраф за мінливість"
                  withArrow
                >
                  <Text size="sm" c="dimmed" style={{ cursor: 'help' }}>
                    ?
                  </Text>
                </Tooltip>
              </Group>
              <Slider min={0} max={2} step={0.05} value={riskK} onChange={setRiskK} w={220} />
            </Group>
            <Group align="center" gap={8}>
              <Group align="center" gap={6}>
                <Text fw={500}>Поріг T</Text>
                <Tooltip
                  label="Поріг T: бажаний рівень. Для виграшів — мінімізуємо середній дефіцит; для витрат — середнє перевищення"
                  withArrow
                >
                  <Text size="sm" c="dimmed" style={{ cursor: 'help' }}>
                    ?
                  </Text>
                </Tooltip>
              </Group>
              <NumberInput
                value={threshold}
                onChange={(v) => {
                  const num = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : 0;
                  setThreshold(Number.isFinite(num) ? num : 0);
                }}
                step={0.1}
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

          <Divider label="Ймовірності станів (сума = 1)" />
          <Group>
            {Array.from({ length: numStates }).map((_, j) => (
              <NumberInput
                key={j}
                label={stateNames[j] ?? `F${j + 1}`}
                value={probabilities[j] ?? 0}
                onChange={(v) => {
                  const valNum = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : 0;
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

          <Group>
            <Button onClick={runCompute} disabled={!probValid}>
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
            Орієнтація: {orientation === 'gain' ? 'максимізація виграшів' : 'мінімізація витрат'}; k
            = {riskK.toFixed(2)}; поріг T = {threshold}
          </Text>

          <Table withTableBorder withColumnBorders stickyHeader>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Альтернатива</Table.Th>
                <Table.Th>КОЗ (очікуване значення)</Table.Th>
                <Table.Th>Севіджа (мінімаксний ризик)</Table.Th>
                <Table.Th>КОЗ–Дисперсія (корисність)</Table.Th>
                <Table.Th>Очік. дефіцит/надлишок до T</Table.Th>
                <Table.Th>Найвірогідніший стан</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {computed.ev.map((_, i) => (
                <Table.Tr key={i}>
                  <Table.Td>{altNames[i] ?? `A${i + 1}`}</Table.Td>
                  <Table.Td fw={computed.bestIndexByCriterion.ev === i ? 700 : 400}>
                    {(computed.ev[i] ?? 0).toFixed(3)}
                  </Table.Td>
                  <Table.Td fw={computed.bestIndexByCriterion.savage === i ? 700 : 400}>
                    {(computed.savage[i] ?? 0).toFixed(3)}
                  </Table.Td>
                  <Table.Td fw={computed.bestIndexByCriterion.meanVariance === i ? 700 : 400}>
                    {(computed.meanVariance[i] ?? 0).toFixed(3)}
                  </Table.Td>
                  <Table.Td fw={computed.bestIndexByCriterion.threshold === i ? 700 : 400}>
                    {(computed.threshold[i] ?? 0).toFixed(3)}
                  </Table.Td>
                  <Table.Td fw={computed.bestIndexByCriterion.mostLikely === i ? 700 : 400}>
                    {(computed.mostLikely[i] ?? 0).toFixed(3)}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          <Divider my="sm" />
          <Text>
            Найкращі альтернативи: КОЗ —{' '}
            <b>
              {altNames[computed.bestIndexByCriterion.ev] ??
                `A${computed.bestIndexByCriterion.ev + 1}`}
            </b>
            ; Севіджа —{' '}
            <b>
              {altNames[computed.bestIndexByCriterion.savage] ??
                `A${computed.bestIndexByCriterion.savage + 1}`}
            </b>
            ; КОЗ–Дисперсія —{' '}
            <b>
              {altNames[computed.bestIndexByCriterion.meanVariance] ??
                `A${computed.bestIndexByCriterion.meanVariance + 1}`}
            </b>
            ; Граничний рівень (очікуваний дефіцит/надлишок) —{' '}
            <b>
              {altNames[computed.bestIndexByCriterion.threshold] ??
                `A${computed.bestIndexByCriterion.threshold + 1}`}
            </b>
            ; Найвірогідніший стан —{' '}
            <b>
              {altNames[computed.bestIndexByCriterion.mostLikely] ??
                `A${computed.bestIndexByCriterion.mostLikely + 1}`}
            </b>
            .
          </Text>
        </Paper>
      )}
    </Stack>
  );
}
