import { type ReactElement } from 'react';
import { Badge, Divider, Group, List, Paper, Stack, Table, Text, Title } from '@mantine/core';

type Observation = {
  period: number;
  incidents: number;
};

type MovingAveragePoint = {
  period: number;
  sourcePeriods: number[];
  sourceValues: number[];
  forecast: number;
};

const title =
  "САОПІ ЛР 7. Формування висновків про стан об'єкта аналізу за методом згладжування усередненням";

const basePeriod = 3;

const observations: Observation[] = [
  { period: 1, incidents: 18 },
  { period: 2, incidents: 16 },
  { period: 3, incidents: 19 },
  { period: 4, incidents: 15 },
  { period: 5, incidents: 14 },
  { period: 6, incidents: 17 },
  { period: 7, incidents: 13 },
  { period: 8, incidents: 12 },
  { period: 9, incidents: 15 },
  { period: 10, incidents: 11 },
  { period: 11, incidents: 10 },
  { period: 12, incidents: 12 },
];

function formatNumber(value: number, digits = 2): string {
  return value.toFixed(digits).replace(/\.?0+$/, '');
}

function getIncidentCount(period: number): number {
  const observation = observations.find((item) => item.period === period);
  if (!observation) throw new Error(`Unknown observation period ${period}`);
  return observation.incidents;
}

function calculateMovingAverages(): MovingAveragePoint[] {
  const firstForecastPeriod = basePeriod + 1;
  const lastForecastPeriod = observations.length + 1;

  return Array.from(
    { length: lastForecastPeriod - firstForecastPeriod + 1 },
    (_, index): MovingAveragePoint => {
      const period = firstForecastPeriod + index;
      const sourcePeriods = Array.from(
        { length: basePeriod },
        (_, offset) => period - basePeriod + offset,
      );
      const sourceValues = sourcePeriods.map(getIncidentCount);
      const forecast = sourceValues.reduce((sum, value) => sum + value, 0) / basePeriod;

      return {
        period,
        sourcePeriods,
        sourceValues,
        forecast,
      };
    },
  );
}

const movingAverages = calculateMovingAverages();
const nextForecast = movingAverages[movingAverages.length - 1]!;

function calculationText(point: MovingAveragePoint): string {
  return `(${point.sourceValues.join(' + ')}) / ${basePeriod}`;
}

