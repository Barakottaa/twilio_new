import React from 'react';
import { StatusBar, useColorScheme, View } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { theme } from './src/theme';

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <View style={{ flex: 1 }}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.card}
      />
      <AppNavigator />
    </View>
  );
};

export default App;

