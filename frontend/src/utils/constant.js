export const HOST = import.meta.env.VITE_SERVER_URL;
export const AUTH_ROUTES = "api/auth";
export const SIGNUP_ROUTE = `${AUTH_ROUTES}/signUp`;
export const LOGIN_ROUTE = `${AUTH_ROUTES}/login`;
export const GET_USER_INFO = `${AUTH_ROUTES}/user-info`;
export const UPDATE_PROFILE_ROUTE = `${AUTH_ROUTES}/update-profile`;
export const VALIDATE_OTP_ROUTE = `${AUTH_ROUTES}/validate-otp`;
export const REQUEST_OTP_ROUTE = `${AUTH_ROUTES}/request-otp`;
export const LOGOUT_ROUTE = `${AUTH_ROUTES}/logout`;

export const NOTE_ROUTES = "api/notes";
export const CREATE_NOTE_ROUTE = `${NOTE_ROUTES}/create-note`;
export const GET_NOTE_ROUTE = `${NOTE_ROUTES}/get-notes`;
export const DELETE_NOTE_ROUTE = `${NOTE_ROUTES}/delete-note`;
export const UPDATE_NOTE_ROUTE = `${NOTE_ROUTES}/update-note`;
