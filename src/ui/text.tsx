import { Text, type StyleProp, type TextStyle } from 'react-native';

import { useTheme } from '@/ui/theme-provider';
import { figures, fonts } from '@/ui/theme';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  color?: string;
  numberOfLines?: number;
};

/** Big serif headline — screen titles, day names. */
export function Display({ children, style, color, numberOfLines }: Props) {
  const t = useTheme();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[{ fontFamily: fonts.serif, fontSize: 34, lineHeight: 38, color: color ?? t.tx }, style]}>
      {children}
    </Text>
  );
}

/** Section / card serif heading. */
export function Title({ children, style, color, numberOfLines }: Props) {
  const t = useTheme();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[{ fontFamily: fonts.serif, fontSize: 20, lineHeight: 24, color: color ?? t.tx }, style]}>
      {children}
    </Text>
  );
}

/** Serif numerals — weights, reps, timers. */
export function Num({ children, style, color, numberOfLines }: Props) {
  const t = useTheme();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        { fontFamily: fonts.serif, fontSize: 21, color: color ?? t.tx },
        figures,
        style,
      ]}>
      {children}
    </Text>
  );
}

/** Body / list copy. */
export function Body({ children, style, color, numberOfLines }: Props) {
  const t = useTheme();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[{ fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, color: color ?? t.tx }, style]}>
      {children}
    </Text>
  );
}

/** Uppercase micro-label — metadata, section headers. */
export function Micro({ children, style, color, numberOfLines }: Props) {
  const t = useTheme();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        {
          fontFamily: fonts.sansMed,
          fontSize: 9.5,
          letterSpacing: 1.6,
          textTransform: 'uppercase',
          color: color ?? t.mut,
        },
        style,
      ]}>
      {children}
    </Text>
  );
}
