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
  Divider,
  Alert,
  Tooltip,
  TextInput,
  List,
} from '@mantine/core';

type Matrix = number[][];

type AhpResults = {
  criteriaWeights: number[];
  criteriaConsistency: { lambda: number; ci: number; cr: number };
  alternativeWeightsByCriterion: number[][];
  altConsistency: Array<{ lambda: number; ci: number; cr: number }>;
  combinedAlternativeWeights: number[];
  bestIndex: number;
};

function createMatrix(size: number, fill = 1): Matrix {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => fill));
}

function cloneMatrix(m: Matrix): Matrix {
  return m.map((r) => r.slice());
}

function resizePairwiseMatrix(prev: Matrix, size: number): Matrix {
  // Keep reciprocity and ones on diagonal
  const next: Matrix = createMatrix(size, 1);
  for (let i = 0; i < Math.min(size, prev.length); i += 1) {
    for (let j = 0; j < Math.min(size, prev[0]?.length ?? 0); j += 1) {
      const rowI = next[i]!;
      rowI[j] = i === j ? 1 : (prev[i]?.[j] ?? 1);
    }
  }
  // Enforce strict reciprocity
  for (let i = 0; i < size; i += 1) {
    for (let j = 0; j < size; j += 1) {
      if (i === j) {
        const rowI = next[i]!;
        rowI[j] = 1;
      } else {
        const v = next[i]?.[j] ?? 1;
        const rowJ = next[j]!;
        rowJ[i] = v !== 0 ? 1 / v : 0;
      }
    }
  }
  return next;
}

function normalizeColumnMethodWeights(a: Matrix): number[] {
  const n = a.length;
  if (n === 0) return [];
  const colSums: number[] = Array.from({ length: n }, (_, j) =>
    a.reduce((acc, row) => acc + (row[j] ?? 0), 0),
  );
  const normalized: Matrix = a.map((row) =>
    row.map((v, j) => (colSums[j] && colSums[j] !== 0 ? v / colSums[j] : 0)),
  );
  const weights: number[] = normalized.map((row) => row.reduce((acc, v) => acc + v, 0) / n);
  // Normalize to sum 1
  const sum = weights.reduce((acc, v) => acc + (isFinite(v) ? v : 0), 0);
  if (sum > 0) {
    return weights.map((w) => w / sum);
  }
  return Array.from({ length: n }, () => 1 / n);
}

function matVec(a: Matrix, v: number[]): number[] {
  return a.map((row) => row.reduce((acc, val, j) => acc + val * (v[j] ?? 0), 0));
}

function calcConsistency(a: Matrix, w: number[]): { lambda: number; ci: number; cr: number } {
  const n = a.length;
  if (n <= 1) return { lambda: n, ci: 0, cr: 0 };
  const aw = matVec(a, w);
  // Average of (Aw)_i / w_i
  let lambda = 0;
  for (let i = 0; i < n; i += 1) {
    const wi = w[i] ?? 1;
    lambda += wi > 0 ? (aw[i] ?? 0) / wi : 0;
  }
  lambda /= n;
  const ci = (lambda - n) / (n - 1);
  const RI: Record<number, number> = {
    1: 0,
    2: 0,
    3: 0.58,
    4: 0.9,
    5: 1.12,
    6: 1.24,
    7: 1.32,
    8: 1.41,
    9: 1.45,
    10: 1.49,
  };
  const ri = RI[n] ?? 1.49;
  const cr = ri > 0 ? ci / ri : 0;
  return { lambda, ci, cr };
}

