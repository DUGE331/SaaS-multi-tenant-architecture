import { Manrope } from 'next/font/google';

import '../styles/globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
});

export default function App({ Component, pageProps }) {
  return (
    <main className={manrope.variable}>
      <Component {...pageProps} />
    </main>
  );
}
