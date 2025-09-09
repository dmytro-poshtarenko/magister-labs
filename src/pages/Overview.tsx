import { type ReactElement } from 'react';
import { Title, Text, Stack, List } from '@mantine/core';

export default function Overview(): ReactElement {
  return (
    <Stack gap="xs">
      <Title order={2}>Огляд</Title>
      <Text c="dimmed">
        Цей проєкт об’єднує лабораторні роботи для магістерської програми 2025 року зі спеціальності
        «Інженерія програмного забезпечення» в Черкаському державному технологічному університеті
        (ЧДТУ). Використовуйте бічну панель для навігації між дисциплінами та лабораторними
        роботами.
      </Text>
      <Stack gap="xs">
        <Title order={4}>Дисципліни</Title>
        <List>
          <List.Item>
            <b>Теорія прийняття рішень</b> — це дисципліна, яка вивчає методи прийняття рішень в
            умовах невизначеності та ризику.
          </List.Item>
        </List>
      </Stack>
    </Stack>
  );
}
