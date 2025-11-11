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
  Checkbox,
  List,
} from '@mantine/core';

type CriteriaKey = 'I' | 'C' | 'P' | 'N';

type ExpertWeights = Record<CriteriaKey, number>;

type PriorityResults = {
  criteriaOrder: CriteriaKey[];
  normalizedEigenvector: Record<CriteriaKey, number>;
  adjacencyMatrix: number[][];
  rowSums: number[];
  averageExpertWeights: Record<CriteriaKey, number>;
};

function buildSingleExpertAdjacency(weights: ExpertWeights): number[][] {
  const keys: CriteriaKey[] = ['I', 'C', 'P', 'N'];
  const m = keys.length;
  const a: number[][] = Array.from({ length: m }, () => Array.from({ length: m }, () => 0));
  for (let i = 0; i < m; i += 1) {
    for (let j = 0; j < m; j += 1) {
      if (i === j) {
        a[i]![j] = 1;
      } else {
        const wi = weights[keys[i]!] ?? 0;
        const wj = weights[keys[j]!] ?? 0;
        a[i]![j] = wi > wj ? 2 : wi === wj ? 1 : 0;
      }
    }
  }
  return a;
}

function sumMatrices(mats: number[][][]): number[][] {
  if (mats.length === 0) return [];
  const n = mats[0]?.length ?? 0;
  const res: number[][] = Array.from({ length: n }, () => Array.from({ length: n }, () => 0));
  for (let k = 0; k < mats.length; k += 1) {
    const a = mats[k]!;
    for (let i = 0; i < n; i += 1) {
      for (let j = 0; j < n; j += 1) {
        const sum = (res[i]?.[j] ?? 0) + (a[i]?.[j] ?? 0);
        const row = res[i]!;
        row[j] = sum;
      }
    }
  }
  return res;
}

function multiplyMatrixVector(a: number[][], v: number[]): number[] {
  return a.map((row) => row.reduce((acc, val, j) => acc + val * (v[j] ?? 0), 0));
}

function normalizeVectorToSum(v: number[]): number[] {
  const sum = v.reduce((acc, x) => acc + (Number.isFinite(x) ? x : 0), 0);
  return sum > 0
    ? v.map((x) => (Number.isFinite(x) ? x / sum : 0))
    : Array.from({ length: v.length }, () => 0);
}

function vectorsClose(a: number[], b: number[], eps = 1e-9): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (Math.abs(a[i]! - b[i]!) > eps) return false;
  }
  return true;
}

function computePriority(experts: ExpertWeights[]): PriorityResults {
  const keys: CriteriaKey[] = ['I', 'C', 'P', 'N'];
  const singleAdj: number[][][] = experts.map(buildSingleExpertAdjacency);
  const adjacency: number[][] = sumMatrices(singleAdj);

  const rowSums: number[] = adjacency.map((row) => row.reduce((acc, val) => acc + val, 0));

  let current: number[] = Array.from({ length: keys.length }, () => 1);
  let currentNorm: number[] = normalizeVectorToSum(current);
  for (let iter = 0; iter < 1000; iter += 1) {
    const next = multiplyMatrixVector(adjacency, current);
    const nextNorm = normalizeVectorToSum(next);
    if (vectorsClose(nextNorm, currentNorm, 1e-12)) {
      current = next;
      currentNorm = nextNorm;
      break;
    }
    current = next;
    currentNorm = nextNorm;
  }

  const normalizedEigenvector: Record<CriteriaKey, number> = {
    I: currentNorm[0] ?? 0,
    C: currentNorm[1] ?? 0,
    P: currentNorm[2] ?? 0,
    N: currentNorm[3] ?? 0,
  };

  const criteriaOrder = keys
    .slice()
    .sort((a, b) => (normalizedEigenvector[b] ?? 0) - (normalizedEigenvector[a] ?? 0));

  const averageExpertWeights: Record<CriteriaKey, number> = keys.reduce(
    (acc, key) => {
      const avg = experts.reduce((sum, e) => sum + (e[key] ?? 0), 0) / (experts.length || 1);
      acc[key] = avg;
      return acc;
    },
    {} as Record<CriteriaKey, number>,
  );

  return {
    criteriaOrder,
    normalizedEigenvector,
    adjacencyMatrix: adjacency,
    rowSums,
    averageExpertWeights,
  };
}

