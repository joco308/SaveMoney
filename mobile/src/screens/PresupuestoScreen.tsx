import React, { useCallback, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppHeader, Bar, Card, Chip, Ic, IconBox, Screen, Txt, FormField, FormSheet } from '../components/ui';
import { api } from '../services/api';
import { EstadoConsulta } from '../components/EstadoConsulta';
import { useApi } from '../hooks';
import { colors, money } from '../theme';

export const estadoCat = (pct: number) => {
  if (pct > 100) return { color: colors.red, txt: 'Requiere ajuste', chip: `Superado (+${pct - 100}%)`, chipBg: colors.redSoft, icon: 'alert-circle-outline', iconBg: colors.redSoft };
  if (pct >= 80) return { color: colors.amber, txt: 'Próximo al tope', chip: `${pct}% utilizado`, chipBg: '#E8F5C8', icon: 'alert-outline', iconBg: colors.amberSoft };
  if (pct >= 60) return { color: colors.primary, txt: pct >= 65 ? 'Estable' : 'Normal', chip: 'En meta', chipBg: colors.mintSoft, icon: 'check-circle-outline', iconBg: colors.mintSoft };
  return { color: colors.green, txt: 'En rango óptimo', chip: 'En meta', chipBg: colors.mintSoft, icon: 'check-circle-outline', iconBg: colors.mintSoft };
};

