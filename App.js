import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider } from 'react-redux';
import { store } from './src/store/store';
// Firebase 제거됨 - 로컬 스토리지 사용
import SplashScreen from './src/screens/SplashScreen';
import HomeScreen from './src/screens/HomeScreen';
import VoteScreen from './src/screens/VoteScreen';
import ResultScreen from './src/screens/ResultScreen';
import QuestionCreateScreen from './src/screens/QuestionCreateScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import HallOfFameScreen from './src/screens/HallOfFameScreen';
import ShopScreen from './src/screens/ShopScreen';
import HotVotesScreen from './src/screens/HotVotesScreen';
import StatisticsScreen from './src/screens/StatisticsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Firebase 초기화 불필요
    setIsReady(true);
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#667eea',
              elevation: 0,
              shadowOpacity: 0,
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 18,
            },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen 
            name="Splash" 
            component={SplashScreen} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{ title: '즉결심판' }}
          />
          <Stack.Screen 
            name="Vote" 
            component={VoteScreen}
            options={{ title: '투표하기' }}
          />
          <Stack.Screen 
            name="Result" 
            component={ResultScreen}
            options={{ title: '투표 결과' }}
          />
          <Stack.Screen 
            name="QuestionCreate" 
            component={QuestionCreateScreen}
            options={{ title: '고민 작성하기' }}
          />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen}
            options={{ title: '마이페이지' }}
          />
          <Stack.Screen 
            name="HotVotes" 
            component={HotVotesScreen}
            options={{ title: '핫 투표' }}
          />
          <Stack.Screen 
            name="HallOfFame" 
            component={HallOfFameScreen}
            options={{ title: '명예의 전당' }}
          />
          <Stack.Screen 
            name="Shop" 
            component={ShopScreen}
            options={{ title: '상점' }}
          />
          <Stack.Screen 
            name="Statistics" 
            component={StatisticsScreen}
            options={{ title: '학교/학과 통계' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}

