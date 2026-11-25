import React, { useState, useEffect } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { authService } from './src/services/auth';
import 'react-native-get-random-values';

// Screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import SwipeScreen from './src/screens/SwipeScreen';
import MatchesScreen from './src/screens/MatchesScreen';
import ChatScreen from './src/screens/ChatScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import SubscriptionScreen from './src/screens/SubscriptionScreen';
import EnterpriseHubScreen from './src/screens/EnterpriseHubScreen';
import CallScreen from './src/screens/CallScreen';
import IdentityVerifyScreen from './src/screens/IdentityVerifyScreen';
import { connectSignaling, disconnectSignaling, socket } from './src/services/signaling';
import { registerPushToken, showLocalIncomingCall } from './src/services/notifications';
import { displayIncomingNativeCall, setupCallKeep } from './src/services/callkeep';
import { MobileSecurityProvider } from './src/context/MobileSecurityContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const navigationRef = createNavigationContainerRef<any>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#EC4899',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Swipe"
        component={SwipeScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🔥</Text>,
        }}
      />
      <Tab.Screen
        name="Matches"
        component={MatchesScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>💬</Text>,
        }}
      />
      <Tab.Screen
        name="Hub"
        component={EnterpriseHubScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🧭</Text>,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');
  // Set only right after registration: send the new user to ID + selfie verification first.
  const [justRegistered, setJustRegistered] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const authenticated = await authService.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        const user = await authService.getCurrentUser();
        if (user?.id) {
          setCurrentUserId(user.id);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    authService.getCurrentUser().then((user) => {
      if (user?.id) {
        setCurrentUserId(user.id);
      }
    });
  };

  const handleSignUpSuccess = () => {
    setJustRegistered(true);
    handleAuthSuccess();
  };

  useEffect(() => {
    if (!isAuthenticated || !currentUserId) return;

    void connectSignaling();
    void setupCallKeep();
    void registerPushToken(currentUserId);

    const onIncoming = (payload: any) => {
      void showLocalIncomingCall(payload.callerId, payload.callId, payload.media);
      displayIncomingNativeCall(payload.callId, payload.callerId, payload.media === 'video');

      if (navigationRef.isReady()) {
        navigationRef.navigate('Call', {
          selfId: currentUserId,
          peerId: payload.callerId,
          callId: payload.callId,
          media: payload.media,
          incoming: true,
        });
      }
    };

    socket.on('call:incoming', onIncoming);

    return () => {
      socket.off('call:incoming', onIncoming);
      disconnectSignaling();
    };
  }, [isAuthenticated, currentUserId]);

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <MobileSecurityProvider>
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName={isAuthenticated && justRegistered ? 'IdentityVerify' : undefined}
        screenOptions={{
          headerStyle: {
            backgroundColor: '#EC4899',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen
              name="Welcome"
              component={WelcomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Login"
              options={{ headerShown: false }}
            >
              {(props) => <LoginScreen {...props} onLoginSuccess={handleAuthSuccess} />}
            </Stack.Screen>
            <Stack.Screen
              name="SignUp"
              options={{ headerShown: false }}
            >
              {(props) => <SignUpScreen {...props} onSignUpSuccess={handleSignUpSuccess} />}
            </Stack.Screen>
          </>
        ) : (
          <>
            <Stack.Screen
              name="MainTabs"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="IdentityVerify"
              component={IdentityVerifyScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{
                title: 'Chat',
              }}
            />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{
                title: 'Edit Profile',
              }}
            />
            <Stack.Screen
              name="Subscription"
              component={SubscriptionScreen}
              options={{
                title: 'Subscription',
              }}
            />
            <Stack.Screen
              name="Call"
              component={CallScreen as React.ComponentType<any>}
              options={{
                headerShown: false,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
    </MobileSecurityProvider>
  );
}
