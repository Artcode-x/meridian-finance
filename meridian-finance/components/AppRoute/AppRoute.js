import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { NavigationContainer, DarkTheme } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { StatusBar } from "expo-status-bar"
import React from "react"
import Alerts from "../../pages/Alerts/Alerts"
import Favorite from "../../pages/Favorite/Favorite"
import Main from "../../pages/Main/Main"
import More from "../../pages/More/More"
import PrivacyPolicy from "../../pages/PrivacyPolicy/PrivacyPolicy"
import SupportUs from "../../pages/SupportUs/SupportUs"
import { colors } from "../../theme"
import Analytics from "../Analytics/Analytics"
import { GlassTabBar } from "../navigation/GlassTabBar"

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.gold[500],
    background: colors.bg[1],
    card: colors.bg[1],
    text: colors.text.primary,
    border: colors.line.default
  }
}

const Tabs = () => (
  <Tab.Navigator
    tabBar={(props) => <GlassTabBar {...props} />}
    screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg[1] } }}
    sceneContainerStyle={{ backgroundColor: colors.bg[1] }}
  >
    <Tab.Screen name='Home' component={Main} options={{ title: "Markets" }} />
    <Tab.Screen name='Favorite' component={Favorite} options={{ title: "Portfolio" }} />
    <Tab.Screen name='Alerts' component={Alerts} options={{ title: "Alerts" }} />
    <Tab.Screen name='Analytics' component={Analytics} options={{ title: "Analytics" }} />
    <Tab.Screen name='More' component={More} options={{ title: "More" }} />
  </Tab.Navigator>
)

export const AppRoute = () => (
  <NavigationContainer theme={navTheme}>
    <StatusBar style='light' />
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg[1] },
        animation: "slide_from_right"
      }}
    >
      <Stack.Screen name='Tabs' component={Tabs} />
      <Stack.Screen name='SupportUs' component={SupportUs} />
      <Stack.Screen name='PrivacyPolicy' component={PrivacyPolicy} />
    </Stack.Navigator>
  </NavigationContainer>
)

export default AppRoute