function computeAhp(criteriaMatrix: Matrix, altMatrices: Matrix[]): AhpResults {
  const criteriaWeights = normalizeColumnMethodWeights(criteriaMatrix);
  const criteriaConsistency = calcConsistency(criteriaMatrix, criteriaWeights);

  const alternativeWeightsByCriterion = altMatrices.map((m) => normalizeColumnMethodWeights(m));
  const altConsistency = altMatrices.map((m, idx) =>
    calcConsistency(m, alternativeWeightsByCriterion[idx] ?? []),
  );

  const m = altMatrices[0]?.length ?? 0;
  const combinedAlternativeWeights: number[] = Array.from({ length: m }, () => 0);
  for (let k = 0; k < alternativeWeightsByCriterion.length; k += 1) {
    const cw = criteriaWeights[k] ?? 0;
    const wAlt = alternativeWeightsByCriterion[k] ?? [];
    for (let i = 0; i < m; i += 1) {
      combinedAlternativeWeights[i] = (combinedAlternativeWeights[i] ?? 0) + cw * (wAlt[i] ?? 0);
    }
  }
  // Normalize combined to sum 1
  const sumCombined = combinedAlternativeWeights.reduce((acc, v) => acc + v, 0);
  if (sumCombined > 0) {
    for (let i = 0; i < combinedAlternativeWeights.length; i += 1) {
      const cur = combinedAlternativeWeights[i] ?? 0;
      combinedAlternativeWeights[i] = cur / sumCombined;
    }
  }
  // Best index by max
  let bestIndex = 0;
  for (let i = 1; i < combinedAlternativeWeights.length; i += 1) {
    const current = combinedAlternativeWeights[i] ?? Number.NEGATIVE_INFINITY;
    const bestVal = combinedAlternativeWeights[bestIndex] ?? Number.NEGATIVE_INFINITY;
    if (current > bestVal) bestIndex = i;
  }

  return {
    criteriaWeights,
    criteriaConsistency,
    alternativeWeightsByCriterion,
    altConsistency,
    combinedAlternativeWeights,
    bestIndex,
  };
}

