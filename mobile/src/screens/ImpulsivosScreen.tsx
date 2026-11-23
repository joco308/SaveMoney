import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppHeader, Bar, Card, Chip, Ic, IconBox, Screen, Txt } from '../components/ui';
import { api } from '../services/api';
import { EstadoConsulta } from '../components/EstadoConsulta';
import { useApi } from '../hooks';
import { colors, money } from '../theme';

export default function ImpulsivosScreen() {
  const { data: d, error, reload } = useApi(api.getImpulsivas);
  if (!d) return <EstadoConsulta error={error} reload={reload} />;

  return (
    <Screen tabbed={false}>
      <AppHeader subtitle="Presupuesto" back />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Chip label="🛡 Autocontrol Activo" size={11} />
        <Txt w="sb" size={12} color={colors.textSoft}>{d.mes}</Txt>
      </View>
      <View>
        <Txt w="xb" size={24}>Control de Gastos Impulsivos</Txt>
        <Txt w="m" size={13} color={colors.textSoft}>Monitorea y modera tus compras espontáneas para cuidar tus metas.</Txt>
      </View>

      <LinearGradient colors={[colors.primaryDark, '#00785A']} style={{ borderRadius: 28, padding: 20, gap: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Chip label="Este mes" bg="rgba(255,255,255,0.15)" color="#fff" />
          <Txt w="b" size={11} color={colors.mint}>↗ +{d.variacionPct}% vs mes pasado</Txt>
        </View>
        <Txt w="m" size={13} color="rgba(255,255,255,0.8)">Gastos impulsivos este mes</Txt>
        <Txt w="xb" size={36} color="#fff">{money(d.total)}</Txt>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: 12 }}>
            <Txt w="m" size={11} color="rgba(255,255,255,0.8)">Frecuencia</Txt>
            <Txt w="xb" size={17} color="#fff">{d.compras} compras</Txt>
            <Txt w="b" size={11} color={colors.mint}>espontáneas</Txt>
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: 12 }}>
            <Txt w="m" size={11} color="rgba(255,255,255,0.8)">Impacto total</Txt>
            <Txt w="xb" size={17} color="#fff">{d.impactoPct}%</Txt>
            <Txt w="b" size={11} color={colors.mint}>de gastos del mes</Txt>
          </View>
        </View>
      </LinearGradient>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Txt w="xb" size={19}>Categorías más tentadoras</Txt>
          <Txt w="m" size={12} color={colors.textSoft}>Donde se concentran tus decisiones no planeadas</Txt>
        </View>
        <Txt w="b" size={11} color={colors.primary}>{d.categorias.length}{'\n'}áreas</Txt>
      </View>
      {d.categorias.map((c) => (
        <Card key={c.nombre} style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <IconBox icon={c.icono} bg={colors.blueSoft} color={c.color} />
            <View style={{ flex: 1 }}>
              <Txt w="b" size={14}>{c.nombre}</Txt>
              <Txt w="m" size={11} color={colors.textSoft}>{c.compras} {c.compras === 1 ? 'compra registrada' : 'compras registradas'}</Txt>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Txt w="xb" size={17}>{money(c.monto)}</Txt>
              <Txt w="sb" size={10} color={colors.textSoft}>{c.pct}% del total</Txt>
            </View>
          </View>
          <Bar pct={c.pct} color={c.color} />
        </Card>
      ))}

      <Card style={{ backgroundColor: colors.blueSofter, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <IconBox icon="lightbulb-on-outline" size={40} bg={colors.mint} round={20} />
          <Txt w="xb" size={18} style={{ flex: 1 }}>Consejo Inteligente</Txt>
          <Chip label="Algoritmo FinanGo" bg="#fff" color={colors.primary} />
        </View>
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, flexDirection: 'row', gap: 10 }}>
          <Ic name="timer-outline" size={22} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Txt w="b" size={13}>Regla de las 24 horas recomendada</Txt>
            <Txt w="m" size={12} color={colors.textSoft}>Has realizado <Txt w="b" size={12}>{d.compras24h} compras impulsivas en las últimas 24 horas</Txt>. Considera pausar 24 horas antes de confirmar cualquier compra no planificada mayor a Bs 50,00.</Txt>
          </View>
        </View>
        <View style={{ backgroundColor: colors.mintSoft, borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ic name="clipboard-check-outline" size={18} color={colors.primary} />
          <Txt w="b" size={12} style={{ flex: 1 }}>¿Tentado a comprar algo ahora mismo?</Txt>
          <Chip label="Activar temporizador" bg="#fff" color={colors.primary} size={11} />
        </View>
      </Card>
    </Screen>
  );
}
