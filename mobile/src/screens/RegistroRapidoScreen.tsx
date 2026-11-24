import React, { useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Chip, Ic, IconBox, Segmented, Txt } from '../components/ui';
import { api, fechaLocal } from '../services/api';
import { EstadoConsulta } from '../components/EstadoConsulta';
import { useApi } from '../hooks';
import { colors } from '../theme';
import { Ambito, Frecuencia, TipoMov } from '../types/db';

const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', '⌫'];

export default function RegistroRapidoScreen() {
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { data: catalogo, error, reload } = useApi(api.getCategorias);
  const { data: empresas, error: errorEmpresas, reload: cargarEmpresas } = useApi(api.getEmprendimientos);
  const { data: metodos, error: errorMetodos, reload: cargarMetodos } = useApi(api.getMetodos);
  const [tipo, setTipo] = useState<TipoMov>('Gasto');
  const [ambito, setAmbito] = useState<Ambito>('Personal');
  const [empresa, setEmpresa] = useState<number>();
  const [fallo, setFallo] = useState('');
  const [frec, setFrec] = useState<Frecuencia>('Variable');
  const [txt, setTxt] = useState('');
  const [cat, setCat] = useState<number>();
  const [saving, setSaving] = useState(false);
  const [impulsivo, setImpulsivo] = useState(false);
  if (!catalogo || !empresas || !metodos) {
    return <EstadoConsulta error={error || errorEmpresas || errorMetodos} reload={() => {
      reload(); cargarEmpresas(); cargarMetodos();
    }} />;
  }
  const cats = catalogo.filter((c) => c.activa && c.tipo === tipo);

  const press = (k: string) => {
    if (k === '⌫') return setTxt((t) => t.slice(0, -1));
    if (k === ',' && txt.includes(',')) return;
    if (txt.length >= 9) return;
    setTxt((t) => t + k);
  };
  const valor = Number(txt.replace(',', '.')) || 0;
  const fmt = valor.toFixed(2).replace('.', ',');

  const guardar = async () => {
    if (saving) return;
    setSaving(true);
    setFallo('');
    try {
      const metodoPago = metodos.find((p) => p.nombre === 'Efectivo')?.id_metodo_pago;
      if (ambito === 'Negocio' && !empresa) throw new Error('Selecciona un emprendimiento.');
      if (!cat) throw new Error('Selecciona una categoría.');
      if (!metodoPago) throw new Error('No hay método de pago Efectivo configurado.');
      if (valor <= 0) throw new Error('Ingresa un monto mayor que cero.');
      await api.createMovimiento({
        tipo, monto: valor, ambito, frecuencia: frec, id_categoria: cat,
        id_metodo_pago: metodoPago, id_emprendimiento: empresa,
        fecha: fechaLocal(), impulsivo: tipo === 'Gasto' && impulsivo,
      });
      nav.goBack();
    } catch (e) {
      setFallo(e instanceof Error ? e.message : 'No se pudo guardar el movimiento.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + 8 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 + insets.bottom, gap: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Ic name="flash" size={22} color={colors.primary} />
            <Txt w="xb" size={20}>Registrar movimiento</Txt>
          </View>
          <TouchableOpacity onPress={() => nav.goBack()}><IconBox icon="close" size={36} round={18} color={colors.text} /></TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', backgroundColor: colors.blueSoft, borderRadius: 16, padding: 4 }}>
          {(['Gasto', 'Ingreso'] as const).map((t) => (
            <TouchableOpacity key={t} onPress={() => { setTipo(t); setCat(undefined); }} style={{ flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingVertical: 11, borderRadius: 12, backgroundColor: tipo === t ? '#fff' : 'transparent' }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t === 'Gasto' ? colors.red : colors.primary }} />
              <Txt w="b" size={14} color={tipo === t ? colors.text : colors.textSoft}>Registrar {t}</Txt>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Txt w="sb" size={13} color={colors.textSoft}>Billetera de destino</Txt>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['Personal', 'Negocio'] as const).map((a) => (
              <TouchableOpacity key={a} onPress={() => setAmbito(a)}>
                <Chip label={a} bg={ambito === a ? colors.primary : colors.blueSoft} color={ambito === a ? '#fff' : colors.text} size={12} style={{ paddingVertical: 6, paddingHorizontal: 12 }} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {ambito === 'Negocio' && (
          <View style={{ gap: 8 }}>
            <Txt w="b">Emprendimiento</Txt>
            {empresas.length === 0 && <Txt>No tienes emprendimientos activos.</Txt>}
            {empresas.map((e) => (
              <TouchableOpacity key={e.id_emprendimiento} onPress={() => setEmpresa(e.id_emprendimiento)}>
                <Chip label={e.nombre} bg={empresa === e.id_emprendimiento ? colors.mint : colors.blueSoft} />
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={{ backgroundColor: colors.blueSofter, borderRadius: 20, padding: 16, alignItems: 'center', gap: 4 }}>
          <Txt w="xb" size={40}>
            <Txt w="b" size={22} color={colors.textSoft}>Bs </Txt>{txt || '0'}<Txt w="r" size={40} color={colors.primary}>|</Txt>
          </Txt>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Txt w="b" size={14}>Categoría</Txt>

        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {cats.map((c) => {
            const on = cat === c.id_categoria;
            return (
              <TouchableOpacity key={c.id_categoria} onPress={() => setCat(c.id_categoria)} style={{ alignItems: 'center', gap: 6 }}>
                <IconBox icon={c.icono} size={56} bg={on ? colors.mint : colors.blueSoft} round={18} />
                <Txt w={on ? 'b' : 'sb'} size={11} color={on ? colors.primary : colors.textSoft}>{c.nombre}</Txt>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={{ backgroundColor: colors.blueSofter, borderRadius: 16, padding: 12, gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Txt w="sb" size={12} color={colors.textSoft}>Clasificación</Txt>
            <View style={{ width: 130 }}>
              <Segmented options={['Fijo', 'Variable'] as Frecuencia[]} value={frec} onChange={setFrec} />
            </View>
          </View>
          <TouchableOpacity onPress={() => setImpulsivo(!impulsivo)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ic name="head-question-outline" size={18} color={colors.textSoft} />
            <Txt w="sb" size={13} style={{ flex: 1 }}>¿Gasto impulsivo no planeado?</Txt>
            <Ic name={impulsivo ? 'checkbox-marked' : 'checkbox-blank-outline'} size={22} color={impulsivo ? colors.primary : colors.textSoft} />
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {keys.map((k) => (
            <TouchableOpacity key={k} onPress={() => press(k)} style={{ width: '31.5%', height: 54, borderRadius: 16, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Txt w="b" size={22}>{k}</Txt>
            </TouchableOpacity>
          ))}
        </View>

        {!!fallo && <Txt color={colors.red}>{fallo}</Txt>}
        <Button icon="check-circle" label={saving ? "Guardando…" : "Guardar en 1 paso"} onPress={guardar} />
        <Txt w="b" size={12} color={colors.textSoft} style={{ textAlign: 'center' }}>Bs {fmt}</Txt>
      </ScrollView>
    </View>
  );
}
