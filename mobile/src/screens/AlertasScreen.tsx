import React, { useState } from 'react';
import { Switch, TouchableOpacity, View } from 'react-native';
import { AppHeader, Bar, Button, Card, Chip, Ic, IconBox, Loading, Screen, Txt } from '../components/ui';
import { api } from '../services/api';
import { useApi } from '../hooks';
import { colors, money } from '../theme';

export default function AlertasScreen() {
  const p = useApi(() => api.getPresupuesto());
  const m = useApi(api.getMetas);
  const [tab, setTab] = useState<'alertas' | 'recordatorios'>('alertas');
  const [on, setOn] = useState<Record<number, boolean>>({});
  if (!p || !m) return <Loading />;
  const cats = p.categorias.map((c) => ({ ...c, pct: Math.round((c.gastado / c.limite) * 100) }));
  const ali = cats.find((c) => c.nombre === 'Alimentación')!;
  const ent = cats.find((c) => c.nombre === 'Entretenimiento')!;
  const tra = cats.find((c) => c.nombre === 'Transporte')!;

  return (
    <Screen tabbed={false}>
      <AppHeader subtitle="Alertas y Recordatorios" back />
      <View style={{ flexDirection: 'row', backgroundColor: colors.blueSoft, borderRadius: 20, padding: 4 }}>
        {([['alertas', 'Alertas Activas', '3'], ['recordatorios', 'Recordatorios', '2']] as const).map(([k, l, n]) => (
          <TouchableOpacity key={k} onPress={() => setTab(k)} style={{ flex: 1, flexDirection: 'row', gap: 6, justifyContent: 'center', alignItems: 'center', paddingVertical: 12, borderRadius: 16, backgroundColor: tab === k ? '#fff' : 'transparent' }}>
            <Txt w="b" size={13} color={tab === k ? colors.primary : colors.textSoft}>{l}</Txt>
            <Chip label={n} bg={k === 'alertas' ? colors.redSoft : colors.mint} color={k === 'alertas' ? colors.red : colors.primary} />
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'alertas' ? (
        <>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Txt w="xb" size={20}>🔔 Monitoreo de Presupuestos</Txt>
          </View>
          <Chip label="Actualizado hoy" bg={colors.blueSoft} color={colors.textSoft} style={{ alignSelf: 'flex-end' }} />

          <Card style={{ backgroundColor: colors.redSoft, gap: 10 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <IconBox icon="silverware-fork-knife" bg="#FBD3D3" color={colors.red} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Txt w="b" size={14} color={colors.red}>Alerta Crítica: Alimentación</Txt>
                  <Chip label={`${ali.pct}%`} bg="#FBD3D3" color={colors.red} />
                </View>
                <Txt w="m" size={12} color={colors.textSoft}>Has utilizado {money(ali.gastado, 0)} de tu límite de {money(ali.limite, 0)} a falta de 10 días de terminar el mes.</Txt>
              </View>
            </View>
            <Bar pct={ali.pct} color={colors.red} track="#F6BFBF" />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Txt w="sb" size={11}>Margen restante: {money(ali.limite - ali.gastado, 0)}</Txt>
              <Txt w="sb" size={11}>Ritmo: Bs 12,00 / día</Txt>
            </View>
          </Card>

          <Card style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <IconBox icon="exclamation-thick" bg={colors.red} color="#fff" />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Txt w="b" size={13} color={colors.red}>Límite Excedido</Txt>
                  <Chip label={`+${money(ent.gastado - ent.limite, 0)}`} bg={colors.redSoft} color={colors.red} />
                </View>
                <Txt w="xb" size={18}>Entretenimiento</Txt>
                <Txt w="m" size={12} color={colors.textSoft}>Superaste el 100% de tu asignación mensual. Tu balance disponible se redujo automáticamente.</Txt>
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Txt w="sb" size={11}>↗ Gasto total: {money(ent.gastado, 0)} (Tope {money(ent.limite, 0)})</Txt>
              <Chip label="Ajustar Tope" bg={colors.blueSoft} size={12} style={{ paddingVertical: 8, paddingHorizontal: 14 }} />
            </View>
          </Card>

          <Card style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <IconBox icon="check-decagram" bg={colors.mint} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Txt w="b" size={13} color={colors.primary}>En meta saludable</Txt>
                  <Chip label={`${tra.pct}%`} />
                </View>
                <Txt w="xb" size={18}>Transporte & Movilidad</Txt>
                <Txt w="m" size={12} color={colors.textSoft}>Se mantiene en {tra.pct}% del presupuesto planificado ({money(tra.gastado, 0)} de {money(tra.limite, 0)}). ¡Excelente ritmo de consumo!</Txt>
              </View>
            </View>
            <Bar pct={tra.pct} />
          </Card>

          <Card style={{ backgroundColor: colors.blueSofter, gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Txt w="b" size={13}>Avisarme al alcanzar el límite:</Txt>
              <Txt w="b" size={11} color={colors.primary}>4 activos</Txt>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[50, 75, 90, 100].map((n) => (
                <View key={n} style={{ flex: 1, flexDirection: 'row', gap: 4, justifyContent: 'center', alignItems: 'center', paddingVertical: 10, borderRadius: 20, backgroundColor: colors.primary }}>
                  <Ic name="check" size={14} color="#fff" />
                  <Txt w="b" size={12} color="#fff">{n}%</Txt>
                </View>
              ))}
            </View>
          </Card>
        </>
      ) : null}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Txt w="xb" size={18}>📅 Metas de Ahorro Recurrente</Txt>
        <Txt w="b" size={11} color={colors.primary}>2 Activas</Txt>
      </View>
      {m.metas.map((x) => {
        const active = on[x.id_meta] ?? true;
        const pct = Math.round((x.ahorrado / x.objetivo) * 100);
        return (
          <Card key={x.id_meta} style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <IconBox icon={x.icono} size={48} bg={colors.mintSoft} />
              <View style={{ flex: 1 }}>
                <Txt w="xb" size={17}>{x.nombre === 'Nuevo celular' ? 'Nuevo Celular' : 'Viaje de Vacaciones'}</Txt>
                <Txt w="m" size={12} color={colors.textSoft}>
                  {x.programado ? 'Día 5 de cada mes' : `Meta: ${money(x.objetivo, 0)} (${pct}% alcanzado)`}
                </Txt>
              </View>
              <Switch value={active} onValueChange={(v) => setOn({ ...on, [x.id_meta]: v })} trackColor={{ true: colors.primary, false: colors.gray }} thumbColor="#fff" />
            </View>
            {x.programado ? (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.blueSofter, borderRadius: 16, padding: 14 }}>
                <View>
                  <Txt w="sb" size={11} color={colors.textSoft}>Monto mensual</Txt>
                  <Txt w="xb" size={18}>Bs 400,00</Txt>
                </View>
                <Chip label="↻ Débito automático" bg="#fff" color={colors.primary} />
              </View>
            ) : (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.blueSofter, borderRadius: 16, padding: 14 }}>
                  <View>
                    <Txt w="sb" size={11} color={colors.textSoft}>Aporte sugerido</Txt>
                    <Txt w="xb" size={20} color={colors.primary}>Bs 100,00 <Txt w="m" size={12} color={colors.textSoft}>/ semana</Txt></Txt>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Txt w="sb" size={11} color={colors.textSoft}>Próximo aviso</Txt>
                    <Txt w="b" size={12}>Lun 28 Sep, 09:00 AM</Txt>
                  </View>
                </View>
                <Button icon="plus-circle-outline" label="Aportar ahora" />
              </>
            )}
          </Card>
        );
      })}
      <TouchableOpacity style={{ backgroundColor: colors.blueSoft, borderRadius: 20, padding: 16, alignItems: 'center' }}>
        <Txt w="b" size={14} color={colors.primary}>＋ Crear nuevo recordatorio de ahorro</Txt>
      </TouchableOpacity>

      <Card style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <IconBox icon="trophy-outline" size={48} bg={colors.mint} />
          <View style={{ flex: 1 }}>
            <Txt w="xb" size={17}>¡Racha de Ahorro Cumplida!</Txt>
            <Txt w="m" size={12} color={colors.textSoft}>Llevas {m.racha} semanas consecutivas apartando tu dinero antes de gastar.</Txt>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[1, 2, 3, 4].map((n) => (
            <View key={n} style={{ flex: 1, alignItems: 'center', gap: 4, paddingVertical: 10, borderRadius: 14, backgroundColor: colors.blueSofter }}>
              <Ic name={n === 4 ? 'star-circle' : 'check-circle'} size={18} color={colors.primary} />
              <Txt w="b" size={11}>Sem {n}</Txt>
            </View>
          ))}
        </View>
        <View style={{ backgroundColor: colors.blueSofter, borderRadius: 16, padding: 14, gap: 4 }}>
          <Txt w="b" size={11} color={colors.primary}>HÁBITO FINANGO</Txt>
          <Txt w="m" size={12} color={colors.textSoft}>Apartar tus ahorros el primer día que recibes tu sueldo reduce el impulso de compras no planificadas en un 35%.</Txt>
        </View>
      </Card>
    </Screen>
  );
}
