import React from 'react';
import { View } from 'react-native';
import { Button, Loading, Txt } from './ui';

export function EstadoConsulta({ error, reload }: { error: string | null; reload: () => void }) {
  if (!error) return <Loading />;
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 16 }}>
      <Txt>{error}</Txt>
      <Button label="Volver a intentar" onPress={reload} />
    </View>
  );
}
