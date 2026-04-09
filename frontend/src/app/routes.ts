import { createBrowserRouter } from "react-router";
import { LoginScreen } from "./screens/LoginScreen";
import { StartScreen } from "./screens/StartScreen";
import { MainGameScreen } from "./screens/MainGameScreen";
import { MiniGameScreen } from "./screens/MiniGameScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { HowToPlayScreen } from "./screens/HowToPlayScreen";
import { CreditsScreen } from "./screens/CreditsScreen";
import { LeaderboardScreen } from "./screens/LeaderboardScreen";
import { AuthGuard } from "./components/AuthGuard";
import React from "react";

const withGuard = (Component: React.ComponentType<any>) =>
  React.createElement(AuthGuard, null, React.createElement(Component));

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LoginScreen,
  },
  {
    path: "/start",
    element: withGuard(StartScreen),
  },
  {
    path: "/game",
    element: withGuard(MainGameScreen),
  },
  {
    path: "/mini-games",
    element: withGuard(MiniGameScreen),
  },
  {
    path: "/settings",
    element: withGuard(SettingsScreen),
  },
  {
    path: "/how-to-play",
    element: withGuard(HowToPlayScreen),
  },
  {
    path: "/credits",
    element: withGuard(CreditsScreen),
  },
  {
    path: "/leaderboard",
    element: withGuard(LeaderboardScreen),
  },
]);