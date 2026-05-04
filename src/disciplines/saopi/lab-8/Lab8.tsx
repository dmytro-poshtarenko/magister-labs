import { type ReactElement } from 'react';
import { Badge, Divider, Group, List, Paper, Stack, Table, Text, Title } from '@mantine/core';

type Observation = {
  period: number;
  incidents: number;
};

type SmoothingPoint = {
  period: number;
  observedPeriod: number;
  observedValue: number;
  previousSmoothed?: number;
  smoothed: number;
  initial: boolean;
};

const title =
  "САОПІ ЛР 8. Оцінка стійкості об'єкта аналізу за методом експоненційного згладжування";

const alpha = 0.2;

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

function calculateSmoothingPoints(): SmoothingPoint[] {
  const firstValue = getIncidentCount(1);
  const points: SmoothingPoint[] = [
    {
      period: 2,
      observedPeriod: 1,
      observedValue: firstValue,
      smoothed: firstValue,
      initial: true,
    },
  ];

  let previousSmoothed = firstValue;

  for (let period = 2; period <= observations.length; period += 1) {
    const observedValue = getIncidentCount(period);
    const smoothed = alpha * observedValue + (1 - alpha) * previousSmoothed;

    points.push({
      period: period + 1,
      observedPeriod: period,
      observedValue,
      previousSmoothed,
      smoothed,
      initial: false,
    });

    previousSmoothed = smoothed;
  }

  return points;
}

const smoothingPoints = calculateSmoothingPoints();
const nextForecast = smoothingPoints[smoothingPoints.length - 1]!;

function calculationText(point: SmoothingPoint): string {
  if (point.initial) {
    return `S(${point.period}) = y(${point.observedPeriod})`;
  }

  return `${formatNumber(alpha)} * ${formatNumber(point.observedValue)} + ${formatNumber(1 - alpha)} * ${formatNumber(
    point.previousSmoothed ?? 0,
  )}`;
}

export default function SaopiLab8(): ReactElement {
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
  const smoothedLine = smoothingPoints
    .map((item) => `${x(item.period)},${y(item.smoothed)}`)
    .join(' ');
  const yTicks = [8, 10, 12, 14, 16, 18, 20];

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Title order={3}>{title}</Title>
          <Text c="dimmed">
            Приклад із програмної інженерії: оцінка стійкості SaaS-продукту за кількістю production
            incidents із більшою вагою останніх спостережень.
          </Text>
        </Stack>
        <Badge size="lg" variant="light" color="green">
          Прогноз на 13-й тиждень: {formatNumber(nextForecast.smoothed)} інцидентів
        </Badge>
      </Group>

      <Paper p="md" withBorder>
        <Stack gap="xs">
          <Title order={4}>Коротко про метод</Title>
          <Text>
            Експоненційне згладжування прогнозує наступне значення часового ряду через поточне
            спостереження і попередню згладжену оцінку. Новіші спостереження мають більшу вагу, а
            старіші впливають на прогноз дедалі слабше.
          </Text>
          <Text>
            Рекурентна формула має вигляд: S(t+1) = α*y(t) + (1-α)*S(t), де α — константа
            згладжування в межах від 0 до 1. У цій роботі α = {formatNumber(alpha)}.
          </Text>
          <List type="ordered" withPadding>
            <List.Item>Зібрати часовий ряд фактичних значень.</List.Item>
            <List.Item>Обрати константу згладжування α.</List.Item>
            <List.Item>Задати початкову згладжену оцінку.</List.Item>
            <List.Item>Рекурентно обчислити згладжені значення для наступних періодів.</List.Item>
            <List.Item>
              Порівняти фактичний і згладжений ряд та зробити висновок про стійкість.
            </List.Item>
          </List>
        </Stack>
      </Paper>

      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Title order={4}>Постановка задачі</Title>
          <Text>
            Команда SRE аналізує кількість production incidents за 12 тижнів. Потрібно оцінити
            очікуваний рівень інцидентів на 13-й тиждень і визначити, чи стає SaaS-продукт
            стабільнішим в експлуатації.
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
          <Title order={4}>Рекурентний розрахунок</Title>
          <Text c="dimmed">
            Початкова оцінка: S(2)=y(1). Далі використовується формула S(t+1)=
            {formatNumber(alpha)}*y(t)+{formatNumber(1 - alpha)}*S(t).
          </Text>
          <Table striped withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Період прогнозу</Table.Th>
                <Table.Th>Фактичне значення</Table.Th>
                <Table.Th>Розрахунок</Table.Th>
                <Table.Th>Згладжена оцінка</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {smoothingPoints.map((point) => (
                <Table.Tr key={point.period}>
                  <Table.Td>{point.period}</Table.Td>
                  <Table.Td>
                    y({point.observedPeriod}) = {formatNumber(point.observedValue)}
                  </Table.Td>
                  <Table.Td>{calculationText(point)}</Table.Td>
                  <Table.Td fw={point.period === nextForecast.period ? 700 : 400}>
                    {formatNumber(point.smoothed)}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      </Paper>

      <Paper p="md" withBorder>
        <Stack gap="sm">
          <Title order={4}>SVG-графік експоненційного згладжування</Title>
          <Text c="dimmed">
            Синя лінія показує фактичні значення, зелена — експоненційно згладжений ряд, помаранчева
            точка — прогноз на 13-й тиждень.
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
              <polyline points={smoothedLine} fill="none" stroke="#2f9e44" strokeWidth={3} />

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

              {smoothingPoints.map((item) => {
                const isForecast = item.period === nextForecast.period;
                return (
                  <g key={item.period}>
                    <circle
                      cx={x(item.period)}
                      cy={y(item.smoothed)}
                      r={isForecast ? 7 : 5}
                      fill={isForecast ? '#f08c00' : '#2f9e44'}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                    />
                    {isForecast ? (
                      <>
                        <line
                          x1={x(item.period)}
                          y1={y(item.smoothed)}
                          x2={x(item.period)}
                          y2={chartHeight - paddingBottom}
                          stroke="#f08c00"
                          strokeDasharray="5 5"
                        />
                        <text
                          x={x(item.period) - 8}
                          y={y(item.smoothed) - 14}
                          textAnchor="end"
                          fontSize={12}
                        >
                          прогноз {formatNumber(item.smoothed)}
                        </text>
                      </>
                    ) : null}
                  </g>
                );
              })}

              <g transform="translate(606 34)">
                <rect x={0} y={0} width={244} height={58} rx={8} fill="#ffffff" stroke="#cbd5e1" />
                <line x1={14} y1={18} x2={46} y2={18} stroke="#1c7ed6" strokeWidth={3} />
                <text x={56} y={22} fontSize={11}>
                  фактичні значення
                </text>
                <line x1={14} y1={40} x2={46} y2={40} stroke="#2f9e44" strokeWidth={3} />
                <text x={56} y={44} fontSize={11}>
                  експоненційне згладжування
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
            <b>{formatNumber(nextForecast.smoothed)}</b> production incidents. Згладжений ряд
            поступово знижується, тому стан продукту можна оцінити як стабільніший, ніж на початку
            періоду спостереження.
          </Text>
          <Divider />
          <Text>
            Значення α = {formatNumber(alpha)} робить модель достатньо плавною: вона враховує
            покращення останніх тижнів, але не ігнорує попередні періоди з більшою кількістю
            інцидентів.
          </Text>
        </Stack>
      </Paper>
    </Stack>
  );
}
