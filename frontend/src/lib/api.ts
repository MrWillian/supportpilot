import axios from "axios";

/**
 * Em dev com Vite, use baseURL vazio para ir para a mesma origem (`localhost:5173`)
 * e deixar o proxy (`vite.config.ts`) encaminhar `/metrics` e `/tickets` ao backend.
 * Para apontar direto ao API (ex.: preview sem proxy), defina `VITE_API_URL`.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "",
});

