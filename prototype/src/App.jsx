import { useEffect, useState } from 'react';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (window.location.port === '4173' ? `http://${window.location.hostname || '127.0.0.1'}:8080` : '');

function imageURL(value) {
  if (!value) {
    return '';
  }
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  return `${API_BASE_URL}${value.startsWith('/') ? value : `/${value}`}`;
}

const stylePacks = [
  { id: 'anime_bishoujo', name: '美少女动漫', count: 1, image: '/assets/portrait-royal.png' },
  { id: 'anime_bishoujo_ultimate', name: '美少女(3d)', count: 1, image: '/assets/portrait-royal.png' },
  { id: 'ultimate_bishoujo', name: '真实写实', count: 1, image: '/assets/portrait-royal.png' },
];

const resultSets = [
  {
    id: 'castle',
    prompt:
      'adult anime girl lying on a bed with white and pink sheets, elegant pink sleepwear, blue eyes, shy expression, bedside lamp in the background, soft romantic lighting, tasteful composition',
    images: [
      '/assets/castle-sunrise.png',
      '/assets/library-gold.png',
      '/assets/castle-sunrise.png',
      '/assets/castle-sunrise.png',
    ],
  },
  {
    id: 'portrait',
    prompt:
      'adult anime girl with long dark hair and blue eyes, soft expression, elegant pink outfit, warm bedroom lighting, detailed anime illustration, tasteful composition',
    images: [
      '/assets/portrait-royal.png',
      '/assets/portrait-royal.png',
      '/assets/library-gold.png',
      '/assets/portrait-royal.png',
    ],
  },
  {
    id: 'street',
    prompt:
      'adult anime girl sitting on a bed, pink and white bedroom, soft lamp light, shy smile, delicate face, clean anime illustration, tasteful composition',
    images: [
      '/assets/cyberpunk-rain.png',
      '/assets/cyberpunk-rain.png',
      '/assets/castle-sunrise.png',
      '/assets/cyberpunk-rain.png',
    ],
  },
];

const timelineCards = [
  '/assets/castle-sunrise.png',
  '/assets/cyberpunk-rain.png',
  '/assets/portrait-royal.png',
  '/assets/castle-sunrise.png',
  '/assets/library-gold.png',
  '/assets/portrait-royal.png',
];

