import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    isDarkMode: false
}

export const darkSlice = createSlice({
    name: 'darkMode',
    initialState,
    reducers: {
        setIsDarkMode : (state) => {
            state.isDarkMode = !state.isDarkMode;
        }
    }
})

export const { setIsDarkMode  } = darkSlice.actions

export default darkSlice.reducer