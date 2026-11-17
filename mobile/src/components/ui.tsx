import React from 'react';
import {
  ActivityIndicator, Image, ScrollView, StyleProp, StyleSheet, Text, TextStyle,
  TouchableOpacity, View, ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, radius } from '../theme';

export type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

// ---------- Texto ----------
interface TxtProps {
  w?: keyof typeof font;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
  children?: React.ReactNode;
  numberOfLines?: number;
}
export const Txt = ({ w = 'r', size = 14, color = colors.text, style, children, numberOfLines }: TxtProps) => (
  <Text numberOfLines={numberOfLines} style={[{ fontFamily: font[w], fontSize: size, color }, style]}>
    {children}
  </Text>
);

export const Ic = ({ name, size = 20, color = colors.text }: { name: string; size?: number; color?: string }) => (
  <MaterialCommunityIcons name={name as IconName} size={size} color={color} />
);

// ---------- Contenedores ----------
export const Card = ({ style, children }: { style?: StyleProp<ViewStyle>; children?: React.ReactNode }) => (
  <View style={[s.card, style]}>{children}</View>
);

export const IconBox = ({
  icon, size = 44, bg = colors.blueSoft, color = colors.primary, round = 14,
}: { icon: string; size?: number; bg?: string; color?: string; round?: number }) => (
  <View style={{ width: size, height: size, borderRadius: round, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
    <Ic name={icon} size={size * 0.5} color={color} />
  </View>
);

export const Chip = ({
  label, bg = colors.mintSoft, color = colors.primary, style, w = 'b', size = 11,
}: { label: string; bg?: string; color?: string; style?: StyleProp<ViewStyle>; w?: keyof typeof font; size?: number }) => (
  <View style={[{ backgroundColor: bg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 }, style]}>
    <Txt w={w} size={size} color={color}>{label}</Txt>
  </View>
);

export const Bar = ({ pct, color = colors.primary, track = colors.blueSoft, height = 8 }: {
  pct: number; color?: string; track?: string; height?: number;
}) => (
  <View style={{ height, borderRadius: height, backgroundColor: track, overflow: 'hidden' }}>
    <View style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height, borderRadius: height, backgroundColor: color }} />
  </View>
);

export const Segmented = <T extends string>({ options, value, onChange }: {
  options: T[]; value: T; onChange: (v: T) => void;
}) => (
  <View style={s.seg}>
    {options.map((o) => {
      const on = o === value;
      return (
        <TouchableOpacity key={o} style={[s.segItem, on && s.segOn]} onPress={() => onChange(o)}>
          <Txt w={on ? 'b' : 'sb'} size={12} color={on ? colors.primary : colors.textSoft}>{o}</Txt>
        </TouchableOpacity>
      );
    })}
  </View>
);

export const Button = ({ label, onPress, icon, bg = colors.primary }: {
  label: string; onPress?: () => void; icon?: string; bg?: string;
}) => (
  <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[s.btn, { backgroundColor: bg }]}>
    {icon ? <Ic name={icon} size={20} color="#fff" /> : null}
    <Txt w="b" size={15} color="#fff">{label}</Txt>
  </TouchableOpacity>
);

export const Loading = () => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
    <ActivityIndicator color={colors.primary} />
  </View>
);

// ---------- Cabecera de app ----------
export const AppHeader = ({ subtitle, back }: { subtitle: string; back?: boolean }) => {
  const nav = useNavigation<any>();
  return (
    <View style={s.header}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {back ? (
          <TouchableOpacity onPress={() => nav.goBack()}>
            <Ic name="arrow-left" size={24} />
          </TouchableOpacity>
        ) : null}
        <Image source={require('../../assets/logo.png')} style={{ width: 36, height: 36, borderRadius: 10 }} />
        <View>
          <Txt w="xb" size={18} color={colors.primary} style={{ lineHeight: 20 }}>Save Money</Txt>
          <Txt w="m" size={11} color={colors.textSoft}>{subtitle}</Txt>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <TouchableOpacity onPress={() => nav.navigate('Alertas')}>
          <Ic name="bell-outline" size={24} />
          <View style={s.dot} />
        </TouchableOpacity>
        <Image source={require('../../assets/avatar.jpg')} style={{ width: 36, height: 36, borderRadius: 18 }} />
      </View>
    </View>
  );
};

// Cabecera para pantallas de stack (volver / cerrar)
export const StackHeader = ({ title, close }: { title: string; close?: boolean }) => {
  const nav = useNavigation<any>();
  return (
    <View style={s.header}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => nav.goBack()}>
          <Ic name="arrow-left" size={24} />
        </TouchableOpacity>
        <Txt w="b" size={18}>{title}</Txt>
      </View>
      {close ? (
        <TouchableOpacity onPress={() => nav.goBack()}>
          <Ic name="close" size={24} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

// ---------- Contenedor de pantalla con FAB ----------
export const Screen = ({ children, fab = true, tabbed = true, pad = true }: {
  children: React.ReactNode; fab?: boolean; tabbed?: boolean; pad?: boolean;
}) => {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<any>();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: pad ? 16 : 0, paddingBottom: 110, gap: 16 }}
      >
        {children}
      </ScrollView>
      {fab ? (
        <TouchableOpacity
          activeOpacity={0.85}
          style={[s.fab, { bottom: tabbed ? 20 : 24 + insets.bottom }]}
          onPress={() => nav.navigate('Registrar', { tipo: 'Gasto' })}
        >
          <Ic name="plus" size={28} color="#fff" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export const SectionTitle = ({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
    <Txt w="b" size={18}>{title}</Txt>
    {action ? (
      <TouchableOpacity onPress={onAction}><Txt w="b" size={12} color={colors.primary}>{action}</Txt></TouchableOpacity>
    ) : null}
  </View>
);

const s = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  dot: { position: 'absolute', top: 0, right: 1, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green },
  seg: { flexDirection: 'row', backgroundColor: colors.blueSoft, borderRadius: radius.md, padding: 3 },
  segItem: { flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: radius.md - 4 },
  segOn: { backgroundColor: '#fff' },
  btn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, paddingVertical: 16 },
  fab: {
    position: 'absolute', right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', elevation: 6,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
});
