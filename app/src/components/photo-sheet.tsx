import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Linking, Platform, View } from 'react-native';
import { Sheet } from '@/components/sheet';
import { GoldButton, OutlineButton, T } from '@/components/ui';
import { useStore } from '@/store';
import { colors } from '@/theme';

const options: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true, // recorte quadrado antes de usar
  aspect: [1, 1],
  quality: 0.7,
};

/** Janela para trocar a foto de perfil: galeria, câmera ou remover. */
export function PhotoSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { me, setPhoto } = useStore();
  const [denied, setDenied] = useState<'galeria' | 'câmera' | null>(null);

  const pick = async (from: 'galeria' | 'câmera') => {
    setDenied(null);
    const perm =
      from === 'câmera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setDenied(from);
      return;
    }
    const result = from === 'câmera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
      onClose();
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Foto de perfil">
      <T size={13} color={colors.muted} style={{ lineHeight: 19, marginBottom: 16 }}>
        Sua foto ajuda o barbeiro a te reconhecer na chegada.
      </T>
      <View style={{ gap: 10 }}>
        <GoldButton label="Escolher da galeria" icon="image" onPress={() => pick('galeria')} />
        {/* no navegador a câmera abre o seletor de arquivos; só oferecemos no celular */}
        {Platform.OS !== 'web' && <OutlineButton label="Tirar foto" icon="camera" onPress={() => pick('câmera')} />}
        {me.photo && (
          <OutlineButton
            label="Remover foto"
            icon="trash-2"
            danger
            onPress={() => {
              setPhoto(null);
              onClose();
            }}
          />
        )}
      </View>
      {denied && (
        <T size={12} color={colors.danger} style={{ marginTop: 12, lineHeight: 18 }}>
          Sem permissão para acessar a {denied}.{' '}
          <T v="semibold" size={12} color={colors.gold} onPress={() => Linking.openSettings()}>
            Abrir ajustes
          </T>
        </T>
      )}
    </Sheet>
  );
}
