// src/store/index.js

import { create } from "zustand";
import { createUserSlice } from "./slices/user-slice";

export const useAppStore = create((set, get) => ({
  ...createUserSlice(set),
}));
