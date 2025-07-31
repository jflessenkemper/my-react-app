import type { AppProps } from 'next/app'
import '../src/App.css' // Global CSS import goes here

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
