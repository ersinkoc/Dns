import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Home } from '@/pages/Home';
import { Introduction } from '@/pages/docs/Introduction';
import { Installation } from '@/pages/docs/Installation';
import { QuickStart } from '@/pages/docs/QuickStart';
import { ApiReference } from '@/pages/ApiReference';
import { Examples } from '@/pages/Examples';
import { Plugins } from '@/pages/Plugins';
import { Playground } from '@/pages/Playground';

export function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* Home */}
          <Route path="/" element={<Home />} />

          {/* Docs */}
          <Route path="/docs" element={<Introduction />} />
          <Route path="/docs/installation" element={<Installation />} />
          <Route path="/docs/quick-start" element={<QuickStart />} />

          {/* API */}
          <Route path="/api" element={<ApiReference />} />

          {/* Examples */}
          <Route path="/examples" element={<Examples />} />

          {/* Plugins */}
          <Route path="/plugins" element={<Plugins />} />

          {/* Playground */}
          <Route path="/playground" element={<Playground />} />

          {/* 404 - redirect to home */}
          <Route path="*" element={<Home />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
