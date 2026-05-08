import {
  NavigationContainer,
  StackActions,
  type NavigationContainerRef,
} from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {
  FeatureDetailScreen,
  FeatureHomeScreen,
  HostBridgeProvider,
  SaveMediaScreen,
  type HostBridge,
} from '@poc/mock-feature';
import { StatusBar } from 'expo-status-bar';
import React, { useRef } from 'react';

type RootStackParamList = {
  Home: undefined;
  Detail: { itemId: string; itemTitle: string };
  SaveMedia: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const THEME: HostBridge['theme'] = {
  primaryColor: '#6366f1',
  backgroundColor: '#ffffff',
  surfaceColor: '#f5f5f5',
  textColor: '#1e1e1e',
  textSecondaryColor: '#6b7280',
  isDark: false,
};

function DetailWrapper({ route }: NativeStackScreenProps<RootStackParamList, 'Detail'>) {
  return (
    <FeatureDetailScreen
      itemId={route.params.itemId}
      itemTitle={route.params.itemTitle}
    />
  );
}

export default function App() {
  const navRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  const bridge: HostBridge = {
    theme: THEME,
    config: {
      appName: 'mock-feature example',
      apiBaseUrl: 'https://jsonplaceholder.typicode.com',
      userDisplayName: 'Demo User',
      userEmail: 'demo@example.com',
    },
    navigation: {
      push: (slug, params) => {
        if (slug === 'detail' && params) {
          navRef.current?.navigate('Detail', { itemId: params.itemId, itemTitle: params.itemTitle });
        } else if (slug === 'save-media') {
          navRef.current?.navigate('SaveMedia');
        }
      },
      goBack: () => {
        navRef.current?.goBack();
      },
      backToMainApp: () => {
        navRef.current?.dispatch(StackActions.popToTop());
      },
    },
  };

  return (
    <HostBridgeProvider bridge={bridge}>
      <StatusBar style="auto" />
      <NavigationContainer ref={navRef}>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: THEME.backgroundColor },
            headerTintColor: THEME.primaryColor,
            headerTitleStyle: { color: THEME.textColor },
            contentStyle: { backgroundColor: THEME.backgroundColor },
          }}
        >
          <Stack.Screen
            name="Home"
            component={FeatureHomeScreen}
            options={{ title: '🧩 mock-feature' }}
          />
          <Stack.Screen
            name="Detail"
            component={DetailWrapper}
            options={{ title: 'Detail' }}
          />
          <Stack.Screen
            name="SaveMedia"
            component={SaveMediaScreen}
            options={{ title: 'Save Media' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </HostBridgeProvider>
  );
}
