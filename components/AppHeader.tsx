import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

export const AppHeader: React.FC = () => {
  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/icons/LOGO_AIL_HEADER.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <View style={styles.divider} />
      <Image
        source={require('@/assets/icons/LOGO_CUMBRE_HEADER.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 20,
    gap: 16,
  },
  logo: {
    height: 34,
    flex: 1,
  },
  divider: {
    width: 1,
    height: 26,
    backgroundColor: '#C0C0C0',
  },
});
