import { createTheme, DEFAULT_THEME } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'blue',
  colors: {
    ...DEFAULT_THEME.colors,
  },
  defaultRadius: 'md',
});