export default function TprLab4(): ReactElement {
  const [numCriteria, setNumCriteria] = useState<number>(3);
  const [numAlt, setNumAlt] = useState<number>(3);

  const [criteriaNames, setCriteriaNames] = useState<string[]>(['C1', 'C2', 'C3']);
  const [altNames, setAltNames] = useState<string[]>(['A1', 'A2', 'A3']);

  const [criteriaMatrix, setCriteriaMatrix] = useState<Matrix>(() => createMatrix(3, 1));
  const [altMatrices, setAltMatrices] = useState<Matrix[]>(() =>
    Array.from({ length: 3 }, () => createMatrix(3, 1)),
  );

  const [computed, setComputed] = useState<AhpResults | null>(null);

  const syncDimensions = (criteria: number, alts: number) => {
    setCriteriaMatrix((prev) => resizePairwiseMatrix(prev, criteria));
    setAltMatrices((prev) => {
      const next = prev.slice(0, criteria).map((m) => resizePairwiseMatrix(m, alts));
      while (next.length < criteria) next.push(createMatrix(alts, 1));
      return next;
    });
    setCriteriaNames((prev) => {
      const next = prev.slice(0, criteria);
      while (next.length < criteria) next.push(`C${next.length + 1}`);
      return next;
    });
    setAltNames((prev) => {
      const next = prev.slice(0, alts);
      while (next.length < alts) next.push(`A${next.length + 1}`);
      return next;
    });
  };

  const isConsistent = useMemo(() => {
    if (!computed) return true;
    const okCriteria = computed.criteriaConsistency.cr < 0.1;
    const okAlts = computed.altConsistency.every((c) => c.cr < 0.1);
    return okCriteria && okAlts;
  }, [computed]);

  const setCriteriaCell = (i: number, j: number, value: number) => {
    setCriteriaMatrix((prev) => {
      const next = cloneMatrix(prev);
      const n = next.length;
      if (i === j) {
        const rowI = next[i]!;
        rowI[j] = 1;
      } else {
        const v = Number.isFinite(value) && value > 0 ? value : 1;
        const rowI = next[i]!;
        rowI[j] = v;
        const rowJ = next[j]!;
        rowJ[i] = v !== 0 ? 1 / v : 0;
      }
      // Ensure diagonal ones
      for (let k = 0; k < n; k += 1) next[k]![k] = 1;
      return next;
    });
  };

  const setAltCell = (k: number, i: number, j: number, value: number) => {
    setAltMatrices((prev) => {
      const next = prev.map((m) => cloneMatrix(m));
      const mat = next[k];
      if (!mat) return prev;
      const n = mat.length;
      if (i === j) {
        const rowI = mat[i]!;
        rowI[j] = 1;
      } else {
        const v = Number.isFinite(value) && value > 0 ? value : 1;
        const rowI = mat[i]!;
        rowI[j] = v;
        const rowJ = mat[j]!;
        rowJ[i] = v !== 0 ? 1 / v : 0;
      }
      for (let t = 0; t < n; t += 1) mat[t]![t] = 1;
      return next;
    });
  };

  const runCompute = () => {
    setComputed(computeAhp(criteriaMatrix, altMatrices));
  };

  return (
    <Stack gap="md">
      <Title order={3}>ЛР №4. Використання методу аналізу ієрархій (МАІ)</Title>
      <Stack gap="xs">
        <Text size="md">
          <b>Мета:</b> сформувати навички застосування методу аналізу ієрархій для оцінки
          альтернатив за кількома критеріями та обчислення комплексного вагового коефіцієнта.
        </Text>
        <Divider my="sm" />
        <Title order={4} my="xs">
          Опис
        </Title>
        <Stack gap="xs">
          <Text>
            МАІ (AHP) використовує парні порівняння за шкалою 1…9 (і обернені значення 1/2…1/9), де
            1 — однакова важливість, 3 — помірна, 5 — суттєва, 7 — дуже сильна, 9 — абсолютна.
            Результатом є ваги критеріїв та ваги альтернатив за кожним критерієм, а також їх
            згортка.
          </Text>
          <Text>
            Для контролю узгодженості суджень обчислюється <b>CR</b> (коефіцієнт узгодженості). Якщо
            CR &lt; 0.1 — узгодженість вважається прийнятною.
          </Text>
        </Stack>
      </Stack>

      <Divider my="sm" />
      <Title order={4} my="xs">
        Приклад з реального життя
      </Title>
      <Stack gap="xs">
        <Text>
          Агроном обирає гібрид кукурудзи для посіву. <b>Варіанти</b>: ранньостиглий,
          середньостиглий та пізньостиглий гібрид. <b>Що важливо</b>: скільки врожаю дає в
          середньому, наскільки стабільний врожай за різної погоди, як переносить посуху
          (водоефективність), чи «чіпляє» хвороби, скільки коштує насіння і яка загальна очікувана
          вигода.
        </Text>
        <Text>
          Метод МАІ допомагає <b>розкласти вибір на прості запитання</b>. Спочатку порівнюємо{' '}
          <b>критерії</b> попарно «що важливіше для нашого поля — стабільність чи максимальна
          врожайність? і наскільки?». Інструмент сам перетворить відповіді у «ваги» важливості та
          підкаже, чи відповіді не суперечливі між собою.
        </Text>
        <Text>
          Потім так само попарно порівнюємо <b>гібриди</b> у межах кожного критерію. Наприклад:
          посухостійкістю пізньостиглий трохи кращий за середньостиглий, середньостиглий кращий за
          ранній. Інструмент розрахує «оцінку» кожного гібриду за критерієм і знов перевірить
          узгодженість.
        </Text>
        <Text>
          Далі відбувається <b>зведення результатів</b>: оцінки гібридів «змішуються» з важливістю
          критеріїв і ми отримуємо загальний рейтинг. Гібрид з найбільшим підсумковим балом —
          найкращий з урахуванням ваших пріоритетів.
        </Text>
        <Text fw={500}>Як користуватися:</Text>
        <List withPadding spacing="xs">
          <List.Item>Задайте назви критеріїв і гібридів.</List.Item>
          <List.Item>Відповідайте на прості порівняння критеріїв.</List.Item>
          <List.Item>Порівняйте гібриди за кожним критерієм.</List.Item>
          <List.Item>
            Натисніть «Обчислити». Ви побачите ваги, перевірку узгодженості та рекомендацію.
          </List.Item>
        </List>
      </Stack>

      <Divider my="sm" />
      <Title order={4} my="xs">
        Імплементація
      </Title>

      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Group grow>
            <NumberInput
              label="Кількість критеріїв"
              min={1}
              value={numCriteria}
              onChange={(v) => {
                const n = Number(v) || 1;
                setNumCriteria(n);
                syncDimensions(n, numAlt);
              }}
            />
            <NumberInput
              label="Кількість альтернатив"
              min={2}
              value={numAlt}
              onChange={(v) => {
                const n = Number(v) || 2;
                setNumAlt(n);
                syncDimensions(numCriteria, n);
              }}
            />
          </Group>

          <Divider label="Назви критеріїв і альтернатив" />
          <Group align="flex-start" grow>
            <Stack gap={6}>
              <Text fw={500}>Критерії</Text>
              {Array.from({ length: numCriteria }).map((_, i) => (
                <TextInput
                  key={i}
                  value={criteriaNames[i] ?? ''}
                  onChange={(e) => {
                    const next = criteriaNames.slice();
                    next[i] = e.currentTarget.value;
                    setCriteriaNames(next);
                  }}
                />
              ))}
            </Stack>
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
          </Group>

          <Divider label="Парні порівняння критеріїв" />
          <Table withTableBorder withColumnBorders stickyHeader>
            <Table.Thead>
              <Table.Tr>
                <Table.Th />
                {Array.from({ length: numCriteria }).map((_, j) => (
                  <Table.Th key={j}>{criteriaNames[j] ?? `C${j + 1}`}</Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {Array.from({ length: numCriteria }).map((_, i) => (
                <Table.Tr key={i}>
                  <Table.Td fw={600}>{criteriaNames[i] ?? `C${i + 1}`}</Table.Td>
                  {Array.from({ length: numCriteria }).map((_, j) => (
                    <Table.Td key={j}>
                      <NumberInput
                        value={criteriaMatrix[i]?.[j] ?? 1}
                        onChange={(v) => {
                          const num =
                            typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : 1;
                          setCriteriaCell(i, j, Number.isFinite(num) ? num : 1);
                        }}
                        min={1 / 9}
                        max={9}
                        step={0.1}
                        disabled={i === j}
                      />
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          <Text size="sm" c="dimmed">
            Значення на діагоналі фіксовано рівними 1; взаємні елементи підтримуються як обернені.
          </Text>

          <Divider label="Парні порівняння альтернатив за кожним критерієм" />
          {Array.from({ length: numCriteria }).map((_, k) => (
            <Paper key={k} p="sm" withBorder>
              <Group justify="space-between" mb="xs">
                <Text fw={600}>Критерій: {criteriaNames[k] ?? `C${k + 1}`}</Text>
                <Tooltip
                  label="Шкала 1…9 (та 1/2…1/9): наскільки альтернатива по рядку важливіша за альтернативу по стовпцю."
                  withArrow
                >
                  <Text size="sm" c="dimmed" style={{ cursor: 'help' }}>
                    ?
                  </Text>
                </Tooltip>
              </Group>
              <Table withTableBorder withColumnBorders stickyHeader>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th />
                    {Array.from({ length: numAlt }).map((_, j) => (
                      <Table.Th key={j}>{altNames[j] ?? `A${j + 1}`}</Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {Array.from({ length: numAlt }).map((_, i) => (
                    <Table.Tr key={i}>
                      <Table.Td fw={600}>{altNames[i] ?? `A${i + 1}`}</Table.Td>
                      {Array.from({ length: numAlt }).map((_, j) => (
                        <Table.Td key={j}>
                          <NumberInput
                            value={altMatrices[k]?.[i]?.[j] ?? 1}
                            onChange={(v) => {
                              const num =
                                typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : 1;
                              setAltCell(k, i, j, Number.isFinite(num) ? num : 1);
                            }}
                            min={1 / 9}
                            max={9}
                            step={0.1}
                            disabled={i === j}
                          />
                        </Table.Td>
                      ))}
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
              {computed && (
                <Text size="sm" c="dimmed" mt="xs">
                  Узгодженість (CR) для критерію {criteriaNames[k] ?? `C${k + 1}`}:{' '}
                  {(computed.altConsistency[k]?.cr ?? 0).toFixed(3)}
                </Text>
              )}
            </Paper>
          ))}

          <Group>
            <Button onClick={runCompute}>Обчислити</Button>
          </Group>
        </Stack>
      </Paper>

      {computed && (
        <Paper p="md" withBorder>
          <Title order={4} mb="sm">
            Результати
          </Title>
          <Stack gap="sm">
            <Text size="sm" c="dimmed">
              Узгодженість критеріїв: λ<sub>max</sub> ={' '}
              {computed.criteriaConsistency.lambda.toFixed(3)}; CI ={' '}
              {computed.criteriaConsistency.ci.toFixed(3)}; CR ={' '}
              {computed.criteriaConsistency.cr.toFixed(3)}
            </Text>
            {computed.criteriaConsistency.cr >= 0.1 && (
              <Alert color="yellow" title="Попередження">
                Коефіцієнт узгодженості CR для матриці критеріїв перевищує 0.1. Рекомендується
                переглянути парні порівняння.
              </Alert>
            )}
            {!isConsistent && (
              <Alert color="yellow" title="Попередження">
                Для деяких матриць альтернатив CR ≥ 0.1. Перевірте узгодженість суджень.
              </Alert>
            )}

            <Divider label="Ваги критеріїв" />
            <Table withTableBorder withColumnBorders stickyHeader>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Критерій</Table.Th>
                  <Table.Th>Вага</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {computed.criteriaWeights.map((w, i) => (
                  <Table.Tr key={i}>
                    <Table.Td>{criteriaNames[i] ?? `C${i + 1}`}</Table.Td>
                    <Table.Td>{w.toFixed(4)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            <Divider label="Ваги альтернатив за критеріями" />
            {computed.alternativeWeightsByCriterion.map((weights, k) => (
              <Paper key={k} p="sm" withBorder>
                <Text fw={600} mb="xs">
                  Критерій: {criteriaNames[k] ?? `C${k + 1}`}
                </Text>
                <Table withTableBorder withColumnBorders stickyHeader>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Альтернатива</Table.Th>
                      <Table.Th>Вага</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {weights.map((w, i) => (
                      <Table.Tr key={i}>
                        <Table.Td>{altNames[i] ?? `A${i + 1}`}</Table.Td>
                        <Table.Td>{w.toFixed(4)}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
                <Text size="sm" c="dimmed" mt="xs">
                  CR: {(computed.altConsistency[k]?.cr ?? 0).toFixed(3)}
                </Text>
              </Paper>
            ))}

            <Divider label="Згортка: комплексні ваги альтернатив" />
            <Table withTableBorder withColumnBorders stickyHeader>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Альтернатива</Table.Th>
                  <Table.Th>Комплексна вага</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {computed.combinedAlternativeWeights.map((w, i) => (
                  <Table.Tr key={i}>
                    <Table.Td>{altNames[i] ?? `A${i + 1}`}</Table.Td>
                    <Table.Td fw={computed.bestIndex === i ? 700 : 400}>{w.toFixed(4)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            <Text>
              Найкраща альтернатива:{' '}
              <b>{altNames[computed.bestIndex] ?? `A${computed.bestIndex + 1}`}</b>
            </Text>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}
