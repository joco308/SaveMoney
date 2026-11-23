import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { AppHeader, Bar, Card, Chip, Ic, IconBox, Screen, Txt } from '../components/ui';
import { api } from '../services/api';
import { RecordatorioAhorro } from '../components/RecordatorioAhorro';
import { EstadoConsulta } from '../components/EstadoConsulta';
import { useApi } from '../hooks';
import { colors, money } from '../theme';

const Ring = ({ pct, size = 52 }: { pct: number; size?: number }) => {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.blueSoft} strokeWidth={5} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.primary} strokeWidth={5} fill="none"
          strokeDasharray={`${(c * pct) / 100} ${c}`} strokeLinecap="round" />
      </Svg>
      <Txt w="xb" size={12} color={colors.primary}>{pct}%</Txt>
    </View>
  );
};

export default function MetasScreen() {
  const { data: d, error, reload } = useApi(api.getMetas);
  if (!d) return <EstadoConsulta error={error} reload={reload} />;
  const pctG = d.objetivoGlobal > 0 ? Math.round((d.totalAcumulado / d.objetivoGlobal) * 100) : 0;
  const maxV = Math.max(1, ...d.proyeccion.map((p) => p.valor));

  return (
    <Screen>
      <AppHeader subtitle="Ahorro" />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View>
          <Txt w="b" size={11} color={colors.primary}>TUS PROYECTOS</Txt>
          <Txt w="xb" size={24}>Mis Metas de Ahorro</Txt>
        </View>
      </View>

      <Card style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Txt w="m" size={13} color={colors.textSoft}>Total acumulado en metas</Txt>
            <Txt w="xb" size={32} color={colors.primary}>{money(d.totalAcumulado)}</Txt>
            <Txt w="m" size={12} color={colors.textSoft}>Objetivo global: {money(d.objetivoGlobal, 0)}</Txt>
          </View>
          <Ring pct={pctG} />
        </View>
        <Bar pct={pctG} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: colors.blueSofter, borderRadius: 16, padding: 12 }}>
            <Ic name="trending-up" size={18} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Txt w="sb" size={10} color={colors.textSoft}>Rendimiento mensual</Txt>
              <Txt w="b" size={13} color={colors.primary}>+Bs {d.rendimientoMensual} este mes</Txt>
            </View>
          </View>
          <View style={{ flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: colors.blueSofter, borderRadius: 16, padding: 12 }}>
            <Ic name="flag-outline" size={18} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Txt w="sb" size={10} color={colors.textSoft}>Faltan ahorrar</Txt>
              <Txt w="b" size={13} color={colors.primary}>{money(d.objetivoGlobal - d.totalAcumulado, 0)}</Txt>
            </View>
          </View>
        </View>
      </Card>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Txt w="xb" size={18}>Metas Activas</Txt>
        <Chip label={`${d.metas.length} en progreso`} />
      </View>
      {d.metas.map((m) => {
        const pct = m.objetivo > 0 ? Math.round((m.ahorrado / m.objetivo) * 100) : 0;
        return (
          <Card key={m.id_meta} style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <IconBox icon={m.icono} size={52} />
              <View style={{ flex: 1 }}>
                <Txt w="xb" size={18}>{m.nombre}</Txt>
                <Txt w="sb" size={12} color={colors.textSoft}>Meta final: {money(m.objetivo, 0)}</Txt>
              </View>
              <Chip label={`${pct}%`} bg={colors.mint} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Txt w="m" size={12} color={colors.textSoft}>Ahorrado: <Txt w="b" size={12} color={colors.primary}>{money(m.ahorrado, 0)}</Txt></Txt>
              <Txt w="m" size={12} color={colors.textSoft}>Falta: <Txt w="b" size={12}>{money(m.objetivo - m.ahorrado, 0)}</Txt></Txt>
            </View>
            <Bar pct={pct} height={10} />
            {m.sugerencia ? (
              <View style={{ backgroundColor: colors.blueSofter, borderRadius: 16, padding: 12, gap: 4 }}>
                <Txt w="b" size={13} color={colors.primary}>✓ ¡Vas por buen camino!</Txt>
                <Txt w="m" size={12} color={colors.textSoft}>{m.sugerencia}</Txt>
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Txt w="b" size={12} color={colors.textSoft}>{m.recordatorio}</Txt>
              <Txt w="b" size={12} color={colors.primary}>Aportar →</Txt>
            </View>
          </Card>
        );
      })}

      <Card style={{ gap: 12 }}>
        <Txt w="xb" size={18}>Historial de aportes</Txt>
        <Txt w="m" size={12} color={colors.textSoft}>Aportes registrados por mes</Txt>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 130, backgroundColor: colors.blueSofter, borderRadius: 16, padding: 12 }}>
          {d.proyeccion.map((p, i) => {
            const last = i === d.proyeccion.length - 1;
            const hoy = i === d.proyeccion.length - 2;
            return (
              <View key={p.label} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                <View style={{ width: '100%', height: 20 + (p.valor / maxV) * 70, borderRadius: 10, backgroundColor: last ? colors.mint : hoy ? colors.primary : colors.blueSoft, borderWidth: last ? 1 : 0, borderStyle: 'dashed', borderColor: colors.primary }} />
                <Txt w={hoy || last ? 'b' : 'sb'} size={9} color={hoy || last ? colors.primary : colors.textSoft}>{p.etiqueta}</Txt>
              </View>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {d.proyeccion.map((p) => (
            <Txt key={p.label} w="sb" size={9} color={colors.textSoft} style={{ flex: 1, textAlign: 'center' }}>{p.label}</Txt>
          ))}
        </View>
      </Card>
      <RecordatorioAhorro />
    </Screen>
  );
}
