import React, { useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { AppHeader, Card, Chip, Ic, IconBox, Screen, SectionTitle, Txt } from '../components/ui';
import { api } from '../services/api';
import { EstadoConsulta } from '../components/EstadoConsulta';
import { useApi } from '../hooks';
import { colors, money } from '../theme';
import { MovimientoVista } from '../types/db';

export const MovimientoRow = ({ m }: { m: MovimientoVista }) => {
  const ingreso = m.tipo === 'Ingreso';
  return (
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
      <IconBox icon={m.icono} bg={ingreso ? colors.mintSoft : colors.blueSoft} />
      <View style={{ flex: 1 }}>
        <Txt w="b" size={15}>{m.titulo}</Txt>
        <Txt w="m" size={11} color={colors.textSoft}>{m.detalle}</Txt>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Txt w="b" size={15} color={ingreso ? colors.primary : colors.text}>
          {ingreso ? '+ ' : '- '}{money(Math.abs(m.monto))}
        </Txt>
        <Txt w="sb" size={11} color={ingreso ? colors.primary : colors.textSoft}>{m.tipo}</Txt>
      </View>
    </Card>
  );
};

export default function DashboardScreen() {
  const nav = useNavigation<any>();
  const { data: d, error, reload } = useApi(api.getDashboard);
  const [visible, setVisible] = useState(true);
  if (!d) return <EstadoConsulta error={error} reload={reload} />;
  const hide = (n: number) => (visible ? money(n, 2) : 'Bs ••••');
  const gastadoPct = d.limiteMensual > 0 ? Math.round((d.gastos / d.limiteMensual) * 100) : 0;

  return (
    <Screen>
      <AppHeader subtitle="Inicio" />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View>
          <Txt w="xb" size={24}>Hola, {d.nombre} 👋</Txt>
          <Txt w="m" size={13} color={colors.textSoft}>Así están tus finanzas hoy</Txt>
        </View>
        <Chip label="● Al día" />
      </View>

      <LinearGradient colors={[colors.primaryDark, '#00785A']} style={{ borderRadius: 28, padding: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => setVisible(!visible)} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Txt w="sb" size={12} color={colors.mint}>DINERO DISPONIBLE</Txt>
            <Ic name={visible ? 'eye-outline' : 'eye-off-outline'} size={18} color={colors.mint} />
          </TouchableOpacity>
          <Chip label="En regla" bg="rgba(255,255,255,0.15)" color={colors.mint} />
        </View>
        <Txt w="xb" size={36} color="#fff" style={{ marginVertical: 10 }}>
          {hide(d.disponible)} <Txt w="m" size={12} color={colors.mint}>{d.moneda}</Txt>
        </Txt>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            { l: 'Ingresos', v: d.ingresos, i: 'arrow-up-circle-outline', c: colors.mint },
            { l: 'Gastos', v: d.gastos, i: 'arrow-down-circle-outline', c: '#FFB4A8' },
            { l: 'Ahorro', v: d.ahorro, i: 'piggy-bank-outline', c: colors.mint },
          ].map((x) => (
            <View key={x.l} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: 10 }}>
              <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                <Ic name={x.i} size={16} color="#fff" />
                <Txt w="m" size={11} color="#fff">{x.l}</Txt>
              </View>
              <Txt w="b" size={14} color={x.c} style={{ marginTop: 4 }}>{hide(x.v).replace(',00', '')}</Txt>
            </View>
          ))}
        </View>
      </LinearGradient>

      <SectionTitle title="ACCIONES RÁPIDAS" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {[
          { l: '+ Gasto', i: 'minus', bg: colors.mint, c: colors.primary, go: () => nav.navigate('RegistroRapido') },
          { l: '+ Ingreso', i: 'plus', bg: colors.primary, c: '#fff', go: () => nav.navigate('Registrar', { tipo: 'Ingreso' }) },
          { l: 'Presupuesto', i: 'chart-pie', bg: colors.blueSoft, c: colors.primary, go: () => nav.navigate('Tabs', { screen: 'Presupuesto' }) },
          { l: 'Metas', i: 'flag-outline', bg: colors.blueSoft, c: colors.primary, go: () => nav.navigate('Tabs', { screen: 'Ahorro' }) },
        ].map((a) => (
          <TouchableOpacity key={a.l} onPress={a.go} style={{ width: 88, alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 20, paddingVertical: 14 }}>
            <IconBox icon={a.i} size={52} bg={a.bg} color={a.c} round={16} />
            <Txt w="b" size={12}>{a.l}</Txt>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <IconBox icon="chart-donut" size={40} />
            <Txt w="xb" size={18}>Resumen del mes</Txt>
          </View>
          <Chip label={new Date().toLocaleDateString('es-BO', { month: 'long' })} bg={colors.blueSoft} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}>
          <Txt w="m" size={13} color={colors.textSoft}>Límite mensual gastado:</Txt>
          <Txt w="b" size={13}>{gastadoPct}% de {money(d.limiteMensual, 0)}</Txt>
        </View>
        <View style={{ flexDirection: 'row', gap: 4, marginVertical: 12 }}>
          {d.distribucion.map((x, i) => (
            <View key={i} style={{ flex: x.pct, height: 8, borderRadius: 4, backgroundColor: x.color }} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {d.distribucion.map((x) => (
            <View key={x.nombre} style={{ width: '48%', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.blueSofter, borderRadius: 12, padding: 10 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: x.color }} />
              <Txt w="sb" size={11} style={{ flex: 1 }} numberOfLines={1}>{x.nombre}</Txt>
              <Txt w="b" size={11}>{x.pct}%</Txt>
            </View>
          ))}
        </View>
      </Card>

      <SectionTitle title="Movimientos recientes" action="Ver todos" onAction={() => nav.navigate('Tabs', { screen: 'Movimientos' })} />
      {d.recientes.map((m) => <MovimientoRow key={m.id} m={m} />)}
    </Screen>
  );
}
