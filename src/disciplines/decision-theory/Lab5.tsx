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
  TextInput,
  Alert,
  Slider,
  List,
} from '@mantine/core';

type Row = {
  name: string;
  cost: number; // вартість, у.о.
  current: number; // I, мА
  power: number; // N, Вт
  lambda: number; // інтенсивність відмов, год^-1
};

type Computed = {
  rows: Array<
    Row & {
      reliability: number; // P_i(t)
      eReliability: number; // P_i(t)/C_i
      ePower: number; // N_i/C_i
      sMin: number; // зважена сума мінімізованих критеріїв
      sMax: number; // зважена сума максимізованих критеріїв
      efficiency: number; // E_i = sMax / sMin
    }
  >;
  bestIndex: number;
  normalized: {
    // нормовані значення для прозорості
    cost: number[];
    current: number[];
    reliability: number[];
    power: number[];
  };
};

function normalizeForMin(values: number[]): number[] {
  if (values.length === 0) return [];
  const min = Math.min(...values.map((v) => (isFinite(v) ? v : Number.POSITIVE_INFINITY)));
  return values.map((v) => {
    const safe = isFinite(v) && v > 0 ? v : Number.POSITIVE_INFINITY;
    return Math.min(1, Math.max(0, min / safe));
  });
}

function normalizeForMax(values: number[]): number[] {
  if (values.length === 0) return [];
  const max = Math.max(...values.map((v) => (isFinite(v) ? v : 0)));
  return max <= 0
    ? values.map(() => 0)
    : values.map((v) => Math.min(1, Math.max(0, (isFinite(v) ? v : 0) / max)));
}

function normalizeWeights(weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + (isFinite(b) ? b : 0), 0);
  if (sum <= 0) return Array.from({ length: weights.length }, () => 1 / weights.length);
  return weights.map((w) => (isFinite(w) ? w / sum : 0));
}

