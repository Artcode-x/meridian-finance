import { useEffect, useRef } from "react"
import { AppState } from "react-native"

export const useAppState = (callback) => {
  const appState = useRef(AppState.currentState)

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        callback?.()
      }
      appState.current = nextAppState
    }

    const subscription = AppState.addEventListener("change", handleAppStateChange)

    return () => {
      subscription.remove()
    }
  }, [callback])
}
