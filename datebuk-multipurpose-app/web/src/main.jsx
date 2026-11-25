import React, { lazy, Suspense, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Bell, Menu, Search, Settings } from 'lucide-react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { featureGroups } from './data/features';
import { authSession } from './lib/api';
import './style.css';

const routeLoaders = {
  dashboard: lazy(() => import('./pages/DashboardPage')),
  connections: lazy(() => import('./pages/ConnectionsPage')),
  communication: lazy(() => import('./pages/CommunicationPage')),
  discovery: lazy(() => import('./pages/DiscoveryPage')),
  profile: lazy(() => import('./pages/ProfilePage')),
  'premium-safety': lazy(() => import('./pages/PremiumSafetyPage')),
  'admin-ops': lazy(() => import('./pages/AdminAuditLogPage')),
};

const defaultRoute = {
  groupRoute: featureGroups[0].route,
  slug: featureGroups[0].items[0].slug,
};

function resolveRoute(groupRoute, slug) {
  const fallbackGroup = featureGroups[0];
  const resolvedGroup = featureGroups.find((group) => group.route === groupRoute) || fallbackGroup;
  const resolvedSlug = slug || resolvedGroup.items[0]?.slug || fallbackGroup.items[0]?.slug;
  const selectedItem = resolvedGroup.items.find((item) => item.slug === resolvedSlug) || resolvedGroup.items[0];

  return {
    activeGroup: resolvedGroup,
    selectedItem,
    canonicalPath: `/${resolvedGroup.route}/${selectedItem.slug}`,
  };
}

function Sidebar({ activeGroupRoute, activeSlug, open, setOpen, navigateTo }) {
  return (
    <>
      <div className={`sidebarBackdrop ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <div className="logo">D</div>
          <div>
            <b>DateBuk</b>
            <span>Multipurpose feature pack</span>
          </div>
        </div>

        {featureGroups.map((group) => (
          <div className="group" key={group.route}>
            <p>{group.title}</p>
            {group.items.map((item) => (
              <button
                key={item.slug}
                onClick={() => {
                  navigateTo(group.route, item.slug);
                  setOpen(false);
                }}
                className={activeGroupRoute === group.route && activeSlug === item.slug ? 'active' : ''}
              >
                <span>{item.name}</span>
                {['matches', 'messages', 'likes-received'].includes(item.slug) ? <em>{item.slug === 'messages' ? 5 : 12}</em> : null}
              </button>
            ))}
          </div>
        ))}
      </aside>
    </>
  );
}

function Header({ title, onOpenSidebar }) {
  const authState = authSession.getAuthState();
  const [role, setRole] = useState(authState.role);
  const [actorId, setActorId] = useState(authState.actorId);
  const [activeRole, setActiveRole] = useState(authState.role);
  const [activeActor, setActiveActor] = useState(authState.actorId);
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState(authState.hasToken ? `Signed in as ${authState.role}` : 'Header fallback mode');

  const handleDevLogin = async () => {
    setAuthLoading(true);
    try {
      const issued = await authSession.issueDevToken(role, actorId);
      setActiveRole(issued.actor.role);
      setActiveActor(issued.actor.id);
      setAuthMessage(`Token issued for ${issued.actor.role}`);
    } catch (error) {
      setAuthMessage(error.message || 'Unable to issue dev token');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = () => {
    authSession.clearAuth();
    setAuthMessage('Token cleared; using header fallback');
  };

  return (
    <header className="top">
      <div className="topCopy">
        <button className="mobileMenuButton" onClick={onOpenSidebar} aria-label="Open navigation">
          <Menu size={20} />
        </button>
        <div>
          <h1>{title}</h1>
          <p>Industrial-grade DateBuk feature pages built for trust, engagement and conversion.</p>
        </div>
      </div>
      <div className="tools">
        <div className="searchBox">
          <Search size={18} />
          <input placeholder="Search members, events, tickets..." />
        </div>
        <div className="devAuthBox">
          <select value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="admin">admin</option>
            <option value="support">support</option>
            <option value="moderator">moderator</option>
          </select>
          <input value={actorId} onChange={(event) => setActorId(event.target.value)} placeholder="actor id" />
          <button className="primary" onClick={handleDevLogin} disabled={authLoading}>{authLoading ? 'Signing...' : 'Dev Login'}</button>
          <button className="secondary" onClick={handleSignOut}>Clear</button>
          <div className="devAuthMeta">
            <span>{activeRole} · {activeActor}</span>
            <small>{authMessage}</small>
          </div>
        </div>
        <button className="iconButton" aria-label="Notifications"><Bell size={18} /></button>
        <button className="iconButton" aria-label="Settings"><Settings size={18} /></button>
      </div>
    </header>
  );
}

function AppShell() {
  const params = useParams();
  const navigate = useNavigate();
  const { activeGroup, selectedItem, canonicalPath } = resolveRoute(params.groupRoute, params.slug);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (window.location.pathname !== canonicalPath) {
      navigate(canonicalPath, { replace: true });
    }
  }, [canonicalPath, navigate]);

  const navigateTo = (groupRoute, slug) => {
    const nextPath = `/${groupRoute}/${slug}`;
    if (window.location.pathname === nextPath) return;
    navigate(nextPath);
  };

  const ActivePage = routeLoaders[activeGroup.route] || routeLoaders.dashboard;

  return (
    <div className="app">
      <Sidebar
        activeGroupRoute={activeGroup.route}
        activeSlug={selectedItem.slug}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        navigateTo={navigateTo}
      />

      <main className="main">
        <Header title={selectedItem.name} onOpenSidebar={() => setSidebarOpen(true)} />
        <div className="mainShell">
          <Suspense fallback={<div className="loadingCard">Loading {selectedItem.name}...</div>}>
            <ActivePage group={activeGroup} selectedItem={selectedItem} navigateTo={navigateTo} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={`/${defaultRoute.groupRoute}/${defaultRoute.slug}`} replace />} />
        <Route path="/:groupRoute/:slug" element={<AppShell />} />
        <Route path="*" element={<Navigate to={`/${defaultRoute.groupRoute}/${defaultRoute.slug}`} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(<AppRouter />);