export default function TprLab6(): ReactElement {
  const [experts, setExperts] = useState<ExpertWeights[]>([
    // Варіант 6 з методички (табл. 2), перетворений у десяткові значення:
    { I: 0.15, C: 0.3, P: 0.2, N: 0.35 }, // Експерт 1
    { I: 0.3, C: 0.2, P: 0.2, N: 0.3 }, // Експерт 2
    { I: 0.25, C: 0.25, P: 0.35, N: 0.15 }, // Експерт 3
    { I: 0.3, C: 0.3, P: 0.2, N: 0.2 }, // Експерт 4
  ]);
  const [includeSelfDiagonalAsExpertsCount, setIncludeSelfDiagonalAsExpertsCount] =
    useState<boolean>(true);

  const adjustedExperts = useMemo(() => {
    // Нормалізуємо вектори експертів до суми 1 на випадок редагування
    return experts.map((e) => {
      const sum = (e.I ?? 0) + (e.C ?? 0) + (e.P ?? 0) + (e.N ?? 0);
      if (sum <= 0) return { I: 0.25, C: 0.25, P: 0.25, N: 0.25 };
      return {
        I: (e.I ?? 0) / sum,
        C: (e.C ?? 0) / sum,
        P: (e.P ?? 0) / sum,
        N: (e.N ?? 0) / sum,
      };
    });
  }, [experts]);

  const [computed, setComputed] = useState<PriorityResults | null>(null);

  const hasInvalidSums = useMemo(() => {
    return adjustedExperts.some((e) => Math.abs(e.I + e.C + e.P + e.N - 1) > 1e-9);
  }, [adjustedExperts]);

  const runCompute = () => {
    const result = computePriority(adjustedExperts);
    // За методикою діагональ одинична для кожного експерта. Якщо потрібно — можна привести до константи 1.
    if (!includeSelfDiagonalAsExpertsCount && result.adjacencyMatrix.length === 4) {
      // Замінюємо діагональні елементи на 1 (а не "кількість експертів")
      for (let i = 0; i < 4; i += 1) {
        result.adjacencyMatrix[i]![i] = 1;
      }
    }
    setComputed(result);
  };

  const lab5DefaultWeights: Record<CriteriaKey, number> = {
    // З ЛР5 (після відкидання K і нормалізації): [0.25, 0.25, 0.3125, 0.1875]
    C: 0.25,
    I: 0.25,
    P: 0.3125,
    N: 0.1875,
  };

  return (
    <Stack gap="md">
      <Title order={3}>ЛР №6. Метод розстановки пріоритетів</Title>
      <Stack gap="xs">
        <Text size="md">
          <b>Мета:</b> визначити коефіцієнти значимості параметрів задачі ЛР5 (C — вартість, I —
          струм, P — надійність, N — потужність) за результатами експертних оцінок. Метод: побудова
          матриці суміжності (турнірних порівнянь) та обчислення ітерованої «сили» як власного
          вектора.
        </Text>
      </Stack>

      <Divider my="sm" />
      <Title order={4} my="xs">
        Опис
      </Title>
      <Stack gap="xs">
        <Text>
          Метод розстановки пріоритетів інтерпретує оцінювання як «турнір» між критеріями. Для
          кожного експерта формується матриця суміжності A. Елемент a_ij позначає результат парного
          порівняння критерію по рядку i відносно критерію по стовпцю j: 2 — якщо i «перемагає» j
          (більша вага), 1 — нічия (рівні ваги), 0 — поразка. Діагональні елементи дорівнюють 1.
        </Text>
        <Text>Агрегована матриця добувається підсумовуванням матриць усіх експертів.</Text>
        <Text>Вектор P(1) задається сумами рядків (первинні «сили»).</Text>
        <Text>Далі повторюється перетворення P(k)=A·P(k−1) з нормалізацією до суми 1.</Text>
        <Text>Процес збігається до власного вектора, що задає ваги критеріїв.</Text>
        <Text>Відсортований власний вектор дає порядок пріоритетів.</Text>
        <Text>
          У цій роботі розглядаємо чотири критерії із ЛР5: C — вартість (мінімізуємо), I — струм
          (мінімізуємо), P — надійність (максимізуємо), N — потужність (максимізуємо). Метод
          повертає їхні ваги для подальшого порівняння з використовуваними у ЛР5.
        </Text>
      </Stack>

      <Divider my="sm" />
      <Title order={4} my="xs">
        Приклад з реального життя
      </Title>
      <Stack gap="xs">
        <Text>Ситуація: агроном має вирішити, яке обладнання для зрошення придбати.</Text>
        <Text>Є кілька готових комплектів від різних виробників.</Text>
        <Text>
          Що важливо: скільки коштує, скільки «тягне» електрики, наскільки надійне і наскільки
          продуктивне.
        </Text>
        <Text fw={500}>Як застосувати метод:</Text>
        <List type="ordered" withPadding>
          <List.Item>Сформулюйте мету (що хочете отримати).</List.Item>
          <List.Item>Визначте критерії: C, I, P, N.</List.Item>
          <List.Item>Залучіть 3–5 фахівців (агроном, енергетик, механік, економіст).</List.Item>
          <List.Item>Нехай кожен розподілить 100% важливості між C, I, P, N.</List.Item>
          <List.Item>Внесіть значення в інструмент (сума в рядку буде 1).</List.Item>
          <List.Item>Натисніть «Обчислити» — отримаєте порядок пріоритетів.</List.Item>
          <List.Item>Зрозумійте, що важливіше саме для вашого господарства.</List.Item>
          <List.Item>Обирайте варіант, що покриває найважливіші критерії.</List.Item>
        </List>
        <Text fw={500}>Поради по адаптації:</Text>
        <List withPadding>
          <List.Item>Дорога електрика? Підвищіть важливість I.</List.Item>
          <List.Item>Часті поломки? Підвищіть важливість P.</List.Item>
          <List.Item>Малий бюджет? Підвищіть важливість C.</List.Item>
          <List.Item>Мало подачі води? Підвищіть важливість N.</List.Item>
        </List>
      </Stack>

      <Divider my="sm" />
      <Title order={4} my="xs">
        Вхідні дані (ваги експертів, сума в рядку = 1)
      </Title>
      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Table withTableBorder withColumnBorders stickyHeader striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Експерт</Table.Th>
                <Table.Th>I (Струм)</Table.Th>
                <Table.Th>C (Вартість)</Table.Th>
                <Table.Th>P (Надійність)</Table.Th>
                <Table.Th>N (Потужність)</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {experts.map((e, idx) => (
                <Table.Tr key={idx}>
                  <Table.Td>Експерт {idx + 1}</Table.Td>
                  <Table.Td>
                    <NumberInput
                      value={e.I}
                      min={0}
                      max={1}
                      step={0.01}
                      onChange={(v) => {
                        const num =
                          typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : 0;
                        const next = experts.slice();
                        next[idx] = {
                          ...next[idx]!,
                          I: Number.isFinite(num) ? num : 0,
                          C: e.C,
                          P: e.P,
                          N: e.N,
                        };
                        setExperts(next);
                      }}
                    />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput
                      value={e.C}
                      min={0}
                      max={1}
                      step={0.01}
                      onChange={(v) => {
                        const num =
                          typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : 0;
                        const next = experts.slice();
                        next[idx] = {
                          ...next[idx]!,
                          I: e.I,
                          C: Number.isFinite(num) ? num : 0,
                          P: e.P,
                          N: e.N,
                        };
                        setExperts(next);
                      }}
                    />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput
                      value={e.P}
                      min={0}
                      max={1}
                      step={0.01}
                      onChange={(v) => {
                        const num =
                          typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : 0;
                        const next = experts.slice();
                        next[idx] = {
                          ...next[idx]!,
                          I: e.I,
                          C: e.C,
                          P: Number.isFinite(num) ? num : 0,
                          N: e.N,
                        };
                        setExperts(next);
                      }}
                    />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput
                      value={e.N}
                      min={0}
                      max={1}
                      step={0.01}
                      onChange={(v) => {
                        const num =
                          typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : 0;
                        const next = experts.slice();
                        next[idx] = {
                          ...next[idx]!,
                          I: e.I,
                          C: e.C,
                          P: e.P,
                          N: Number.isFinite(num) ? num : 0,
                        };
                        setExperts(next);
                      }}
                    />
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          {hasInvalidSums && (
            <Alert color="red" title="Попередження">
              Кожен рядок нормалізується до суми 1 перед розрахунком.
            </Alert>
          )}

          <Group justify="space-between">
            <Checkbox
              checked={includeSelfDiagonalAsExpertsCount}
              onChange={(e) => setIncludeSelfDiagonalAsExpertsCount(e.currentTarget.checked)}
              label="Діагональ Aii = кількість експертів (рекомендовано)"
            />
            <Button onClick={runCompute}>Обчислити</Button>
          </Group>
        </Stack>
      </Paper>

      {computed && (
        <Paper p="md" withBorder>
          <Title order={4} mb="sm">
            Результати
          </Title>

          <Divider label="Матриця суміжності (агрегація за експертами)" my="sm" />
          <Table withTableBorder withColumnBorders stickyHeader>
            <Table.Thead>
              <Table.Tr>
                <Table.Th />
                <Table.Th>I</Table.Th>
                <Table.Th>C</Table.Th>
                <Table.Th>P</Table.Th>
                <Table.Th>N</Table.Th>
                <Table.Th>Σ рядка (P(1))</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {['I', 'C', 'P', 'N'].map((rowKey, i) => (
                <Table.Tr key={rowKey}>
                  <Table.Td fw={600}>{rowKey}</Table.Td>
                  {computed.adjacencyMatrix[i]?.map((val, j) => (
                    <Table.Td key={`${i}-${j}`}>{val}</Table.Td>
                  ))}
                  <Table.Td fw={700}>{computed.rowSums[i]}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          <Divider my="sm" />
          <Stack gap={6}>
            <Text size="sm" c="dimmed">
              Нормований власний вектор (ваги, сума = 1):
            </Text>
            <Table withTableBorder withColumnBorders stickyHeader>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Критерій</Table.Th>
                  <Table.Th>Вага (власний вектор)</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {(['I', 'C', 'P', 'N'] as CriteriaKey[]).map((k) => (
                  <Table.Tr key={k}>
                    <Table.Td>
                      {k}{' '}
                      {k === 'C'
                        ? '(Вартість)'
                        : k === 'I'
                          ? '(Струм)'
                          : k === 'P'
                            ? '(Надійність)'
                            : '(Потужність)'}
                    </Table.Td>
                    <Table.Td>{(computed.normalizedEigenvector[k] ?? 0).toFixed(4)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            <Text>
              Порядок пріоритетів: <b>{computed.criteriaOrder.join(' > ')}</b>
            </Text>
          </Stack>

          <Divider label="Порівняння з середніми вагами експертів та вагами ЛР5" my="sm" />
          <Table withTableBorder withColumnBorders stickyHeader>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Критерій</Table.Th>
                <Table.Th>Середня експертна вага</Table.Th>
                <Table.Th>ЛР6 (власний вектор)</Table.Th>
                <Table.Th>ЛР5 (за замовчуванням)</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(['I', 'C', 'P', 'N'] as CriteriaKey[]).map((k) => (
                <Table.Tr key={k}>
                  <Table.Td>
                    {k}{' '}
                    {k === 'C'
                      ? '(Вартість)'
                      : k === 'I'
                        ? '(Струм)'
                        : k === 'P'
                          ? '(Надійність)'
                          : '(Потужність)'}
                  </Table.Td>
                  <Table.Td>{(computed.averageExpertWeights[k] ?? 0).toFixed(4)}</Table.Td>
                  <Table.Td>{(computed.normalizedEigenvector[k] ?? 0).toFixed(4)}</Table.Td>
                  <Table.Td>{(lab5DefaultWeights[k] ?? 0).toFixed(4)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}
    </Stack>
  );
}
