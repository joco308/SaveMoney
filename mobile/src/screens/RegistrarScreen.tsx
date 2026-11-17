import React, { useState } from 'react';
import { Switch, TextInput, TouchableOpacity, View, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, Chip, Ic, IconBox, Loading, Segmented, StackHeader, Txt } from '../components/ui';
import { api } from '../services/api';
import { useApi } from '../hooks';
import { colors, font } from '../theme';
import { Ambito, Frecuencia, MetodoPago, TipoMov } from '../types/db';

const metodos: { l: MetodoPago; i: string }[] = [
  { l: 'Efectivo', i: 'cash' },
  { l: 'Tarjeta', i: 'credit-card-outline' },
  { l: 'QR Bancario', i: 'qrcode' },
];

export default function RegistrarScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const cats = useApi(api.getCategorias);

  const [tipo, setTipo] = useState<TipoMov>(route.params?.tipo ?? 'Gasto');
  const [monto, setMonto] = useState('180');
  const [frecuencia, setFrecuencia] = useState<Frecuencia>('Variable');
  const [ambito, setAmbito] = useState<Ambito>('Personal');
  const [impulsivo, setImpulsivo] = useState(false);
  const [cat, setCat] = useState<number | undefined>();
  const [metodo, setMetodo] = useState<MetodoPago>('QR Bancario');
  const [nota, setNota] = useState('');
  const [saving, setSaving] = useState(false);

  if (!cats) return <Loading />;
  const gasto = tipo === 'Gasto';
  const valor = parseFloat(monto.replace(',', '.')) || 0;
  const fmt = valor.toFixed(2).replace('.', ',');
  const hoy = new Date();
  const fechaTxt = `Hoy, ${hoy.getDate()} ${['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][hoy.getMonth()]} ${hoy.getFullYear()}`;

  const guardar = async () => {
    if (valor <= 0) return;
    setSaving(true);
    await api.createMovimiento({
      tipo, monto: valor, ambito, frecuencia, id_categoria: gasto ? cat : undefined,
      metodoPago: metodo, fecha: hoy.toISOString().slice(0, 10), nota, impulsivo: gasto && impulsivo,
    });
    setSaving(false);
    nav.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 14 }} keyboardShouldPersistTaps="handled">
        <StackHeader title={gasto ? 'Registra tus gastos' : 'Registra tus ingresos'} close />

        <View style={{ flexDirection: 'row', backgroundColor: colors.blueSoft, borderRadius: 24, padding: 4 }}>
          {([['Gasto', 'trending-down'], ['Ingreso', 'trending-up']] as const).map(([t, i]) => {
            const on = tipo === t;
            return (
              <TouchableOpacity key={t} onPress={() => setTipo(t)} style={{ flex: 1, flexDirection: 'row', gap: 6, justifyContent: 'center', alignItems: 'center', paddingVertical: 12, borderRadius: 20, backgroundColor: on ? (t === 'Gasto' ? colors.red : colors.primary) : 'transparent' }}>
                <Ic name={i} size={18} color={on ? '#fff' : colors.textSoft} />
                <Txt w="b" size={14} color={on ? '#fff' : colors.textSoft}>Registrar {t}</Txt>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ alignItems: 'center', gap: 6 }}>
          <Txt w="sb" size={12} color={colors.textSoft}>MONTO A REGISTRAR</Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Txt w="xb" size={22} color={gasto ? colors.red : colors.primary}>Bs</Txt>
            <TextInput
              value={monto} onChangeText={setMonto} keyboardType="decimal-pad"
              style={{ fontFamily: font.xb, fontSize: 40, color: colors.text, minWidth: 120, textAlign: 'center' }}
            />
          </View>
          <Chip label={`Bs ${Math.round(valor)}`} bg={colors.mintSoft} />
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Card style={{ flex: 1, padding: 12, gap: 8 }}>
            <Txt w="b" size={11} color={colors.textSoft}>⇄ FRECUENCIA</Txt>
            <Segmented options={['Fijo', 'Variable'] as Frecuencia[]} value={frecuencia} onChange={setFrecuencia} />
          </Card>
          <Card style={{ flex: 1, padding: 12, gap: 8 }}>
            <Txt w="b" size={11} color={colors.textSoft}>ÁMBITO</Txt>
            <Segmented options={['Personal', 'Negocio'] as Ambito[]} value={ambito} onChange={setAmbito} />
          </Card>
        </View>

        {gasto ? (
          <>
            <Card style={{ backgroundColor: colors.redSoft, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }}>
              <IconBox icon="fire" size={40} bg={colors.red} color="#fff" round={20} />
              <View style={{ flex: 1 }}>
                <Txt w="b" size={14}>¿Gasto impulsivo o antojo?</Txt>
                <Txt w="m" size={12} color={colors.textSoft}>Ayuda a calcular tus fugas del mes</Txt>
              </View>
              <Switch value={impulsivo} onValueChange={setImpulsivo} trackColor={{ true: colors.red, false: colors.gray }} thumbColor="#fff" />
            </Card>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Txt w="xb" size={20}>Categoría</Txt>
              <Txt w="sb" size={12} color={colors.textSoft}>Obligatorio</Txt>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {cats.map((c) => {
                const on = cat === c.id_categoria;
                return (
                  <TouchableOpacity key={c.id_categoria} onPress={() => setCat(c.id_categoria)} style={{ width: '23%', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderRadius: 18, paddingVertical: 12, borderWidth: 2, borderColor: on ? colors.primary : 'transparent' }}>
                    <IconBox icon={c.icono} size={44} bg={on ? colors.mint : colors.blueSoft} />
                    <Txt w="b" size={11} numberOfLines={1}>{c.nombre}</Txt>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : null}

        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }}>
          <IconBox icon="calendar-blank-outline" size={40} />
          <View style={{ flex: 1 }}>
            <Txt w="sb" size={11} color={colors.textSoft}>Fecha de operación</Txt>
            <Txt w="b" size={15}>{fechaTxt}</Txt>
          </View>
          <IconBox icon="calendar-edit" size={36} round={18} />
        </Card>

        <Card style={{ gap: 12, padding: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <IconBox icon="wallet-outline" size={40} />
            <View>
              <Txt w="sb" size={11} color={colors.textSoft}>Cuenta de origen</Txt>
              <Txt w="b" size={15}>{metodo === 'QR Bancario' ? 'Transferencia QR (BNB)' : metodo}</Txt>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {metodos.map((m) => {
              const on = metodo === m.l;
              return (
                <TouchableOpacity key={m.l} onPress={() => setMetodo(m.l)} style={{ flex: 1, flexDirection: 'row', gap: 4, justifyContent: 'center', alignItems: 'center', paddingVertical: 10, borderRadius: 14, backgroundColor: on ? colors.primary : colors.blueSoft }}>
                  <Ic name={m.i} size={14} color={on ? '#fff' : colors.textSoft} />
                  <Txt w="b" size={11} color={on ? '#fff' : colors.textSoft}>{m.l}</Txt>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }}>
          <IconBox icon="file-document-outline" size={40} />
          <View style={{ flex: 1 }}>
            <Txt w="sb" size={11} color={colors.textSoft}>Nota o detalle</Txt>
            <TextInput value={nota} onChangeText={setNota} placeholder={gasto ? 'Almuerzo de trabajo' : 'Salario'} placeholderTextColor={colors.textSoft}
              style={{ fontFamily: font.b, fontSize: 15, color: colors.text, padding: 0 }} />
          </View>
        </Card>

        <Card style={{ backgroundColor: colors.blueSofter, flexDirection: 'row', gap: 10, alignItems: 'center', padding: 12 }}>
          <IconBox icon="check-decagram-outline" size={32} bg={colors.mint} round={16} />
          <Txt w="m" size={12} color={colors.textSoft} style={{ flex: 1 }}>
            Se sincronizará instantáneamente con tu presupuesto mensual y recalculará tu meta de ahorro.
          </Txt>
        </Card>

        <Button
          icon="check-circle-outline"
          label={saving ? 'Guardando…' : `Guardar ${tipo === 'Gasto' ? 'Movimiento' : 'Ingreso'} (Bs ${fmt})`}
          onPress={guardar}
        />
      </ScrollView>
    </View>
  );
}
