import type { AppProps } from "next/app";
import "@/styles/globals.css";
import { AuthProvider } from "@/context/AuthContext";
import dynamic from "next/dynamic";

function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

export default dynamic(() => Promise.resolve(App), { ssr: false });