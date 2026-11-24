import React, { useCallback, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { AppHeader, Card, Chip, Ic, IconBox, Screen, SectionTitle, Txt, Bar } from '../components/ui';
import { api } from '../services/api';
import { EstadoConsulta } from '../components/EstadoConsulta';
import { useApi } from '../hooks';
import { colors, money } from '../theme';

export default function MovimientosScreen() {
  const [tab, setTab] = useState<'Todos' | 'Personal' | 'Negocio'>('Todos');
  const consultar = useCallback(() => api.getNegocio(tab), [tab]);
  const { data: d, error, reload } = useApi(consultar);
  if (!d) return <EstadoConsulta error={error} reload={reload} />;
  const total = d.personal + d.negocio;
  const fijoPct = Math.round((d.fijos / Math.max(1, d.fijos + d.variables)) * 100);

  return (
    <Screen>
      <AppHeader subtitle="Movimientos" />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Txt w="b" size={11} color={colors.primary}>FINANZAS HÍBRIDAS</Txt>
          <Txt w="xb" size={26}>Mis Gastos</Txt>
        </View>
        <Chip label={new Date().toLocaleDateString('es-BO', { month: 'short', year: 'numeric' })} size={12} style={{ paddingVertical: 8, paddingHorizontal: 14 }} />
      </View>

      <View style={{ flexDirection: 'row', backgroundColor: colors.blueSoft, borderRadius: 16, padding: 4 }}>
        {(['Todos', 'Personal', 'Negocio'] as const).map((t) => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: tab === t ? '#fff' : 'transparent' }}>
            <Txt w={tab === t ? 'b' : 'sb'} size={13} color={tab === t ? colors.primary : colors.textSoft}>{t}</Txt>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Card style={{ flex: 1, gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <IconBox icon="account-outline" size={36} />
            <Chip label={`${Math.round((d.personal / Math.max(1, total)) * 100)}%`} bg={colors.blueSoft} />
          </View>
          <Txt w="m" size={12} color={colors.textSoft}>Gastos personales</Txt>
          <Txt w="b" size={20}>{money(d.personal)}</Txt>
          <Bar pct={(d.personal / Math.max(1, total)) * 100} />
        </Card>
        <Card style={{ flex: 1, gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <IconBox icon="office-building-outline" size={36} bg={colors.mintSoft} />
            <Chip label={`${Math.round((d.negocio / Math.max(1, total)) * 100)}%`} />
          </View>
          <Txt w="m" size={12} color={colors.textSoft}>Gastos del negocio</Txt>
          <Txt w="b" size={20}>{money(d.negocio)}</Txt>
          <Txt w="sb" size={10} color={colors.primary}>● {d.nombreNegocio}</Txt>
        </Card>
      </View>

      <Card style={{ backgroundColor: colors.blueSofter, gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Txt w="b" size={14}>Tipo de Gasto (Total)</Txt>
          <Txt w="m" size={12} color={colors.textSoft}>{money(total, 0)} total</Txt>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Card style={{ flex: 1, padding: 12, borderRadius: 16 }}>
            <Txt w="m" size={11} color={colors.textSoft}>Fijos ({fijoPct}%)</Txt>
            <Txt w="b" size={16}>{money(d.fijos)}</Txt>
          </Card>
          <Card style={{ flex: 1, padding: 12, borderRadius: 16 }}>
            <Txt w="m" size={11} color={colors.textSoft}>Variables ({100 - fijoPct}%)</Txt>
            <Txt w="b" size={16}>{money(d.variables)}</Txt>
          </Card>
        </View>
      </Card>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Txt w="xb" size={18}>Mis Negocios</Txt>
          <Chip label={`${d.negocios.length} Activo`} />
        </View>
        <Chip label="＋ Nuevo" bg={colors.blueSoft} size={12} />
      </View>
      {d.negocios.map((n) => (
        <Card key={n.id} style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <IconBox icon="coffee-outline" size={56} bg={colors.mint} round={18} />
            <View style={{ flex: 1 }}>
              <Txt w="xb" size={16}>{n.nombre} <Ic name="check-decagram" size={14} color={colors.primary} /></Txt>
              <Txt w="m" size={12} color={colors.textSoft}>Categoría: {n.categoria}</Txt>
            </View>
            <Ic name="dots-vertical" size={20} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Txt w="b" size={12} color={colors.primary}>● Operando normalmente</Txt>
            <Txt w="m" size={12} color={colors.textSoft}>Límite mensual: <Txt w="b" size={12}>{money(n.limite, 0)}</Txt></Txt>
          </View>
        </Card>
      ))}

      <SectionTitle title="Movimientos de Negocio" />
      {d.movimientos.map((m) => (
        <Card key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
          <IconBox icon={m.icono} />
          <View style={{ flex: 1, gap: 4 }}>
            <Txt w="b" size={14}>{m.titulo}</Txt>
            <Chip label={m.detalle} bg={colors.blueSoft} color={colors.textSoft} w="sb" style={{ alignSelf: 'flex-start' }} />
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Txt w="b" size={15}>{m.tipo === 'Ingreso' ? '+' : '-'} {money(Math.abs(m.monto))}</Txt>
            <Txt w="sb" size={11} color={colors.primary}>{m.frecuencia}</Txt>
          </View>
        </Card>
      ))}

      <Card style={{ backgroundColor: colors.mintSoft, flexDirection: 'row', gap: 10 }}>
        <Ic name="lightbulb-on-outline" size={20} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Txt w="b" size={13}>Consejo Inteligente FinanGo</Txt>
          <Txt w="m" size={12} color={colors.textSoft}>Mantener cuentas claras te ayuda a deducir costos operativos con facilidad al cierre de trimestre.</Txt>
        </View>
      </Card>
    </Screen>
  );
}
