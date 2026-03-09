import type { AppProps, AppContext } from "next/app";
import NextApp from "next/app";
import "@/styles/globals.css";
import { AuthProvider } from "@/context/AuthContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}

// Desabilita Automatic Static Optimization para TODAS as páginas
// Next.js não vai mais tentar pré-renderizar no build
App.getInitialProps = async (appContext: AppContext) => {
  const appProps = await NextApp.getInitialProps(appContext);
  return { ...appProps };
};