export default function SaopiLab7(): ReactElement {
  const chartWidth = 900;
  const chartHeight = 420;
  const paddingLeft = 58;
  const paddingRight = 36;
  const paddingTop = 28;
  const paddingBottom = 52;
  const minY = 8;
  const maxY = 20;
  const minPeriod = 1;
  const maxPeriod = observations.length + 1;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  const x = (period: number) =>
    paddingLeft + ((period - minPeriod) / (maxPeriod - minPeriod)) * plotWidth;
  const y = (value: number) => paddingTop + ((maxY - value) / (maxY - minY)) * plotHeight;
  const actualLine = observations.map((item) => `${x(item.period)},${y(item.incidents)}`).join(' ');
  const averageLine = movingAverages
    .map((item) => `${x(item.period)},${y(item.forecast)}`)
    .join(' ');
  const yTicks = [8, 10, 12, 14, 16, 18, 20];

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Title order={3}>{title}</Title>
          <Text c="dimmed">
            Приклад із програмної інженерії: короткостроковий прогноз кількості production incidents
            SaaS-продукту за методом ковзного середнього.
          </Text>
        </Stack>
        <Badge size="lg" variant="light" color="green">
          Прогноз на 13-й тиждень: {formatNumber(nextForecast.forecast)} інцидентів
        </Badge>
      </Group>

      <Paper p="md" withBorder>
        <Stack gap="xs">
          <Title order={4}>Коротко про метод</Title>
          <Text>
            Згладжування усередненням застосовується до часового ряду, коли останні спостереження
            можна використати для оцінки найближчого майбутнього стану об'єкта. Метод зменшує вплив
            випадкових коливань і показує загальний рівень показника.
          </Text>
          <Text>
            Для бази n прогноз на наступний період дорівнює середньому останніх n значень: ŷ(t+1) =
            (y(t-n+1) + ... + y(t)) / n.
          </Text>
          <List type="ordered" withPadding>
            <List.Item>Зібрати послідовність спостережень часового ряду.</List.Item>
            <List.Item>Обрати базу згладжування n.</List.Item>
            <List.Item>Для кожного періоду взяти останні n фактичних значень.</List.Item>
            <List.Item>Обчислити їх середнє та отримати прогноз.</List.Item>
            <List.Item>Порівняти фактичний ряд і згладжений ряд на графіку.</List.Item>
          </List>
        </Stack>
      </Paper>

      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Title order={4}>Постановка задачі</Title>
          <Text>
            Команда SRE аналізує кількість production incidents за 12 тижнів. Потрібно спрогнозувати
            очікувану кількість інцидентів на 13-й тиждень і зробити висновок про стан стабільності
            SaaS-продукту.
          </Text>
          <Table striped withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Тиждень</Table.Th>
                <Table.Th>Кількість production incidents</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {observations.map((item) => (
                <Table.Tr key={item.period}>
                  <Table.Td>{item.period}</Table.Td>
                  <Table.Td>{item.incidents}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      </Paper>

      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Title order={4}>Розрахунок ковзного середнього</Title>
          <Text c="dimmed">
            Використовується база згладжування n = {basePeriod}. Кожен прогноз побудовано за трьома
            попередніми фактичними значеннями.
          </Text>
          <Table striped withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Період прогнозу</Table.Th>
                <Table.Th>Використані періоди</Table.Th>
                <Table.Th>Розрахунок</Table.Th>
                <Table.Th>Прогноз</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {movingAverages.map((point) => (
                <Table.Tr key={point.period}>
                  <Table.Td>{point.period}</Table.Td>
                  <Table.Td>{point.sourcePeriods.join(', ')}</Table.Td>
                  <Table.Td>{calculationText(point)}</Table.Td>
                  <Table.Td fw={point.period === nextForecast.period ? 700 : 400}>
                    {formatNumber(point.forecast)}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      </Paper>

      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Title order={4}>SVG-графік часового ряду</Title>
          <Text c="dimmed">
            Синя лінія показує фактичні значення, зелена — згладжені значення, пунктирна точка —
            прогноз на 13-й тиждень.
          </Text>
          <div style={{ overflowX: 'auto' }}>
            <svg
              width={chartWidth}
              height={chartHeight}
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              style={{ border: '1px solid var(--mantine-color-gray-4)' }}
            >
              <rect x={0} y={0} width={chartWidth} height={chartHeight} fill="#ffffff" />

              {yTicks.map((tick) => (
                <g key={tick}>
                  <line
                    x1={paddingLeft}
                    y1={y(tick)}
                    x2={chartWidth - paddingRight}
                    y2={y(tick)}
                    stroke="#e2e8f0"
                  />
                  <text x={paddingLeft - 12} y={y(tick) + 4} textAnchor="end" fontSize={11}>
                    {tick}
                  </text>
                </g>
              ))}

              {Array.from({ length: maxPeriod }, (_, index) => index + 1).map((period) => (
                <g key={period}>
                  <line
                    x1={x(period)}
                    y1={paddingTop}
                    x2={x(period)}
                    y2={chartHeight - paddingBottom}
                    stroke="#f1f5f9"
                  />
                  <text
                    x={x(period)}
                    y={chartHeight - paddingBottom + 24}
                    textAnchor="middle"
                    fontSize={11}
                  >
                    {period}
                  </text>
                </g>
              ))}

              <line
                x1={paddingLeft}
                y1={chartHeight - paddingBottom}
                x2={chartWidth - paddingRight}
                y2={chartHeight - paddingBottom}
                stroke="#334155"
              />
              <line
                x1={paddingLeft}
                y1={paddingTop}
                x2={paddingLeft}
                y2={chartHeight - paddingBottom}
                stroke="#334155"
              />

              <text x={chartWidth / 2} y={chartHeight - 12} textAnchor="middle" fontSize={12}>
                Тиждень t
              </text>
              <text x={18} y={28} textAnchor="start" fontSize={12}>
                Інциденти
              </text>

              <polyline points={actualLine} fill="none" stroke="#1c7ed6" strokeWidth={3} />
              <polyline points={averageLine} fill="none" stroke="#2f9e44" strokeWidth={3} />

              {observations.map((item) => (
                <circle
                  key={item.period}
                  cx={x(item.period)}
                  cy={y(item.incidents)}
                  r={5}
                  fill="#1c7ed6"
                  stroke="#ffffff"
                  strokeWidth={1.5}
                />
              ))}

              {movingAverages.map((item) => {
                const isForecast = item.period === nextForecast.period;
                return (
                  <g key={item.period}>
                    <circle
                      cx={x(item.period)}
                      cy={y(item.forecast)}
                      r={isForecast ? 7 : 5}
                      fill={isForecast ? '#f08c00' : '#2f9e44'}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                    />
                    {isForecast ? (
                      <>
                        <line
                          x1={x(item.period)}
                          y1={y(item.forecast)}
                          x2={x(item.period)}
                          y2={chartHeight - paddingBottom}
                          stroke="#f08c00"
                          strokeDasharray="5 5"
                        />
                        <text
                          x={x(item.period) - 8}
                          y={y(item.forecast) - 14}
                          textAnchor="end"
                          fontSize={12}
                        >
                          прогноз {formatNumber(item.forecast)}
                        </text>
                      </>
                    ) : null}
                  </g>
                );
              })}

              <g transform="translate(640 34)">
                <rect x={0} y={0} width={210} height={58} rx={8} fill="#ffffff" stroke="#cbd5e1" />
                <line x1={14} y1={18} x2={46} y2={18} stroke="#1c7ed6" strokeWidth={3} />
                <text x={56} y={22} fontSize={11}>
                  фактичні значення
                </text>
                <line x1={14} y1={40} x2={46} y2={40} stroke="#2f9e44" strokeWidth={3} />
                <text x={56} y={44} fontSize={11}>
                  ковзне середнє
                </text>
              </g>
            </svg>
          </div>
        </Stack>
      </Paper>

      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Title order={4}>Висновок за моделлю</Title>
          <Text>
            Прогноз на {nextForecast.period}-й тиждень дорівнює{' '}
            <b>{formatNumber(nextForecast.forecast)}</b> production incidents. Це нижче за рівень
            перших тижнів спостереження, тому поточний стан продукту можна оцінити як стабільніший,
            хоча повністю випадкові коливання метод не усуває.
          </Text>
          <Divider />
          <Text>
            Для оперативного планування чергувань цього прогнозу достатньо, але для довгого
            горизонту варто додатково перевірити тренд і сезонність інцидентів.
          </Text>
        </Stack>
      </Paper>
    </Stack>
  );
}
