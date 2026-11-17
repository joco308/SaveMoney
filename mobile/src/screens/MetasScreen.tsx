import React, { useState } from 'react';
import { Switch, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { AppHeader, Bar, Button, Card, Chip, Ic, IconBox, Loading, Screen, Txt } from '../components/ui';
import { api } from '../services/api';
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
  const d = useApi(api.getMetas);
  const [rec, setRec] = useState<boolean[]>([true, false]);
  if (!d) return <Loading />;
  const pctG = Math.round((d.totalAcumulado / d.objetivoGlobal) * 100);
  const maxV = Math.max(...d.proyeccion.map((p) => p.valor));

  return (
    <Screen>
      <AppHeader subtitle="Ahorro" />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View>
          <Txt w="b" size={11} color={colors.primary}>TUS PROYECTOS</Txt>
          <Txt w="xb" size={24}>Mis Metas de Ahorro</Txt>
        </View>
        <TouchableOpacity style={{ flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: colors.primary, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 }}>
          <Ic name="plus-circle-outline" size={16} color="#fff" />
          <Txt w="b" size={12} color="#fff">Nueva meta</Txt>
        </TouchableOpacity>
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
        const pct = Math.round((m.ahorrado / m.objetivo) * 100);
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
            ) : (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.blueSofter, borderRadius: 16, padding: 12 }}>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <Ic name="autorenew" size={18} color={colors.primary} />
                  <View>
                    <Txt w="sb" size={10} color={colors.textSoft}>Aporte programado</Txt>
                    <Txt w="b" size={13}>{m.programado}</Txt>
                  </View>
                </View>
                <Chip label={m.debito ?? ''} bg="#fff" color={colors.text} w="sb" />
              </View>
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Txt w="b" size={12} color={colors.textSoft}>{m.recordatorio}</Txt>
              <Txt w="b" size={12} color={colors.primary}>Aportar →</Txt>
            </View>
          </Card>
        );
      })}

      <Card style={{ gap: 12 }}>
        <Txt w="xb" size={18}>Proyección y Crecimiento</Txt>
        <Txt w="m" size={12} color={colors.textSoft}>Estimación según tu ritmo actual</Txt>
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
        <View style={{ backgroundColor: colors.mintSoft, borderRadius: 16, padding: 12 }}>
          <Txt w="m" size={12}>Manteniendo un ahorro de <Txt w="b" size={12}>Bs 800/mes</Txt>, completarás todas tus metas en <Txt w="b" size={12}>9 semanas antes</Txt> de lo previsto.</Txt>
        </View>
      </Card>

      <Card style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Txt w="xb" size={17}>🔔 Recordatorios Automáticos</Txt>
          <Chip label="1 Activo" bg={colors.blueSoft} color={colors.textSoft} />
        </View>
        {[
          { t: 'Ahorro semanal para Celular', s: 'Bs 100 cada Lunes a las 09:00 AM', i: 'cellphone' },
          { t: 'Refuerzo fin de mes Viaje', s: 'Recordatorio de depósito voluntario', i: 'airplane' },
        ].map((r, i) => (
          <View key={r.t} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.blueSofter, borderRadius: 16, padding: 12 }}>
            <IconBox icon={r.i} size={36} bg="#fff" />
            <View style={{ flex: 1 }}>
              <Txt w="b" size={13}>{r.t}</Txt>
              <Txt w="m" size={11} color={colors.textSoft}>{r.s}</Txt>
            </View>
            <Switch value={rec[i]} onValueChange={(v) => setRec(rec.map((x, j) => (j === i ? v : x)))} trackColor={{ true: colors.primary, false: colors.gray }} thumbColor="#fff" />
          </View>
        ))}
        <TouchableOpacity style={{ backgroundColor: colors.mintSoft, borderRadius: 16, padding: 14, alignItems: 'center' }}>
          <Txt w="b" size={13} color={colors.primary}>+ Crear recordatorio</Txt>
        </TouchableOpacity>
      </Card>

      <Card style={{ backgroundColor: colors.blueSoft, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <IconBox icon="medal-outline" size={48} bg={colors.mint} round={24} />
        <View style={{ flex: 1 }}>
          <Txt w="xb" size={14}>¡Racha de Ahorro: {d.racha} semanas!</Txt>
          <Txt w="m" size={12} color={colors.textSoft}>Completaste tus aportes a tiempo. Has desbloqueado la insignia 'Ahorrista Disciplinado'.</Txt>
        </View>
      </Card>
    </Screen>
  );
}
