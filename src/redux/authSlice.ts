import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    icode: null,
    email: null,
    publication: null,
    exist: false,
    username: null,
  },

  reducers: {
    setAuthUser: (state, action) => {
      state.icode = action.payload;
    },
    setEmail: (state, action) => {
      state.email = action.payload;
    },
    setPublication: (state, action) => {
      state.publication = action.payload;
    },
    setExist: (state, action) => {
      state.exist = action.payload;
    },
    setUsername: (state, action) => {
      state.username = action.payload;
    },
  },
});

export const { setAuthUser, setEmail, setPublication, setExist, setUsername } =
  authSlice.actions;
export default authSlice.reducer;
