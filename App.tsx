import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Alert, Text } from 'react-native';
import { ThemeProvider, useTheme } from './lib/theme';
import { useAuth } from './hooks/useAuth';
import { LoginScreen } from './screens/LoginScreen';
import { HomeScreen } from './screens/HomeScreen';
import { GuideScreen } from './screens/GuideScreen';
import { StatsScreen } from './screens/StatsScreen';
import { AddHabitScreen } from './screens/AddHabitScreen';
import { EditHabitScreen } from './screens/EditHabitScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { PrivacyPolicyScreen } from './screens/PrivacyPolicyScreen';
import { BrandedSplashScreen } from './screens/SplashScreen';

// Auth Stack (Login)
export type AuthStackParamList = {
  Login: undefined;
};

// Main App Stack (Modals)
export type MainStackParamList = {
  MainTabs: undefined;
  AddHabit: undefined;
  EditHabit: { habit: any };
  PrivacyPolicy: undefined;
};

// Bottom Tabs
export type TabParamList = {
  Home: undefined;
  Guide: undefined;
  Stats: undefined;
  Settings: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Bottom Tab Navigator
function MainTabs() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Guide"
        component={GuideScreen}
        options={{
          tabBarLabel: 'Guide',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>📖</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          tabBarLabel: 'Stats',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>📊</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>⚙️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Main App Navigator (with modals)
function MainNavigator() {
  const { theme } = useTheme();

  return (
    <MainStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <MainStack.Screen name="MainTabs" component={MainTabs} />
      <MainStack.Screen
        name="AddHabit"
        component={AddHabitScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <MainStack.Screen
        name="EditHabit"
        component={EditHabitScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <MainStack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </MainStack.Navigator>
  );
}

// Auth Navigator (Login)
function AuthNavigator() {
  const { theme } = useTheme();

  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
}

// Root Navigator (decides between Auth and Main)
function RootNavigator() {
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const [showSplash, setShowSplash] = React.useState(true);

  React.useEffect(() => {
    // Show splash screen for at least 3 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    // If auth finishes loading before 3 seconds, wait for it
    if (!loading) {
      const authTimer = setTimeout(() => {
        setShowSplash(false);
      }, 3000);
      return () => {
        clearTimeout(timer);
        clearTimeout(authTimer);
      };
    }

    return () => clearTimeout(timer);
  }, [loading]);

  if (loading || showSplash) {
    return <BrandedSplashScreen />;
  }

  return (
    <NavigationContainer>
      <StatusBar style={theme.mode === 'dark' || (theme.mode === 'auto' && theme.colors.background === '#111827') ? 'light' : 'dark'} />
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <RootNavigator />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