export default function TprLab5(): ReactElement {
  const [missionTimeH, setMissionTimeH] = useState<number>(10000);

  // Ваги критеріїв: [вартість, струм, надійність, потужність]
  // За замовчуванням — перерозподіл прикладу з методички без коеф. гармонік:
  // було [0.2, 0.2, 0.25, 0.15] → нормалізуємо до суми 1: [0.25, 0.25, 0.3125, 0.1875]
  const [weights, setWeights] = useState<number[]>([0.25, 0.25, 0.3125, 0.1875]);

  // Дані трьох варіантів (ІМС): варіант 6 з таблиці 8
  const [rows, setRows] = useState<Row[]>([
    { name: 'К174УН5', cost: 3.12, current: 28.7, power: 1.76, lambda: 1e-7 },
    { name: 'К174УН8', cost: 3.1, current: 15.0, power: 2.0, lambda: 1e-7 },
    { name: 'К174УН4', cost: 3.11, current: 9.18, power: 1.36, lambda: 1e-7 },
  ]);

  const probWeights = useMemo(() => normalizeWeights(weights), [weights]);

  const [computed, setComputed] = useState<Computed | null>(null);

  const probSumValid = Math.abs(probWeights.reduce((a, b) => a + b, 0) - 1) < 1e-9;

  const runCompute = () => {
    const t = Math.max(0, missionTimeH);

    const reliability = rows.map((r) => Math.exp(-(isFinite(r.lambda) ? r.lambda : 0) * t));
    const eReliability = rows.map((_, i) => (reliability[i] ?? 0) / (rows[i]?.cost ?? 1));
    const ePower = rows.map((r) => (isFinite(r.cost) && r.cost > 0 ? r.power / r.cost : 0));

    // Формуємо стовпці для нормування
    const colCost = rows.map((r) => r.cost);
    const colCurrent = rows.map((r) => r.current);
    const colReliability = eReliability; // максимізується
    const colPower = ePower; // максимізується

    const normCost = normalizeForMin(colCost);
    const normCurrent = normalizeForMin(colCurrent);
    const normReliability = normalizeForMax(colReliability);
    const normPower = normalizeForMax(colPower);

    const wCost = probWeights[0] ?? 0;
    const wCurrent = probWeights[1] ?? 0;
    const wReliability = probWeights[2] ?? 0;
    const wPower = probWeights[3] ?? 0;

    const resultRows = rows.map((r, i) => {
      const sMin = wCost * (normCost[i] ?? 0) + wCurrent * (normCurrent[i] ?? 0);
      const sMax = wReliability * (normReliability[i] ?? 0) + wPower * (normPower[i] ?? 0);
      const efficiency = sMin <= 0 ? 0 : sMax / sMin;
      return {
        ...r,
        reliability: reliability[i] ?? 0,
        eReliability: eReliability[i] ?? 0,
        ePower: ePower[i] ?? 0,
        sMin,
        sMax,
        efficiency,
      };
    });

    let bestIndex = 0;
    let bestVal = resultRows[0]?.efficiency ?? 0;
    for (let i = 1; i < resultRows.length; i += 1) {
      const cand = resultRows[i]?.efficiency ?? 0;
      if (cand > bestVal) {
        bestVal = cand;
        bestIndex = i;
      }
    }

    setComputed({
      rows: resultRows,
      bestIndex,
      normalized: {
        cost: normCost,
        current: normCurrent,
        reliability: normReliability,
        power: normPower,
      },
    });
  };

  return (
    <Stack gap="md">
      <Title order={3}>ЛР №5. Використання теорії ігор для вибору елементної бази</Title>
      <Stack gap="xs">
        <Text size="md">
          <b>Мета:</b> оптимізація вибору ІМС підсилювача потужності за конфліктними групами
          критеріїв із застосуванням ігрового підходу (нормування стовпців, зважування, інтегральний
          показник E).
        </Text>
        <Divider my="sm" />
        <Title order={4} my="xs">
          Опис
        </Title>
        <Stack gap="xs">
          <Text>
            Мінімізуємо: <b>вартість</b>, <b>струм живлення</b>. Максимізуємо: <b>надійність</b> та{' '}
            <b>вихідну потужність</b>. Для узгодження розмірностей застосовується нормування по
            стовпцях: для мінімізованих критеріїв використовується відношення min/значення, для
            максимізованих — значення/max. Після врахування ваг отримуємо згорнуті суми S
            <sub>min</sub> і S<sub>max</sub>, інтегральний показник <b>E = S</b>
            <sub>max</sub>/<b>S</b>
            <sub>min</sub>.
          </Text>
          <Text>
            Надійність оцінюється як <b>P(t)=exp(-λ·t)</b>; для критерію, що максимізується,
            використано відношення <b>P(t)/C</b>, а для потужності — <b>N/C</b> (ефективність
            відносно вартості).
          </Text>
        </Stack>
      </Stack>

      <Divider my="sm" />
      <Title order={4} my="xs">
        Приклад з реального життя
      </Title>
      <Stack gap="xs">
        <Text>
          Уявімо, що агроном планує оновити систему зрошення поля. Є три готові комплекти обладнання{' '}
          від різних виробників. Вони відрізняються <b>вартістю</b>,{' '}
          <b>споживанням електроенергії</b> (аналог нашого критерію «струм»),{' '}
          <b>надійністю протягом сезону</b> та <b>продуктивністю</b> — скільки води здатні подати за
          годину (аналог «потужності»).
        </Text>
        <Text>
          Цілі конфліктні: хочеться платити менше і споживати менше енергії, а також мати якомога
          надійнішу і продуктивнішу систему. Саме тут зручно мислити, ніби між двома «гравцями» йде
          гра: один «захищає» економію (мінімізує вартість і споживання), інший — якість та
          результат (максимізує надійність і продуктивність). Ми — «арбітр», який встановлює вагу
          кожній меті.
        </Text>
        <Text>Працюємо покроково:</Text>
        <List type="ordered" withPadding>
          <List.Item>Заносимо дані для трьох варіантів у таблицю.</List.Item>
          <List.Item>
            Щоб коректно порівнювати різні одиниці, нормуємо показники до шкали 0…1: для економії
            менше — краще; для якості більше — краще.
          </List.Item>
          <List.Item>Виставляємо ваги за важливістю цілей.</List.Item>
          <List.Item>Підсумовуємо «економію» у Smin і «якість» у Smax з урахуванням ваг.</List.Item>
          <List.Item>
            Обчислюємо E = Smax/Smin і обираємо варіант з найбільшим E — це найкращий компроміс між
            економією та результатом.
          </List.Item>
        </List>
        <Text>
          Перевага такого підходу в тому, що він прозорий: якщо агроном змінить пріоритети
          (наприклад, електрика дуже подорожчала — підвищуємо вагу «струму»), результат
          перераховується і показує інший найкращий варіант. Тобто рішення підлаштовується під
          реальні бізнес‑умови.
        </Text>
      </Stack>

      <Divider my="sm" />
      <Title order={4} my="xs">
        Вхідні дані
      </Title>
      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Group>
            <Text fw={500}>Місіонний час t, год</Text>
            <NumberInput
              value={missionTimeH}
              onChange={(v) => {
                const num = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : 0;
                setMissionTimeH(Number.isFinite(num) ? num : 0);
              }}
              step={100}
              min={0}
            />
          </Group>

          <Divider label="Ваги критеріїв (сума = 1)" />
          <Group align="center" gap="lg">
            <Stack gap={2} w={260}>
              <Text size="sm">Вага: Вартість</Text>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={weights[0] ?? 0}
                onChange={(val) =>
                  setWeights((prev) => [val, prev[1] ?? 0, prev[2] ?? 0, prev[3] ?? 0])
                }
              />
            </Stack>
            <Stack gap={2} w={260}>
              <Text size="sm">Вага: Струм</Text>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={weights[1] ?? 0}
                onChange={(val) =>
                  setWeights((prev) => [prev[0] ?? 0, val, prev[2] ?? 0, prev[3] ?? 0])
                }
              />
            </Stack>
            <Stack gap={2} w={260}>
              <Text size="sm">Вага: Надійність</Text>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={weights[2] ?? 0}
                onChange={(val) =>
                  setWeights((prev) => [prev[0] ?? 0, prev[1] ?? 0, val, prev[3] ?? 0])
                }
              />
            </Stack>
            <Stack gap={2} w={260}>
              <Text size="sm">Вага: Потужність</Text>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={weights[3] ?? 0}
                onChange={(val) =>
                  setWeights((prev) => [prev[0] ?? 0, prev[1] ?? 0, prev[2] ?? 0, val])
                }
              />
            </Stack>
          </Group>
          {!probSumValid && (
            <Alert color="red" title="Сума ваг після нормалізації автоматично дорівнює 1">
              Значення повзунків буде нормалізовано під час розрахунку.
            </Alert>
          )}

          <Divider label="Характеристики варіантів (за замовчуванням — варіант 6 з таблиці 8)" />
          <Table striped withTableBorder withColumnBorders stickyHeader>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Варіант</Table.Th>
                <Table.Th>Вартість, у.о.</Table.Th>
                <Table.Th>I, мА</Table.Th>
                <Table.Th>N, Вт</Table.Th>
                <Table.Th>λ, год⁻¹</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((r, i) => (
                <Table.Tr key={i}>
                  <Table.Td>
                    <TextInput
                      value={r.name}
                      onChange={(e) => {
                        const next = rows.slice();
                        next[i] = { ...next[i]!, name: e.currentTarget.value };
                        setRows(next);
                      }}
                    />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput
                      value={r.cost}
                      onChange={(v) => {
                        const num =
                          typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : 0;
                        const next = rows.slice();
                        next[i] = { ...next[i]!, cost: Number.isFinite(num) ? num : 0 };
                        setRows(next);
                      }}
                      step={0.01}
                      min={0}
                    />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput
                      value={r.current}
                      onChange={(v) => {
                        const num =
                          typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : 0;
                        const next = rows.slice();
                        next[i] = { ...next[i]!, current: Number.isFinite(num) ? num : 0 };
                        setRows(next);
                      }}
                      step={0.01}
                      min={0}
                    />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput
                      value={r.power}
                      onChange={(v) => {
                        const num =
                          typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : 0;
                        const next = rows.slice();
                        next[i] = { ...next[i]!, power: Number.isFinite(num) ? num : 0 };
                        setRows(next);
                      }}
                      step={0.01}
                      min={0}
                    />
                  </Table.Td>
                  <Table.Td>
                    <NumberInput
                      value={r.lambda}
                      onChange={(v) => {
                        const num =
                          typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : 0;
                        const next = rows.slice();
                        next[i] = { ...next[i]!, lambda: Number.isFinite(num) ? num : 0 };
                        setRows(next);
                      }}
                      step={1e-7}
                      min={0}
                      thousandSeparator=","
                    />
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

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
          <Text size="sm" c="dimmed" mb="sm">
            Ваги після нормалізації: вартість {probWeights[0]?.toFixed(3)}, струм{' '}
            {probWeights[1]?.toFixed(3)}, надійність {probWeights[2]?.toFixed(3)}, потужність{' '}
            {probWeights[3]?.toFixed(3)}; t = {missionTimeH} год
          </Text>

          <Table withTableBorder withColumnBorders stickyHeader>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Варіант</Table.Th>
                <Table.Th>C, у.о.</Table.Th>
                <Table.Th>I, мА</Table.Th>
                <Table.Th>N, Вт</Table.Th>
                <Table.Th>P(t)</Table.Th>
                <Table.Th>P(t)/C</Table.Th>
                <Table.Th>N/C</Table.Th>
                <Table.Th>Smin</Table.Th>
                <Table.Th>Smax</Table.Th>
                <Table.Th>E = Smax/Smin</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {computed.rows.map((r, i) => (
                <Table.Tr key={i}>
                  <Table.Td fw={computed.bestIndex === i ? 700 : 400}>{r.name}</Table.Td>
                  <Table.Td>{r.cost.toFixed(2)}</Table.Td>
                  <Table.Td>{r.current.toFixed(2)}</Table.Td>
                  <Table.Td>{r.power.toFixed(2)}</Table.Td>
                  <Table.Td>{r.reliability.toFixed(6)}</Table.Td>
                  <Table.Td>{r.eReliability.toFixed(6)}</Table.Td>
                  <Table.Td>{r.ePower.toFixed(6)}</Table.Td>
                  <Table.Td fw={computed.bestIndex === i ? 700 : 400}>{r.sMin.toFixed(4)}</Table.Td>
                  <Table.Td fw={computed.bestIndex === i ? 700 : 400}>{r.sMax.toFixed(4)}</Table.Td>
                  <Table.Td fw={computed.bestIndex === i ? 700 : 400}>
                    {r.efficiency.toFixed(4)}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          <Divider my="sm" />
          <Text>
            Найкраща стратегія: <b>{computed.rows[computed.bestIndex]?.name}</b> (максимальний
            інтегральний показник E).
          </Text>
        </Paper>
      )}
    </Stack>
  );
}
