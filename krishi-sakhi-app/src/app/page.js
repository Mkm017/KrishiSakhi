import AuthWrapper from './components/AuthWrapper';

export default function Home() {
  // This is the root of your application.
  // By placing AuthWrapper here, you ensure that every visitor
  // is checked for their login status. AuthWrapper will then decide
  // whether to show the Signup page or the Chat page.
  return (
    <main>
      <AuthWrapper />
    </main>
  );
}

