import { configureStore } from '@reduxjs/toolkit'
import darkReducer from './reducers/darkSlice'

export const store = configureStore({
  reducer: {
    darkMode: darkReducer
  },
})