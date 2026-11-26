import React, { useState } from 'react';
import { View } from 'react-native';
import { AppHeader, Button, Card, Screen, Txt } from '../components/ui';
import { EstadoConsulta } from '../components/EstadoConsulta';
import { useApi } from '../hooks';
import { api } from '../services/api';
import { colors } from '../theme';

export default function AlertasScreen() {
  const { data, error, reload } = useApi(api.getAlertas);
  const [fallo, setFallo] = useState('');
  const [enCurso, setEnCurso] = useState<number | null>(null);
  if (!data) return <EstadoConsulta error={error} reload={reload} />;

  async function leer(id: number) {
    if (enCurso !== null) return;
    setEnCurso(id);
    setFallo('');
    try {
      await api.marcarAlerta(id);
      reload();
    } catch (e) {
      setFallo(e instanceof Error ? e.message : 'No se pudo guardar el cambio.');
    } finally {
      setEnCurso(null);
    }
  }

  return <Screen fab={false}>
    <AppHeader subtitle="Alertas" />
    {!!fallo && <Txt color={colors.red}>{fallo}</Txt>}
    {!data.length && <Card><Txt>No tienes alertas.</Txt></Card>}
    {data.map((alerta) => <Card key={alerta.id_alerta}>
      <View style={{ gap: 8 }}>
        <Txt w="b">{alerta.mensaje}</Txt>
        <Txt color={colors.textSoft}>{alerta.fecha_generacion.slice(0, 10)}</Txt>
        {alerta.fecha_lectura ? <Txt color={colors.textSoft}>Leída</Txt> : (
          <Button label={enCurso === alerta.id_alerta ? 'Guardando…' : 'Marcar como leída'} onPress={() => leer(alerta.id_alerta)} />
        )}
      </View>
    </Card>)}
  </Screen>;
}
