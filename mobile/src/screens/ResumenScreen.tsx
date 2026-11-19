import React, { useState } from 'react';
import { Switch, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { AppHeader, Button, Card, Chip, Ic, IconBox, Loading, Screen, Txt } from '../components/ui';
import { api } from '../services/api';
import { useApi } from '../hooks';
import { colors, money } from '../theme';

const Donut = ({ data, size = 120 }: { data: { pct: number; color: string }[]; size?: number }) => {
  const r = (size - 20) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        {data.map((x, i) => {
          const len = (c * x.pct) / 100;
          const el = (
            <Circle key={i} cx={size / 2} cy={size / 2} r={r} stroke={x.color} strokeWidth={16} fill="none"
              strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-acc} />
          );
          acc += len;
          return el;
        })}
      </Svg>
      <Txt w="sb" size={9} color={colors.textSoft}>TOP</Txt>
      <Txt w="xb" size={20} color={colors.primary}>{data[0].pct}%</Txt>
    </View>
  );
};

export default function ResumenScreen() {
  const d = useApi(api.getResumen);
  const [cmp, setCmp] = useState(true);
  if (!d) return <Loading />;
  const max = Math.max(d.ingresos.valor, d.anterior.ingresos);
  const tot = d.fijos + d.variables;
  const libre = (d.balanceNeto / d.ingresos.valor) * 100;
  const gP = (d.gastos.valor / d.ingresos.valor) * 100;
  const aP = (d.ahorro.valor / d.ingresos.valor) * 100;

  const stat = (l: string, i: string, v: { valor: number; var: number }) => (
    <Card key={l} style={{ flex: 1, padding: 12, gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Txt w="sb" size={11} color={colors.textSoft}>{l}</Txt>
        <IconBox icon={i} size={22} bg={colors.mintSoft} round={11} />
      </View>
      <Txt w="xb" size={16}>{money(v.valor, 0)}</Txt>
      <Chip label={`${v.var > 0 ? '+' : ''}${v.var.toFixed(1)}%`} style={{ alignSelf: 'flex-start' }} />
    </Card>
  );

  return (
    <Screen tabbed={false}>
      <AppHeader subtitle="Resumen Financiero Y Gráficos" back />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Txt w="sb" size={11} color={colors.textSoft}>ANÁLISIS FINANCIERO</Txt>
          <Txt w="xb" size={24}>Estadísticas y Balance</Txt>
        </View>
        <Chip label="Sep 2024" bg={colors.blueSoft} size={12} />
      </View>

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <IconBox icon="compare-horizontal" size={40} />
        <View style={{ flex: 1 }}>
          <Txt w="b" size={15}>Comparar períodos</Txt>
          <Txt w="sb" size={11} color={colors.textSoft}>Agosto vs Septiembre</Txt>
        </View>
        <Switch value={cmp} onValueChange={setCmp} trackColor={{ true: colors.primary, false: colors.gray }} thumbColor="#fff" />
      </Card>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        {stat('Ingresos', 'arrow-up', d.ingresos)}
        {stat('Gastos', 'arrow-down', d.gastos)}
        {stat('Ahorro', 'piggy-bank-outline', d.ahorro)}
      </View>

      <Card style={{ gap: 10 }}>
        <Txt w="sb" size={12} color={colors.textSoft}>● Balance Neto Disponible</Txt>
        <Txt w="xb" size={34} color={colors.primary}>+{money(d.balanceNeto)}</Txt>
        <Txt w="m" size={12} color={colors.textSoft}>Ingresos ({money(d.ingresos.valor, 0)}) - Gastos ({money(d.gastos.valor, 0)}) - Ahorro ({money(d.ahorro.valor, 0)})</Txt>
        <View style={{ flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden' }}>
          <View style={{ flex: libre, backgroundColor: colors.green }} />
          <View style={{ flex: gP, backgroundColor: colors.gray }} />
          <View style={{ flex: aP, backgroundColor: colors.primary }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Txt w="b" size={11}>Libre {libre.toFixed(1)}%</Txt>
          <Txt w="b" size={11}>Gastos {gP.toFixed(1)}%</Txt>
          <Txt w="b" size={11}>Ahorro {aP.toFixed(1)}%</Txt>
        </View>
      </Card>

      {cmp ? (
        <Card style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Txt w="xb" size={18}>Comparativa Mensual</Txt>
              <Txt w="m" size={12} color={colors.textSoft}>Agosto vs Septiembre</Txt>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Txt w="b" size={11} color={colors.textSoft}>● Ago</Txt>
              <Txt w="b" size={11} color={colors.primary}>● Sep</Txt>
            </View>
          </View>
          <View style={{ flexDirection: 'row', height: 150, alignItems: 'flex-end', justifyContent: 'space-around' }}>
            {([['Ingresos', d.anterior.ingresos, d.ingresos.valor], ['Gastos', d.anterior.gastos, d.gastos.valor], ['Ahorro', d.anterior.ahorro, d.ahorro.valor]] as const).map(([l, a, s]) => (
              <View key={l} style={{ alignItems: 'center', gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
                  <View style={{ width: 22, height: Math.max(8, (a / max) * 120), borderRadius: 4, backgroundColor: colors.blueSoft }} />
                  <View style={{ width: 22, height: Math.max(8, (s / max) * 120), borderRadius: 4, backgroundColor: colors.primary }} />
                </View>
                <Txt w="sb" size={10} color={colors.textSoft}>{l}</Txt>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', backgroundColor: colors.blueSofter, borderRadius: 14, padding: 10 }}>
            {([[d.anterior.ingresos, d.ingresos.valor], [d.anterior.gastos, d.gastos.valor], [d.anterior.ahorro, d.ahorro.valor]] as const).map(([a, s], i) => (
              <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                <Txt w="b" size={10}>Ago vs Sep</Txt>
                <Txt w="m" size={11} color={colors.textSoft}>{(a / 1000).toFixed(1)}k / {(s / 1000).toFixed(1)}k</Txt>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 10, backgroundColor: colors.blueSofter, borderRadius: 14, padding: 12, alignItems: 'center' }}>
            <IconBox icon="thumb-up-outline" size={36} bg={colors.mint} round={18} />
            <View style={{ flex: 1 }}>
              <Txt w="b" size={12} color={colors.primary}>Tendencia altamente favorable</Txt>
              <Txt w="m" size={12} color={colors.textSoft}>Lograste reducir un {d.gastos.var}% en gastos y aumentar un +{d.ahorro.var}% tu ahorro este mes.</Txt>
            </View>
          </View>
        </Card>
      ) : null}

      <Card style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Txt w="xb" size={18}>Gastos Fijos vs Variables</Txt>
            <Txt w="m" size={12} color={colors.textSoft}>Control de estructura de egresos</Txt>
          </View>
          <Chip label={`Total ${money(tot, 0)}`} bg={colors.blueSoft} color={colors.textSoft} />
        </View>
        <View style={{ flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden' }}>
          <View style={{ flex: d.fijos, backgroundColor: colors.primary }} />
          <View style={{ flex: d.variables, backgroundColor: colors.green }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Txt w="b" size={11}>● Fijos: {money(d.fijos, 0)} ({Math.round((d.fijos / tot) * 100)}%)</Txt>
          <Txt w="b" size={11}>● Variables: {money(d.variables, 0)} ({Math.round((d.variables / tot) * 100)}%)</Txt>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.blueSofter, borderRadius: 16, padding: 12 }}>
          <IconBox icon="silverware-fork-knife" size={40} bg="#fff" />
          <View style={{ flex: 1 }}>
            <Txt w="sb" size={10} color={colors.textSoft}>Mayor impacto variable</Txt>
            <Txt w="xb" size={15}>{d.mayorVariable.nombre}</Txt>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Txt w="xb" size={15}>{money(d.mayorVariable.monto)}</Txt>
            <Txt w="sb" size={10} color={colors.textSoft}>{d.mayorVariable.pct}% del variable</Txt>
          </View>
        </View>
      </Card>

      <Card style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Txt w="xb" size={18}>Distribución por Categorías</Txt>
          <Txt w="b" size={11} color={colors.primary}>Ver detalles</Txt>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Donut data={d.categorias} />
          <View style={{ flex: 1, gap: 8 }}>
            {d.categorias.map((c) => (
              <View key={c.nombre} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: c.color }} />
                <Txt w="m" size={12} style={{ flex: 1 }}>{c.nombre}</Txt>
                <Txt w="b" size={12}>{c.pct}%</Txt>
              </View>
            ))}
          </View>
        </View>
      </Card>

      <Button icon="download-outline" label="Descargar Reporte Mensual PDF / Excel" />
      <Txt w="b" size={11} color={colors.textSoft} style={{ textAlign: 'center' }}>🔒 Generado con firma digital para auditoría personal</Txt>
    </Screen>
  );
}
