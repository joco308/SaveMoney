import React, { useCallback, useState } from 'react';
import { Switch, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { Card, Txt } from './ui';
import { colors } from '../theme';

const identificador = 'savemoney-recordatorio-ahorro-semanal';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function RecordatorioAhorro() {
  const [activo, setActivo] = useState(false);
  const [disponible, setDisponible] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const pendientes = await Notifications.getAllScheduledNotificationsAsync();
      setActivo(pendientes.some((notificacion) => notificacion.identifier === identificador));
      setDisponible(true);
      setError('');
    } catch {
      setError('No se pudo consultar el recordatorio del teléfono.');
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void cargar();
  }, [cargar]));

  async function cambiar(valor: boolean) {
    if (ocupado) return;
    setOcupado(true);
    setError('');
    try {
      if (valor) {
        const actual = await Notifications.getPermissionsAsync();
        const permiso = actual.granted ? actual : await Notifications.requestPermissionsAsync();
        if (!permiso.granted) throw new Error('Activa las notificaciones de SaveMoney en los ajustes del teléfono.');
        await Notifications.scheduleNotificationAsync({
          identifier: identificador,
          content: { title: 'SaveMoney', body: 'Revisa tus metas y recuerda registrar tus aportes.' },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: 2,
            hour: 9,
            minute: 0,
          },
        });
      } else {
        await Notifications.cancelScheduledNotificationAsync(identificador);
      }
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar el recordatorio.');
    } finally {
      setOcupado(false);
    }
  }

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Txt w="b">Recordatorio de ahorro</Txt>
          <Txt size={12} color={colors.textSoft}>Cada lunes a las 9:00 en este teléfono</Txt>
        </View>
        <Switch accessibilityLabel="Recordatorio semanal de ahorro" value={activo}
          disabled={ocupado || !disponible} onValueChange={cambiar} />
      </View>
      {!!error && <Txt color={colors.red}>{error}</Txt>}
    </Card>
  );
}
