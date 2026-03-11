import {color} from './colors';

export const space = Object.freeze({
  xxs: 4,
  xs: 6,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  control: 15,
  xxl: 16,
  screen: 18,
  section: 24,
  hero: 30,
});

export const radius = Object.freeze({
  dot: 4,
  sm: 10,
  md: 12,
  lg: 14,
  control: 15,
  xl: 16,
  xxl: 18,
  card: 24,
  shell: 28,
  hero: 30,
  round: 999,
});

export const shadow = Object.freeze({
  soft: {
    shadowColor: color.black,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 8},
    elevation: 6,
  },
  elevated: {
    shadowColor: color.black,
    shadowOpacity: 0.24,
    shadowRadius: 24,
    shadowOffset: {width: 0, height: 16},
    elevation: 10,
  },
});