export function App() {
  const [currentPage, setCurrentPage] = useState('auth');
  const [authChecked, setAuthChecked] = useState(false);
  const [authMode, setAuthMode] = useState('register');
  const [authUser, setAuthUser] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authPasswordConfirm, setAuthPasswordConfirm] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [activePack, setActivePack] = useState(stylePacks[0].id);
  const [activeSetId, setActiveSetId] = useState(resultSets[0].id);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [quality, setQuality] = useState('High');
  const [imageCount, setImageCount] = useState('4');
  const [seed, setSeed] = useState('Random');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [generationJob, setGenerationJob] = useState(null);
  const [generationError, setGenerationError] = useState('');
  const [pendingImageCount, setPendingImageCount] = useState(Number(imageCount));
  const [assets, setAssets] = useState([]);
  const [assetTotal, setAssetTotal] = useState(0);
  const [assetError, setAssetError] = useState('');
  const [assetsLoading, setAssetsLoading] = useState(false);
  const recentImages = assets.length ? assets.map((asset) => imageURL(asset.url)) : timelineCards;

  const loadAssets = async () => {
    if (!authUser) {
      return;
    }
    setAssetsLoading(true);
    setAssetError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/assets?limit=60`, { credentials: 'include' });
      const payload = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          setAuthUser(null);
          setCurrentPage('auth');
        }
        throw new Error(payload.error || 'Failed to load assets');
      }
      setAssets(payload.assets ?? []);
      setAssetTotal(payload.total ?? 0);
    } catch (error) {
      setAssetError(error.message);
    } finally {
      setAssetsLoading(false);
    }
  };

  const handleSelectSet = (setId) => {
    setActiveSetId(setId);
    setSelectedImageIndex(0);
    setPrompt((resultSets.find((set) => set.id === setId) ?? resultSets[0]).prompt);
  };

  const activeImages =
    generationJob?.status === 'completed' && generationJob.images?.length
      ? generationJob.images.map((image) => imageURL(image.url))
      : [];
  const isGenerating = generationJob?.status === 'queued' || generationJob?.status === 'running';
  const hasResults = activeImages.length > 0;
  const loadingSlots = Array.from({ length: pendingImageCount }, (_, index) => index);

  const createGeneration = async () => {
    setGenerationError('');
    setSelectedImageIndex(0);
    setPendingImageCount(Number(imageCount));
    try {
      const response = await fetch(`${API_BASE_URL}/api/generations`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          style_id: activePack,
          aspect_ratio: aspectRatio,
          quality,
          image_count: Number(imageCount),
          seed: seed === 'Random' ? 0 : Number(seed),
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          setAuthUser(null);
          setCurrentPage('auth');
        }
        throw new Error(payload.error || 'Failed to create generation');
      }
      setGenerationJob(payload);
    } catch (error) {
      setGenerationError(error.message);
      setGenerationJob(null);
    }
  };

  const submitAuth = async (event) => {
    event.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const endpoint = authMode === 'register' ? 'register' : 'login';
      const body =
        authMode === 'register'
          ? { email: authEmail, password: authPassword, password_confirm: authPasswordConfirm }
          : { email: authEmail, password: authPassword };
      const response = await fetch(`${API_BASE_URL}/api/auth/${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Authentication failed');
      }
      setAuthUser(payload.user);
      setCurrentPage('workspace');
      setAuthPassword('');
      setAuthPasswordConfirm('');
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      setAuthUser(null);
      setUserMenuOpen(false);
      setGenerationJob(null);
      setGenerationError('');
      setAssets([]);
      setAssetTotal(0);
      setCurrentPage('auth');
      setAuthMode('login');
    }
  };

  const deleteAsset = async (assetId) => {
    if (!window.confirm('Delete this asset?')) {
      return;
    }
    setAssetError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/assets/${assetId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const payload = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          setAuthUser(null);
          setCurrentPage('auth');
        }
        throw new Error(payload.error || 'Failed to delete asset');
      }
      setAssets((items) => items.filter((asset) => asset.id !== assetId));
      setAssetTotal((count) => Math.max(0, count - 1));
    } catch (error) {
      setAssetError(error.message);
    }
  };

  useEffect(() => {
    if (!generationJob || generationJob.status === 'completed' || generationJob.status === 'failed') {
      return undefined;
    }

    const timer = window.setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/generations/${generationJob.id}`, {
          credentials: 'include',
        });
        const payload = await response.json();
        if (!response.ok) {
          if (response.status === 401) {
            setAuthUser(null);
            setCurrentPage('auth');
          }
          throw new Error(payload.error || 'Failed to refresh generation');
        }
        setGenerationJob(payload);
        if (payload.status === 'completed') {
          loadAssets();
        }
      } catch (error) {
        setGenerationError(error.message);
      }
    }, 1800);

    return () => window.clearInterval(timer);
  }, [generationJob]);

  useEffect(() => {
    let ignore = false;
    fetch(`${API_BASE_URL}/api/auth/me`, { credentials: 'include' })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!ignore && payload?.user) {
          setAuthUser(payload.user);
          setCurrentPage('workspace');
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!ignore) {
          setAuthChecked(true);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (authUser) {
      loadAssets();
    } else {
      setAssets([]);
      setAssetTotal(0);
    }
  }, [authUser]);

  if (!authChecked) {
    return (
      <main className="app-shell">
        <div className="auth-page">
          <div className="result-empty">
            <strong>Checking session</strong>
            <span>Loading your MilkBuddy account state.</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark">MilkBuddy</div>
          <div className="brand-subtitle">Creative Image Workspace</div>
        </div>

        <div className="status-strip">
          {authUser ? (
            <nav className="top-nav" aria-label="Primary">
            <button
              type="button"
              className={currentPage === 'workspace' ? 'is-active' : ''}
              onClick={() => setCurrentPage('workspace')}
            >
              Workspace
            </button>
            <button
              type="button"
              className={currentPage === 'assets' ? 'is-active' : ''}
              onClick={() => setCurrentPage('assets')}
            >
              资产
            </button>
            </nav>
          ) : null}
          <div className="status-card">
            <span className="picker-label">Credits</span>
            <strong>2,450</strong>
          </div>
          {authUser ? (
            <div className="account-menu">
            <button
              type="button"
              className="user-pill user-menu"
              aria-expanded={userMenuOpen}
              onClick={() => setUserMenuOpen((open) => !open)}
            >
              <span className="avatar-dot">{authUser.email.slice(0, 1).toUpperCase()}</span>
              <span>{authUser.email}</span>
              <span className="menu-caret">v</span>
            </button>

            {userMenuOpen ? (
              <div className="account-dropdown">
                <button type="button">Account</button>
                <button type="button">Billing</button>
                <button type="button">Settings</button>
                <button type="button" onClick={handleSignOut}>Sign out</button>
              </div>
            ) : null}
          </div>
          ) : (
            <button
              type="button"
              className="user-pill signin-button"
              onClick={() => {
                setAuthMode('register');
                setCurrentPage('auth');
              }}
            >
              <span className="avatar-dot">?</span>
              <span>Sign in</span>
            </button>
          )}
        </div>
      </header>

      {!authUser || currentPage === 'auth' ? (
        <AuthPage
          mode={authMode}
          email={authEmail}
          password={authPassword}
          passwordConfirm={authPasswordConfirm}
          error={authError}
          loading={authLoading}
          onModeChange={(mode) => {
            setAuthMode(mode);
            setAuthError('');
          }}
          onEmailChange={setAuthEmail}
          onPasswordChange={setAuthPassword}
          onPasswordConfirmChange={setAuthPasswordConfirm}
          onSubmit={submitAuth}
        />
      ) : currentPage === 'assets' ? (
        <AssetsPage
          assets={assets}
          total={assetTotal}
          loading={assetsLoading}
          error={assetError}
          onRefresh={loadAssets}
          onDeleteAsset={deleteAsset}
        />
      ) : (
      <>
        <section className="workspace-grid">
        <aside className="left-rail panel">
          <div className="panel-heading">
            <h2>Styles</h2>
            <button type="button" className="ghost-link">
              Browse all
            </button>
          </div>

          <div className="pack-list">
            {stylePacks.map((pack) => (
              <button
                key={pack.id}
                type="button"
                className={`pack-card ${activePack === pack.id ? 'is-active' : ''}`}
                onClick={() => setActivePack(pack.id)}
              >
                <img src={pack.image} alt="" />
                <span>
                  <strong>{pack.name}</strong>
                  <small>{pack.count} styles</small>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="composer-column panel">
          <div className="composer-header">
            <h1>Describe the image you want to create</h1>
            <button type="button" className="text-button">
              Reset
            </button>
          </div>

          <label className="field-group">
            <span className="field-label">Prompt</span>
            <textarea
              value={prompt}
              placeholder="Describe the character, pose, clothing, scene, lighting, and composition you want..."
              onChange={(event) => setPrompt(event.target.value)}
            />
          </label>

          <section className="parameter-panel">
            <div className="panel-heading">
              <h2>Parameters</h2>
              <button type="button" className="ghost-link">
                Advanced settings
              </button>
            </div>

            <div className="parameter-grid">
              <label>
                <span>Aspect ratio</span>
                <select value={aspectRatio} onChange={(event) => setAspectRatio(event.target.value)}>
                  <option>16:9</option>
                  <option>3:2</option>
                  <option>4:5</option>
                  <option>21:9</option>
                </select>
              </label>

              <label>
                <span>Quality</span>
                <select value={quality} onChange={(event) => setQuality(event.target.value)}>
                  <option>High</option>
                  <option>Ultra</option>
                  <option>Draft</option>
                </select>
              </label>

              <label>
                <span>Images</span>
                <select value={imageCount} onChange={(event) => setImageCount(event.target.value)}>
                  <option>4</option>
                  <option>2</option>
                  <option>1</option>
                </select>
              </label>

              <label>
                <span>Seed</span>
                <select value={seed} onChange={(event) => setSeed(event.target.value)}>
                  <option>Random</option>
                  <option>Locked</option>
                  <option>134992</option>
                </select>
              </label>
            </div>

            <button
              type="button"
              className="generate-button"
              disabled={isGenerating}
              onClick={createGeneration}
            >
              <span className="generate-label">{isGenerating ? 'Generating...' : 'Generate'}</span>
            </button>
            {generationError ? <p className="generation-error">{generationError}</p> : null}
          </section>
        </section>

        <section className="results-column panel">
          <div className="panel-heading">
            <h2>Results</h2>
            <button type="button" className="ghost-link">
              Select best
            </button>
          </div>

          {isGenerating ? (
            <div className="result-grid" aria-label="Generating images">
              {loadingSlots.map((slot) => (
                <div key={`loading-${slot}`} className="result-thumb result-loading">
                  <span className="loading-orb" />
                  <span className="loading-text">Generating {slot + 1}</span>
                </div>
              ))}
            </div>
          ) : hasResults ? (
            <div className="result-grid">
              {activeImages.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  className={`result-thumb ${selectedImageIndex === index ? 'is-active' : ''}`}
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <img src={image} alt="" />
                </button>
              ))}
            </div>
          ) : (
            <div className="result-empty result-grid-empty">
              <strong>No images yet</strong>
              <span>Choose a style, write a prompt, then generate.</span>
            </div>
          )}

          <div className="selected-block">
            <div className="selected-header">
              <h3>Selected Image</h3>
              <span>{hasResults ? aspectRatio : generationJob?.status ?? 'empty'}</span>
            </div>
            {isGenerating ? (
              <div className="selected-empty selected-loading">
                <span className="loading-orb loading-orb-large" />
                <strong>Generating batch</strong>
                <span>{pendingImageCount} image{pendingImageCount > 1 ? 's' : ''} requested. Preview will load after completion.</span>
              </div>
            ) : hasResults ? (
              <img className="selected-image" src={activeImages[selectedImageIndex]} alt="" />
            ) : (
              <div className="selected-empty">
                <strong>Nothing selected</strong>
                <span>Generated images will be selectable here.</span>
              </div>
            )}
          </div>

          <div className="result-actions">
            <button type="button" disabled={!hasResults}>Upscale</button>
            <button type="button" disabled={!hasResults}>Vary (Subtle)</button>
            <button type="button" disabled={!hasResults}>Vary (Strong)</button>
            <button type="button" disabled={!hasResults}>Download</button>
          </div>
        </section>
        </section>

        <footer className="timeline-bar">
        <div className="timeline-meta">
          <span className="timeline-label">最近</span>
          <strong>最近生成</strong>
        </div>

        <div className="timeline-strip">
          {recentImages.map((image, index) => (
            <button
              key={`${image}-timeline-${index}`}
              type="button"
              className={`timeline-card ${index === 0 ? 'is-active' : ''}`}
              onClick={() => {
                if (index === 0) handleSelectSet('castle');
                if (index === 1) handleSelectSet('street');
                if (index === 2) handleSelectSet('portrait');
              }}
            >
              <img src={image} alt="" />
            </button>
          ))}
          <button type="button" className="timeline-add">
            View all
          </button>
        </div>
        </footer>
      </>
      )}
    </main>
  );
}

function AuthPage({
  mode,
  email,
  password,
  passwordConfirm,
  error,
  loading,
  onModeChange,
  onEmailChange,
  onPasswordChange,
  onPasswordConfirmChange,
  onSubmit,
}) {
  const isRegister = mode === 'register';

  return (
    <section className="auth-page">
      <div className="auth-card panel">
        <div className="auth-copy">
          <span className="eyebrow">MilkBuddy Account</span>
          <h1>{isRegister ? '创建你的创作账号' : '登录你的创作账号'}</h1>
          <p>账号系统先使用邮箱和密码。后续接入 Google 登录、积分、资产持久化时，会复用同一套用户身份。</p>
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          <div className="auth-tabs">
            <button
              type="button"
              className={isRegister ? 'is-active' : ''}
              onClick={() => onModeChange('register')}
            >
              Register
            </button>
            <button
              type="button"
              className={!isRegister ? 'is-active' : ''}
              onClick={() => onModeChange('login')}
            >
              Login
            </button>
          </div>

          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              placeholder="you@example.com"
              autoComplete="email"
              onChange={(event) => onEmailChange(event.target.value)}
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              placeholder="At least 8 characters"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              onChange={(event) => onPasswordChange(event.target.value)}
            />
          </label>

          {isRegister ? (
            <label>
              <span>Repeat password</span>
              <input
                type="password"
                value={passwordConfirm}
                placeholder="Repeat your password"
                autoComplete="new-password"
                onChange={(event) => onPasswordConfirmChange(event.target.value)}
              />
            </label>
          ) : null}

          {error ? <p className="auth-error">{error}</p> : null}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Processing...' : isRegister ? 'Create account' : 'Login'}
          </button>
        </form>
      </div>
    </section>
  );
}

function AssetsPage({ assets, total, loading, error, onRefresh, onDeleteAsset }) {
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const selectedAsset = assets.find((asset) => asset.id === selectedAssetId) ?? assets[0];
  const animeCount = assets.filter((asset) => asset.style_id === 'anime_bishoujo').length;
  const realisticCount = assets.filter((asset) => asset.style_id === 'ultimate_bishoujo').length;

  useEffect(() => {
    if (selectedAssetId && !assets.some((asset) => asset.id === selectedAssetId)) {
      setSelectedAssetId(assets[0]?.id ?? '');
      return;
    }
    if (!selectedAssetId && assets[0]) {
      setSelectedAssetId(assets[0].id);
    }
  }, [assets, selectedAssetId]);

  return (
    <section className="asset-page">
      <div className="asset-hero panel">
        <div className="asset-title">
          <h1>Asset Library</h1>
          <span>Generated images</span>
        </div>
        <div className="asset-stats">
          <div>
            <strong>{total}</strong>
            <span>Total assets</span>
          </div>
          <div>
            <strong>{assets.length}</strong>
            <span>Loaded</span>
          </div>
          <div>
            <strong>{realisticCount}</strong>
            <span>真实写实</span>
          </div>
        </div>
      </div>

      <div className="asset-layout">
        <aside className="asset-sidebar panel">
          <div className="panel-heading">
            <h2>Collections</h2>
            <button type="button" className="ghost-link">New</button>
          </div>
          <button type="button" className="collection-item is-active">
            <span>All Images</span>
            <strong>{total}</strong>
          </button>
          <button type="button" className="collection-item">
            <span>最近加载</span>
            <strong>{assets.length}</strong>
          </button>
          <button type="button" className="collection-item">
            <span>真实写实</span>
            <strong>{realisticCount}</strong>
          </button>
          <button type="button" className="collection-item">
            <span>美少女动漫</span>
            <strong>{animeCount}</strong>
          </button>
        </aside>

        <section className="asset-board panel">
          <div className="asset-toolbar">
            <div className="asset-search">Search assets, prompts, styles...</div>
            <div className="asset-filters">
              <button type="button" className="is-active">All</button>
              <button type="button">Generated</button>
              <button type="button">真实写实</button>
              <button type="button" onClick={onRefresh}>{loading ? 'Loading...' : 'Refresh'}</button>
            </div>
          </div>

          {error ? <p className="asset-error">{error}</p> : null}
          {loading && !assets.length ? (
            <div className="result-empty result-grid-empty">
              <strong>Loading assets</strong>
              <span>Fetching generated assets from the database.</span>
            </div>
          ) : assets.length ? (
            <div className="asset-grid">
              {assets.map((asset) => (
                <article
                  key={asset.id}
                  className={`asset-card ${selectedAsset?.id === asset.id ? 'is-active' : ''}`}
                >
                  <button type="button" className="asset-card-main" onClick={() => setSelectedAssetId(asset.id)}>
                    <img src={imageURL(asset.url)} alt="" />
                    <div className="asset-card-body">
                      <div>
                        <h3>{asset.prompt || 'Generated image'}</h3>
                        <span>{asset.style_name} · {asset.aspect_ratio} · {formatDate(asset.created_at)}</span>
                      </div>
                      <strong>{asset.status}</strong>
                    </div>
                  </button>
                  <button
                    type="button"
                    className="asset-delete-icon"
                    title="Delete"
                    aria-label="Delete asset"
                    onClick={() => onDeleteAsset(asset.id)}
                  >
                    ×
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="result-empty result-grid-empty">
              <strong>No assets yet</strong>
              <span>Generate images first. Completed results will be saved here automatically.</span>
            </div>
          )}
        </section>

        <aside className="asset-detail panel">
          <span className="eyebrow">Selected Asset</span>
          {selectedAsset ? (
            <>
              <div className="asset-preview">
                <img src={imageURL(selectedAsset.url)} alt="" />
                <a
                  className="asset-download-icon"
                  href={`${API_BASE_URL}/api/assets/${selectedAsset.id}/download`}
                  title="Download"
                  aria-label="Download asset"
                >
                  ↓
                </a>
              </div>
              <h2>{selectedAsset.prompt || 'Generated image'}</h2>
              <p>{selectedAsset.storage_key ? `R2 object: ${selectedAsset.storage_key}` : 'This asset is stored in the database and available for reuse.'}</p>
              <div className="asset-meta-list">
                <span>Style <strong>{selectedAsset.style_name}</strong></span>
                <span>Ratio <strong>{selectedAsset.aspect_ratio}</strong></span>
                <span>Size <strong>{selectedAsset.width}x{selectedAsset.height}</strong></span>
                <span>Seed <strong>{selectedAsset.seed}</strong></span>
                <span>Created <strong>{formatDate(selectedAsset.created_at)}</strong></span>
              </div>
            </>
          ) : (
            <div className="selected-empty">
              <strong>No asset selected</strong>
              <span>Generated assets will appear here after the first completed job.</span>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function formatDate(value) {
  if (!value) {
    return 'Unknown';
  }
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
