import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { GettingStarted } from './pages/GettingStarted';
import { ApiReference } from './pages/ApiReference';
import { Examples } from './pages/Examples';
import { Plugins } from './pages/Plugins';
import { Playground } from './pages/Playground';
import { Footer } from './components/Footer';

type Page = 'home' | 'getting-started' | 'api' | 'examples' | 'plugins' | 'playground';

function App() {
  const [page, setPage] = useState<Page>('home');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (stored) {
      setTheme(stored);
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      setTheme('light');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : 'light'}`}>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <Navbar currentPage={page} onPageChange={setPage} onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')} theme={theme} />
        <main className="flex-1">
          {page === 'home' && <Home onPageChange={setPage} />}
          {page === 'getting-started' && <GettingStarted />}
          {page === 'api' && <ApiReference />}
          {page === 'examples' && <Examples />}
          {page === 'plugins' && <Plugins />}
          {page === 'playground' && <Playground />}
        </main>
        <Footer />
      </div>
    </div>
  );
}

export { App };
