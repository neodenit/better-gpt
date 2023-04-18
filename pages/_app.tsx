import { UserProvider } from '@auth0/nextjs-auth0'
import 'bootstrap/dist/css/bootstrap.min.css'
import { useEffect } from 'react';

export default function App({ Component, pageProps }) {
  // optionally pass the 'user' prop from pages that require server-side
  // rendering to prepopulate the 'useUser' hook.

  useEffect(() => {
    import('bootstrap/dist/js/bootstrap.min.js');
  }, []);

  const { user } = pageProps

  return (
    <UserProvider user={user}>
      <Component {...pageProps} />
    </UserProvider>
  )
}
