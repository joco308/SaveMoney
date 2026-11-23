import React, { useState } from 'react';
import { EstadoConsulta } from '../components/EstadoConsulta';
import { useApi } from '../hooks';
import { api } from '../services/api';
import { getSupabase } from '../services/supabase';
import { Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppHeader, Button, Card, Ic, IconBox, Screen, Txt } from '../components/ui';
import { colors } from '../theme';

export default function PerfilScreen() {
  const nav = useNavigation<any>();
  const { data: perfil, error, reload } = useApi(api.getPerfil);
  const [fallo, setFallo] = useState('');
  if (!perfil) return <EstadoConsulta error={error} reload={reload} />;
  const items = [
    { t: 'Resumen financiero y gráficos', i: 'chart-box-outline', go: 'Resumen' },
    { t: 'Alertas y recordatorios', i: 'bell-outline', go: 'Alertas' },
    { t: 'Control de gastos impulsivos', i: 'head-question-outline', go: 'Impulsivos' },
  ];
  return (
    <Screen fab={false}>
      <AppHeader subtitle="Perfil" />
      <Card style={{ alignItems: 'center', gap: 8 }}>
        <Image source={require('../../assets/avatar.jpg')} style={{ width: 80, height: 80, borderRadius: 40 }} />
        <Txt w="xb" size={20}>{perfil.nombres} {perfil.apellidos}</Txt>
        <Txt w="m" size={12} color={colors.textSoft}>Moneda: {perfil.codigo_moneda}</Txt>
      </Card>
      {!!fallo && <Txt color={colors.red}>{fallo}</Txt>}
      <Button label="Cerrar sesión" onPress={async () => {
        const { error: falloSesion } = await getSupabase().auth.signOut();
        if (falloSesion) setFallo(falloSesion.message);
      }} />
      {items.map((x) => (
        <TouchableOpacity key={x.go} onPress={() => nav.navigate(x.go)}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <IconBox icon={x.i} />
            <Txt w="b" size={14} style={{ flex: 1 }}>{x.t}</Txt>
            <Ic name="chevron-right" size={22} />
          </Card>
        </TouchableOpacity>
      ))}
    </Screen>
  );
}