export default function PresupuestoScreen() {
  const nav = useNavigation<any>();
  const [periodo, setPeriodo] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const consultar = useCallback(() => api.getPresupuesto(periodo.getFullYear(), periodo.getMonth() + 1), [periodo]);
  const { data: d, error, reload } = useApi(consultar);
  const [editando, setEditando] = useState(false);
  const [monto, setMonto] = useState('');
  const [umbral, setUmbral] = useState(75);
  const [saving, setSaving] = useState(false);
  const [fallo, setFallo] = useState('');
  const guardar = async () => {
    if (saving) return;
    const value = Number(monto.replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0) { setFallo('Ingresa un presupuesto mayor que cero.'); return; }
    setSaving(true); setFallo('');
    try {
      await api.savePresupuesto(value, umbral, periodo.getFullYear(), periodo.getMonth() + 1);
      setEditando(false); reload();
    } catch (e) { setFallo(e instanceof Error ? e.message : 'No se pudo guardar el presupuesto.'); }
    finally { setSaving(false); }
  };
  if (!d) return <EstadoConsulta error={error} reload={reload} />;
  const u = d.umbrales;
  const pctTotal = d.total > 0 ? Math.round((d.gastado / d.total) * 100) : 0;
  const disponible = d.total - d.gastado;
  const cats = d.categorias.map((c) => ({ ...c, pct: c.limite > 0 ? Math.round((c.gastado / c.limite) * 100) : 0 }));
  const avisos = cats.filter((c) => c.pct >= 80).slice(0, 3);

  return (
    <Screen>
      <AppHeader subtitle="Presupuesto" />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.blueSoft, borderRadius: 28, paddingHorizontal: 14, paddingVertical: 12 }}>
          <TouchableOpacity onPress={() => setPeriodo(new Date(periodo.getFullYear(), periodo.getMonth() - 1, 1))}><Ic name="chevron-left" size={22} color={colors.primary} /></TouchableOpacity>
          <Ic name="calendar-blank-outline" size={20} color={colors.primary} />
          <Txt w="b" size={14} style={{ flex: 1, textAlign: 'center' }}>{d.mesLabel}</Txt>
          <TouchableOpacity onPress={() => setPeriodo(new Date(periodo.getFullYear(), periodo.getMonth() + 1, 1))}><Ic name="chevron-right" size={22} color={colors.primary} /></TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => { setMonto(d.total ? String(d.total) : ''); setUmbral(d.umbrales[0]?.pct ?? 75); setFallo(''); setEditando(true); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderRadius: 28, paddingHorizontal: 16 }}>
          <Ic name="pencil-box-outline" size={18} color={colors.primary} />
          <Txt w="b" size={12} style={{ textAlign: 'center' }}>Editar{'\n'}presupuesto</Txt>
        </TouchableOpacity>
      </View>
      {!!fallo && !editando && <Txt color={colors.red}>{fallo}</Txt>}

      <Card style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Txt w="b" size={11} color={colors.textSoft}>PRESUPUESTO MENSUAL</Txt>
          <Chip label="● Activo" />
        </View>
        <Txt w="xb" size={34}><Txt w="b" size={18}>Bs </Txt>{d.total.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</Txt>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Txt w="sb" size={11} color={colors.textSoft}>Progreso general</Txt>
          <Txt w="b" size={11} color={colors.primary}>{pctTotal}% consumido</Txt>
        </View>
        <Bar pct={pctTotal} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: colors.blueSofter, borderRadius: 16, padding: 12 }}>
            <Txt w="sb" size={11} color={colors.textSoft}>↘ Total gastado</Txt>
            <Txt w="b" size={17}>{money(d.gastado)}</Txt>
            <Txt w="m" size={11} color={colors.textSoft}>{pctTotal}% del total</Txt>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.mintSoft, borderRadius: 16, padding: 12 }}>
            <Txt w="sb" size={11} color={colors.textSoft}>Disponible restante</Txt>
            <Txt w="b" size={17} color={colors.primary}>{money(disponible)}</Txt>
            <Txt w="m" size={11} color={colors.textSoft}>{100 - pctTotal}% disponible</Txt>
          </View>
        </View>
      </Card>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => nav.navigate('Alertas')} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Ic name="chart-timeline-variant" size={20} color={colors.primary} />
          <Txt w="xb" size={18}>Alertas inteligentes</Txt>
        </TouchableOpacity>
        <Chip label={`${avisos.length} avisos`} bg={colors.blueSoft} color={colors.textSoft} />
      </View>
      {avisos.map((c) => {
        const e = estadoCat(c.pct);
        return (
          <Card key={c.id_categoria} style={{ flexDirection: 'row', gap: 12 }}>
            <IconBox icon={e.icon} bg={e.iconBg} color={e.color} />
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Txt w="b" size={15}>{c.nombre}</Txt>
                <Chip label={e.chip} bg={e.chipBg} color={e.color} />
              </View>
              <Txt w="m" size={12} color={colors.textSoft}>
                {c.pct > 100
                  ? `Has superado tu límite de ${c.nombre} (${c.pct}% gastado - ${money(c.gastado, 0)} de ${money(c.limite, 0)}).`
                  : c.pct >= 80
                    ? `Has utilizado el ${c.pct}% de tu presupuesto previsto (${money(c.gastado, 0)} de ${money(c.limite, 0)}).`
                    : `Tus gastos de ${c.nombre} van dentro de lo planificado (${c.pct}% utilizado).`}
              </Txt>
            </View>
          </Card>
        );
      })}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Txt w="xb" size={18}>Desglose por categoría</Txt>
        <Txt w="b" size={12} color={colors.primary}>Ver historial</Txt>
      </View>
      {cats.map((c) => {
        const e = estadoCat(c.pct);
        const over = c.pct > 100;
        return (
          <Card key={c.id_categoria} style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <IconBox icon={c.icono} bg={over ? colors.redSoft : colors.blueSoft} color={over ? colors.red : colors.primary} />
              <View style={{ flex: 1 }}>
                <Txt w="b" size={15}>{c.nombre}</Txt>
                <Txt w="sb" size={11} color={over ? colors.red : colors.textSoft}>
                  {over ? `Excedido por ${money(c.gastado - c.limite, 0)}` : `Quedan ${money(c.limite - c.gastado, 0)}`}
                </Txt>
              </View>
              <Txt w="xb" size={20} color={over ? colors.red : colors.text}>{money(c.gastado, 0)}<Txt w="m" size={12} color={colors.textSoft}> / {money(c.limite, 0)}</Txt></Txt>
            </View>
            <Bar pct={c.pct} color={e.color} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Txt w="sb" size={11} color={over ? colors.red : colors.textSoft}>{over ? `${c.pct}% - Límite rebasado` : `${c.pct}% ejecutado`}</Txt>
              <Txt w="b" size={11} color={e.color}>{e.txt}</Txt>
            </View>
          </Card>
        );
      })}

      <TouchableOpacity onPress={() => nav.navigate('Impulsivos')}>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <IconBox icon="head-question-outline" bg={colors.amberSoft} color={colors.amber} />
          <Txt w="b" size={14} style={{ flex: 1 }}>Control de gastos impulsivos</Txt>
          <Ic name="chevron-right" size={22} />
        </Card>
      </TouchableOpacity>

      <Card style={{ gap: 12 }}>
        <Txt w="xb" size={15}>Umbral de alerta</Txt>
        <Txt w="m" size={12} color={colors.textSoft}>Porcentaje configurado en el presupuesto</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {u.map((x) => (
            <TouchableOpacity key={x.pct} onPress={() => { setMonto(d.total ? String(d.total) : ''); setUmbral(x.pct); setFallo(''); setEditando(true); }} style={{ width: '47%', flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 16, padding: 14, backgroundColor: x.activo ? colors.primary : colors.blueSofter }}>
              <Ic name={x.activo ? 'check-circle-outline' : 'circle-outline'} size={18} color={x.activo ? '#fff' : colors.textSoft} />
              <Txt w="b" size={13} color={x.activo ? '#fff' : colors.textSoft}>Al {x.pct}% <Txt w="sb" size={11} color={x.activo ? colors.mint : colors.textSoft}>{x.activo ? 'Activo' : 'Off'}</Txt></Txt>
            </TouchableOpacity>
          ))}
        </View>
        {u.length === 0 && <Txt>No hay un presupuesto personal para este mes.</Txt>}
      </Card>
      <FormSheet visible={editando} title="Editar presupuesto mensual" saving={saving} onClose={() => setEditando(false)} onSave={guardar}>
        <FormField label="Límite mensual (Bs)" value={monto} onChangeText={setMonto} placeholder="5000" keyboardType="decimal-pad" />
        <Txt w="b" size={12} color={colors.textSoft}>Avisarme al alcanzar</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {[50, 75, 90, 100].map((pct) => <TouchableOpacity key={pct} onPress={() => setUmbral(pct)}><Chip label={`${pct}%${umbral === pct ? ' · Activo' : ''}`} bg={umbral === pct ? colors.primary : colors.blueSoft} color={umbral === pct ? '#fff' : colors.text} /></TouchableOpacity>)}
        </View>
        {!!fallo && <Txt color={colors.red}>{fallo}</Txt>}
      </FormSheet>
    </Screen>
  );
}
