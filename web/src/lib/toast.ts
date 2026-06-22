import { toast as toastify, ToastOptions } from "react-toastify";

export const toast = {
  success: (message: string, options?: ToastOptions) => {
    return toastify.success(message, options);
  },
  error: (message: string, options?: ToastOptions) => {
    return toastify.error(message, options);
  },
  info: (message: string, options?: ToastOptions) => {
    return toastify.info(message, options);
  },
  warning: (message: string, options?: ToastOptions) => {
    return toastify.warning(message, options);
  },
};
