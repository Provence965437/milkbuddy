import { useEffect, useState } from 'react';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (['4173', '5173'].includes(window.location.port) ? `http://${window.location.hostname || '127.0.0.1'}:8080` : '');

function imageURL(value) {
  if (!value) {
    return '';
  }
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  return `${API_BASE_URL}${value.startsWith('/') ? value : `/${value}`}`;
}

async function copyText(value) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '-1000px';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

const copyIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M8 7h10v13H8V7Zm2 2v9h6V9h-6Z" />
    <path d="M5 4h10v2H7v10H5V4Z" />
  </svg>
);

const text = {
  zh: {
    checkingSession: '检查登录状态',
    loadingAccount: '正在加载你的 MilkBuddy 账号状态',
    brandSubtitle: 'AI 图像创作',
    workspace: '工作台',
    assets: '资产',
    credits: '积分',
    signOut: '退出',
    signIn: '登录',
    createMode: '创作模式',
    referenceDriven: '参考图驱动',
    referenceNote: '上传参考图后，在 prompt 中描述要保留或改变的内容。',
    composerTitle: '描述你想创作的图像',
    prompt: '提示词',
    clear: '清空',
    imageEditPlaceholder: '描述参考图需要如何修改...',
    textPromptPlaceholder: '描述人物、姿势、服装、场景、光线和构图...',
    parameters: '参数',
    aspectRatio: '画幅',
    quality: '质量',
    high: '高质量',
    ultra: '超高质量',
    draft: '草稿',
    images: '数量',
    seed: '种子',
    random: '随机',
    locked: '锁定',
    generating: '生成中...',
    generateFromImage: '图生图',
    generate: '生成',
    results: '结果',
    noImages: '暂无图片',
    noImagesImageMode: '上传参考图，填写提示词，然后生成。',
    noImagesTextMode: '选择风格，填写提示词，然后生成。',
    selectedImage: '选中图片',
    generatingBatch: '批量生成中',
    requestedImages: (count) => `已请求 ${count} 张图片，完成后显示预览。`,
    nothingSelected: '未选择图片',
    selectableHere: '生成后的图片会在这里选择。',
    download: '下载',
    recent: '最近',
    recentGenerated: '最近生成',
    accountEyebrow: 'MilkBuddy 账号',
    createAccountTitle: '创建你的创作账号',
    loginTitle: '登录你的创作账号',
    emailLogin: '邮箱登录',
    register: '注册',
    login: '登录',
    email: '邮箱',
    password: '密码',
    passwordPlaceholder: '至少 8 位字符',
    repeatPassword: '重复密码',
    repeatPasswordPlaceholder: '再次输入密码',
    processing: '处理中...',
    createAccount: '创建账号',
    assetLibrary: '资产库',
    animeBishoujo: '美少女动漫',
    realistic: '真实写实',
    totalAssets: '资产总数',
    loaded: '已加载',
    collections: '分类',
    new: '新建',
    allImages: '全部图片',
    recentlyLoaded: '最近加载',
    searchAssets: '搜索资产和风格...',
    all: '全部',
    generated: '已生成',
    refresh: '刷新',
    loading: '加载中...',
    loadingAssets: '加载资产中',
    loadingAssetsHint: '正在从数据库读取生成资产。',
    noAssets: '暂无资产',
    noAssetsHint: '先生成图片，完成结果会自动保存到这里。',
    assetDetail: '资产详情',
    generatedImage: '生成图片',
    closeAssetDetail: '关闭资产详情',
    copied: '已复制',
    copyPrompt: '复制提示词',
    promptCopied: '提示词已复制',
    deleting: '删除中',
    delete: '删除',
    deletingAsset: '正在删除资产',
    deleteAsset: '删除资产',
    deleteConfirm: '删除这个资产？',
    style: '风格',
    ratio: '比例',
    size: '尺寸',
    created: '创建时间',
    uploadReferenceError: '请先上传参考图。',
    loadAssetsError: '加载资产失败',
    createImageToImageError: '图生图生成失败',
    createGenerationError: '生成失败',
    deleteAssetError: '删除资产失败',
  },
  en: {
    checkingSession: 'Checking session',
    loadingAccount: 'Loading your MilkBuddy account state.',
    brandSubtitle: 'AI Image Studio',
    workspace: 'Workspace',
    assets: 'Assets',
    credits: 'Credits',
    signOut: 'Sign out',
    signIn: 'Sign in',
    createMode: 'Create Mode',
    referenceDriven: 'Reference driven',
    referenceNote: 'Upload a reference image, then describe what to keep or change.',
    composerTitle: 'Describe the image you want to create',
    prompt: 'Prompt',
    clear: 'Clear',
    imageEditPlaceholder: 'Describe how the reference image should be transformed...',
    textPromptPlaceholder: 'Describe the character, pose, clothing, scene, lighting, and composition...',
    parameters: 'Parameters',
    aspectRatio: 'Aspect ratio',
    quality: 'Quality',
    high: 'High',
    ultra: 'Ultra',
    draft: 'Draft',
    images: 'Images',
    seed: 'Seed',
    random: 'Random',
    locked: 'Locked',
    generating: 'Generating...',
    generateFromImage: 'Generate from image',
    generate: 'Generate',
    results: 'Results',
    noImages: 'No images yet',
    noImagesImageMode: 'Upload a reference image, write a prompt, then generate.',
    noImagesTextMode: 'Choose a style, write a prompt, then generate.',
    selectedImage: 'Selected Image',
    generatingBatch: 'Generating batch',
    requestedImages: (count) => `${count} image${count > 1 ? 's' : ''} requested. Preview will load after completion.`,
    nothingSelected: 'Nothing selected',
    selectableHere: 'Generated images will be selectable here.',
    download: 'Download',
    recent: 'Recent',
    recentGenerated: 'Recent generations',
    accountEyebrow: 'MilkBuddy Account',
    createAccountTitle: 'Create your account',
    loginTitle: 'Login to your account',
    emailLogin: 'Email login',
    register: 'Register',
    login: 'Login',
    email: 'Email',
    password: 'Password',
    passwordPlaceholder: 'At least 8 characters',
    repeatPassword: 'Repeat password',
    repeatPasswordPlaceholder: 'Repeat your password',
    processing: 'Processing...',
    createAccount: 'Create account',
    assetLibrary: 'Asset Library',
    animeBishoujo: 'Anime Girl',
    realistic: 'Realistic',
    totalAssets: 'Total assets',
    loaded: 'Loaded',
    collections: 'Collections',
    new: 'New',
    allImages: 'All Images',
    recentlyLoaded: 'Recently loaded',
    searchAssets: 'Search assets and styles...',
    all: 'All',
    generated: 'Generated',
    refresh: 'Refresh',
    loading: 'Loading...',
    loadingAssets: 'Loading assets',
    loadingAssetsHint: 'Fetching generated assets from the database.',
    noAssets: 'No assets yet',
    noAssetsHint: 'Generate images first. Completed results will be saved here automatically.',
    assetDetail: 'Asset Detail',
    generatedImage: 'Generated image',
    closeAssetDetail: 'Close asset detail',
    copied: 'Copied',
    copyPrompt: 'Copy prompt',
    promptCopied: 'Prompt copied',
    deleting: 'Deleting',
    delete: 'Delete',
    deletingAsset: 'Deleting asset',
    deleteAsset: 'Delete asset',
    deleteConfirm: 'Delete this asset?',
    style: 'Style',
    ratio: 'Ratio',
    size: 'Size',
    created: 'Created',
    uploadReferenceError: 'Upload a reference image before generating.',
    loadAssetsError: 'Failed to load assets',
    createImageToImageError: 'Failed to create image-to-image generation',
    createGenerationError: 'Failed to create generation',
    deleteAssetError: 'Failed to delete asset',
  },
};

const stylePacks = [
  { id: 'anime_bishoujo', name: { zh: '美少女动漫', en: 'Anime Girl' }, count: 1, image: '/assets/milkbuddy-style-anime.png' },
  { id: 'anime_bishoujo_ultimate', name: { zh: '美少女(3d)', en: 'Anime Girl (3D)' }, count: 1, image: '/assets/milkbuddy-style-anime-3d.png' },
  { id: 'ultimate_bishoujo', name: { zh: '真实写实', en: 'Realistic' }, count: 1, image: '/assets/milkbuddy-style-realistic.png' },
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
  const [language, setLanguage] = useState('zh');
  const [currentPage, setCurrentPage] = useState('auth');
  const [authChecked, setAuthChecked] = useState(false);
  const [authMode, setAuthMode] = useState('register');
  const [authUser, setAuthUser] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authPasswordConfirm, setAuthPasswordConfirm] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [generationMode, setGenerationMode] = useState('text-to-image');
  const [activePack, setActivePack] = useState(stylePacks[0].id);
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
  const [deletingAssetId, setDeletingAssetId] = useState('');
  const [referenceImage, setReferenceImage] = useState(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState('');
  const recentImages = assets.length ? assets.map((asset) => imageURL(asset.url)) : timelineCards;
  const t = text[language];

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
        throw new Error(payload.error || t.loadAssetsError);
      }
      setAssets(payload.assets ?? []);
      setAssetTotal(payload.total ?? 0);
    } catch (error) {
      setAssetError(error.message);
    } finally {
      setAssetsLoading(false);
    }
  };

  const activeImages =
    generationJob?.status === 'completed' && generationJob.images?.length
      ? generationJob.images.map((image) => imageURL(image.url))
      : [];
  const isGenerating = generationJob?.status === 'queued' || generationJob?.status === 'running';
  const hasResults = activeImages.length > 0;
  const effectiveImageCount = generationMode === 'image-to-image' ? 1 : Number(imageCount);
  const loadingSlots = Array.from({ length: pendingImageCount }, (_, index) => index);

  const createGeneration = async () => {
    setGenerationError('');
    setSelectedImageIndex(0);
    setPendingImageCount(effectiveImageCount);
    if (generationMode === 'image-to-image') {
      if (!referenceImage) {
        setGenerationError(t.uploadReferenceError);
        return;
      }
      try {
        const form = new FormData();
        form.append('prompt', prompt);
        form.append('aspect_ratio', aspectRatio);
        form.append('quality', quality);
        form.append('image_count', '1');
        form.append('seed', seed === 'Random' ? '0' : seed);
        form.append('denoise', '0.55');
        form.append('reference_image', referenceImage);

        const response = await fetch(`${API_BASE_URL}/api/generations/image-to-image`, {
          method: 'POST',
          credentials: 'include',
          body: form,
        });
        const payload = await response.json();
        if (!response.ok) {
          if (response.status === 401) {
            setAuthUser(null);
            setCurrentPage('auth');
          }
          throw new Error(payload.error || t.createImageToImageError);
        }
        setGenerationJob(payload);
        if (typeof payload.credits_remaining === 'number') {
          setAuthUser((user) => (user ? { ...user, credits: payload.credits_remaining } : user));
        }
      } catch (error) {
        setGenerationError(error.message);
        setGenerationJob(null);
      }
      return;
    }
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
        throw new Error(payload.error || t.createGenerationError);
      }
      setGenerationJob(payload);
      if (typeof payload.credits_remaining === 'number') {
        setAuthUser((user) => (user ? { ...user, credits: payload.credits_remaining } : user));
      }
    } catch (error) {
      setGenerationError(error.message);
      setGenerationJob(null);
    }
  };

  const handleReferenceImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setReferenceImage(file);
    if (referenceImagePreview) {
      URL.revokeObjectURL(referenceImagePreview);
    }
    setReferenceImagePreview(URL.createObjectURL(file));
    setGenerationError('');
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
    if (deletingAssetId || !window.confirm(t.deleteConfirm)) {
      return;
    }
    setAssetError('');
    setDeletingAssetId(assetId);
    try {
      const response = await fetch(`${API_BASE_URL}/api/assets/${assetId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401) {
          setAuthUser(null);
          setCurrentPage('auth');
        }
      throw new Error(payload.error || t.deleteAssetError);
      }
      setAssets((items) => items.filter((asset) => asset.id !== assetId));
      setAssetTotal((count) => Math.max(0, count - 1));
      loadAssets();
    } catch (error) {
      setAssetError(error.message);
    } finally {
      setDeletingAssetId('');
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

  useEffect(() => {
    return () => {
      if (referenceImagePreview) {
        URL.revokeObjectURL(referenceImagePreview);
      }
    };
  }, [referenceImagePreview]);

  if (!authChecked) {
    return (
      <main className="app-shell">
        <div className="auth-page">
          <div className="result-empty">
            <strong>{t.checkingSession}</strong>
            <span>{t.loadingAccount}</span>
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
          <div className="brand-subtitle">{t.brandSubtitle}</div>
        </div>

        <div className="status-strip">
          {authUser ? (
            <nav className={`top-nav ${currentPage === 'assets' ? 'is-assets-page' : ''}`} aria-label="Primary">
              <span className="top-nav-indicator" aria-hidden="true" />
              <button
                type="button"
                className={currentPage === 'workspace' ? 'is-active' : ''}
                onClick={() => setCurrentPage('workspace')}
              >
                {t.workspace}
              </button>
              <button
                type="button"
                className={currentPage === 'assets' ? 'is-active' : ''}
                onClick={() => setCurrentPage('assets')}
              >
                {t.assets}
              </button>
            </nav>
          ) : null}
          {authUser ? (
            <>
              <div className="status-card">
                <span className="credit-orb" aria-hidden="true" />
                <span className="credit-label">{t.credits}</span>
                <strong>{authUser.credits}</strong>
              </div>
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
                    <button type="button" onClick={handleSignOut}>{t.signOut}</button>
                  </div>
                ) : null}
              </div>
            </>
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
              <span>{t.signIn}</span>
            </button>
          )}
          <button
            type="button"
            className="language-toggle"
            onClick={() => setLanguage((value) => (value === 'zh' ? 'en' : 'zh'))}
          >
            {language === 'zh' ? 'EN' : '中文'}
          </button>
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
          t={t}
        />
      ) : currentPage === 'assets' ? (
        <AssetsPage
          assets={assets}
          total={assetTotal}
          loading={assetsLoading}
          error={assetError}
          onRefresh={loadAssets}
          onDeleteAsset={deleteAsset}
          deletingAssetId={deletingAssetId}
          t={t}
        />
      ) : (
      <>
        <section className="workspace-grid">
        <aside className="left-rail panel">
          <div className="panel-heading">
            <h2>{t.createMode}</h2>
          </div>

          <div className={`mode-switch ${generationMode === 'image-to-image' ? 'is-image-mode' : ''}`} aria-label="Generation mode">
            <span className="mode-switch-indicator" aria-hidden="true" />
            <button
              type="button"
              className={generationMode === 'text-to-image' ? 'is-active' : ''}
              onClick={() => setGenerationMode('text-to-image')}
            >
              文生图
            </button>
            <button
              type="button"
              className={generationMode === 'image-to-image' ? 'is-active' : ''}
              onClick={() => setGenerationMode('image-to-image')}
            >
              图生图
            </button>
          </div>

          {generationMode === 'text-to-image' ? (
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
                  <strong>{pack.name[language]}</strong>
                  <small>{pack.count} {language === 'zh' ? '个风格' : 'style'}</small>
                </span>
              </button>
              ))}
            </div>
          ) : (
            <div className="image-mode-note">
              <strong>{t.referenceDriven}</strong>
              <span>{t.referenceNote}</span>
            </div>
          )}
        </aside>

        <section className="composer-column panel">
          <div className="composer-header">
            <h1>{t.composerTitle}</h1>
          </div>

          <div className="field-group prompt-field">
            <div className="field-label-row">
              <span className="field-label">{t.prompt}</span>
              <button
                type="button"
                className="prompt-clear-button"
                disabled={!prompt}
                onClick={() => setPrompt('')}
              >
                {t.clear}
              </button>
            </div>
            <div className={`prompt-input-wrap ${generationMode === 'image-to-image' ? 'has-reference-upload' : ''}`}>
              <textarea
                value={prompt}
                placeholder={
                  generationMode === 'image-to-image'
                    ? t.imageEditPlaceholder
                    : t.textPromptPlaceholder
                }
                onChange={(event) => setPrompt(event.target.value)}
              />
              {generationMode === 'image-to-image' ? (
                <div className="reference-upload">
                  {referenceImagePreview ? (
                    <div className="reference-chip">
                      <img src={referenceImagePreview} alt="" />
                      <span>{referenceImage.name}</span>
                      <button
                        type="button"
                        aria-label="Remove reference image"
                        onClick={() => {
                          setReferenceImage(null);
                          if (referenceImagePreview) {
                            URL.revokeObjectURL(referenceImagePreview);
                          }
                          setReferenceImagePreview('');
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : null}
                  <label className="reference-upload-button">
                    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleReferenceImageChange} />
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M5 5h14v14H5V5Zm2 2v8.1l2.7-2.7 2.5 2.5 3.2-4.1L17 13v-6H7Zm0 10h10.5l-2-2.7-3.1 4-2.7-2.7L7 17Z" />
                    </svg>
                  </label>
                </div>
              ) : null}
            </div>
          </div>

          <section className="parameter-panel">
            <div className="panel-heading">
              <h2>{t.parameters}</h2>
            </div>

            <div className="parameter-grid">
              <label>
                <span>{t.aspectRatio}</span>
                <select value={aspectRatio} onChange={(event) => setAspectRatio(event.target.value)}>
                  <option>16:9</option>
                  <option>3:2</option>
                  <option>4:5</option>
                  <option>21:9</option>
                </select>
              </label>

              <label>
                <span>{t.quality}</span>
                <select value={quality} onChange={(event) => setQuality(event.target.value)}>
                  <option value="High">{t.high}</option>
                  <option value="Ultra">{t.ultra}</option>
                  <option value="Draft">{t.draft}</option>
                </select>
              </label>

              {generationMode === 'text-to-image' ? (
                <label>
                  <span>{t.images}</span>
                  <select value={imageCount} onChange={(event) => setImageCount(event.target.value)}>
                    <option>4</option>
                    <option>2</option>
                    <option>1</option>
                  </select>
                </label>
              ) : null}

              <label>
                <span>{t.seed}</span>
                <select value={seed} onChange={(event) => setSeed(event.target.value)}>
                  <option value="Random">{t.random}</option>
                  <option value="Locked">{t.locked}</option>
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
              <span className="generate-label">
                {isGenerating ? t.generating : generationMode === 'image-to-image' ? t.generateFromImage : t.generate}
              </span>
            </button>
            {generationError ? <p className="generation-error">{generationError}</p> : null}
          </section>
        </section>

        <section className="results-column panel">
          <div className="panel-heading">
            <h2>{t.results}</h2>
          </div>

          {isGenerating ? (
            <div className="result-grid" aria-label="Generating images">
              {loadingSlots.map((slot) => (
                <div key={`loading-${slot}`} className="result-thumb result-loading">
                  <span className="loading-orb" />
                  <span className="loading-text">{t.generating} {slot + 1}</span>
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
              <strong>{t.noImages}</strong>
              <span>
                {generationMode === 'image-to-image'
                  ? t.noImagesImageMode
                  : t.noImagesTextMode}
              </span>
            </div>
          )}

          <div className="selected-block">
            <div className="selected-header">
              <h3>{t.selectedImage}</h3>
              <span>{hasResults ? aspectRatio : generationJob?.status ?? 'empty'}</span>
            </div>
            {isGenerating ? (
              <div className="selected-empty selected-loading">
                <span className="loading-orb loading-orb-large" />
                <strong>{t.generatingBatch}</strong>
                <span>{t.requestedImages(pendingImageCount)}</span>
              </div>
            ) : hasResults ? (
              <img className="selected-image" src={activeImages[selectedImageIndex]} alt="" />
            ) : (
              <div className="selected-empty">
                <strong>{t.nothingSelected}</strong>
                <span>{t.selectableHere}</span>
              </div>
            )}
          </div>
        </section>
        </section>

        <footer className="timeline-bar">
        <div className="timeline-meta">
          <span className="timeline-label">{t.recent}</span>
          <strong>{t.recentGenerated}</strong>
        </div>

        <div className="timeline-strip">
          {recentImages.map((image, index) => (
            <div
              key={`${image}-timeline-${index}`}
              className={`timeline-card ${index === 0 ? 'is-active' : ''}`}
            >
              <img src={image} alt="" />
            </div>
          ))}
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
  t,
}) {
  const isRegister = mode === 'register';

  return (
    <section className="auth-page">
      <div className="auth-card panel">
        <div className="auth-copy">
          <span className="eyebrow">{t.accountEyebrow}</span>
          <h1>{isRegister ? t.createAccountTitle : t.loginTitle}</h1>
          <p>{t.emailLogin}</p>
        </div>

        <form className="auth-form" onSubmit={onSubmit}>
          <div className="auth-tabs">
            <button
              type="button"
              className={isRegister ? 'is-active' : ''}
              onClick={() => onModeChange('register')}
            >
              {t.register}
            </button>
            <button
              type="button"
              className={!isRegister ? 'is-active' : ''}
              onClick={() => onModeChange('login')}
            >
              {t.login}
            </button>
          </div>

          <label>
            <span>{t.email}</span>
            <input
              type="email"
              value={email}
              placeholder="you@example.com"
              autoComplete="email"
              onChange={(event) => onEmailChange(event.target.value)}
            />
          </label>

          <label>
            <span>{t.password}</span>
            <input
              type="password"
              value={password}
              placeholder={t.passwordPlaceholder}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              onChange={(event) => onPasswordChange(event.target.value)}
            />
          </label>

          {isRegister ? (
            <label>
              <span>{t.repeatPassword}</span>
              <input
                type="password"
                value={passwordConfirm}
                placeholder={t.repeatPasswordPlaceholder}
                autoComplete="new-password"
                onChange={(event) => onPasswordConfirmChange(event.target.value)}
              />
            </label>
          ) : null}

          {error ? <p className="auth-error">{error}</p> : null}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? t.processing : isRegister ? t.createAccount : t.login}
          </button>
        </form>
      </div>
    </section>
  );
}

function AssetsPage({ assets, total, loading, error, onRefresh, onDeleteAsset, deletingAssetId, t }) {
  const [activeAssetId, setActiveAssetId] = useState('');
  const [copiedAssetId, setCopiedAssetId] = useState('');
  const activeAsset = assets.find((asset) => asset.id === activeAssetId);
  const animeCount = assets.filter((asset) => asset.style_id === 'anime_bishoujo').length;
  const realisticCount = assets.filter((asset) => asset.style_id === 'ultimate_bishoujo').length;

  const copyPrompt = async (asset) => {
    if (!asset?.prompt) {
      return;
    }
    await copyText(asset.prompt);
    setCopiedAssetId(asset.id);
    window.setTimeout(() => setCopiedAssetId(''), 1600);
  };

  useEffect(() => {
    if (activeAssetId && !assets.some((asset) => asset.id === activeAssetId)) {
      setActiveAssetId('');
    }
  }, [assets, activeAssetId]);

  return (
    <section className="asset-page">
      <div className="asset-hero panel">
        <div className="asset-title">
          <h1>{t.assetLibrary}</h1>
        </div>
        <div className="asset-stats">
          <div>
            <strong>{total}</strong>
            <span>{t.totalAssets}</span>
          </div>
          <div>
            <strong>{assets.length}</strong>
            <span>{t.loaded}</span>
          </div>
          <div>
            <strong>{realisticCount}</strong>
            <span>{t.realistic}</span>
          </div>
        </div>
      </div>

      <div className="asset-layout">
        <aside className="asset-sidebar panel">
          <div className="panel-heading">
            <h2>{t.collections}</h2>
          </div>
          <div className="collection-item is-active">
            <span>{t.allImages}</span>
            <strong>{total}</strong>
          </div>
          <div className="collection-item">
            <span>{t.recentlyLoaded}</span>
            <strong>{assets.length}</strong>
          </div>
          <div className="collection-item">
            <span>{t.realistic}</span>
            <strong>{realisticCount}</strong>
          </div>
          <div className="collection-item">
            <span>{t.animeBishoujo}</span>
            <strong>{animeCount}</strong>
          </div>
        </aside>

        <section className="asset-board panel">
          <div className="asset-toolbar">
            <div className="asset-search">{t.searchAssets}</div>
            <div className="asset-filters">
              <button type="button" onClick={onRefresh}>{loading ? t.loading : t.refresh}</button>
            </div>
          </div>

          {error ? <p className="asset-error">{error}</p> : null}
          {loading && !assets.length ? (
            <div className="result-empty result-grid-empty">
              <strong>{t.loadingAssets}</strong>
              <span>{t.loadingAssetsHint}</span>
            </div>
          ) : assets.length ? (
            <div className="asset-grid">
              {assets.map((asset) => (
                <article
                  key={asset.id}
                  className={`asset-card ${activeAsset?.id === asset.id ? 'is-active' : ''}`}
                >
                  <button type="button" className="asset-card-main" onClick={() => setActiveAssetId(asset.id)}>
                    <img src={imageURL(asset.url)} alt="" />
                    <div className="asset-card-body">
                      <span>{asset.style_name} · {asset.aspect_ratio}</span>
                      <strong>{formatDate(asset.created_at)}</strong>
                    </div>
                  </button>
                  <a
                    className="asset-card-action asset-card-download"
                    href={`${API_BASE_URL}/api/assets/${asset.id}/download`}
                    title={t.download}
                    aria-label={t.download}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M11 4h2v8l3-3 1.4 1.4L12 15.8l-5.4-5.4L8 9l3 3V4Z" />
                      <path d="M5 18h14v2H5v-2Z" />
                    </svg>
                  </a>
                  <button
                    type="button"
                    className={`asset-card-action asset-copy-prompt ${copiedAssetId === asset.id ? 'is-copied' : ''}`}
                    title={copiedAssetId === asset.id ? t.copied : t.copyPrompt}
                    aria-label={copiedAssetId === asset.id ? t.promptCopied : t.copyPrompt}
                    disabled={!asset.prompt}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      copyPrompt(asset).catch(() => setCopiedAssetId('copy-error'));
                    }}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8 7h10v13H8V7Zm2 2v9h6V9h-6Z" />
                      <path d="M5 4h10v2H7v10H5V4Z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={`asset-card-action asset-delete-icon ${deletingAssetId === asset.id ? 'is-deleting' : ''}`}
                    title={deletingAssetId === asset.id ? t.deleting : t.delete}
                    aria-label={deletingAssetId === asset.id ? t.deletingAsset : t.deleteAsset}
                    disabled={deletingAssetId === asset.id}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onDeleteAsset(asset.id);
                    }}
                  >
                    {deletingAssetId === asset.id ? (
                      '...'
                    ) : (
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M9 3h6l1 2h4v2H4V5h4l1-2Z" />
                        <path d="M6 9h12l-1 11H7L6 9Zm4 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z" />
                      </svg>
                    )}
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="result-empty result-grid-empty">
              <strong>{t.noAssets}</strong>
              <span>{t.noAssetsHint}</span>
            </div>
          )}
        </section>

      </div>

      {activeAsset ? (
        <div className="asset-modal" role="dialog" aria-modal="true" aria-label={t.assetDetail} onClick={() => setActiveAssetId('')}>
          <div className="asset-modal-panel panel" onClick={(event) => event.stopPropagation()}>
            <div className="asset-modal-header">
              <div>
                <span className="eyebrow">{t.assetDetail}</span>
                <h2>{t.generatedImage}</h2>
              </div>
              <button type="button" className="asset-modal-close" aria-label={t.closeAssetDetail} onClick={() => setActiveAssetId('')}>
                ×
              </button>
            </div>

            <div className="asset-preview">
              <img src={imageURL(activeAsset.url)} alt="" />
              <a
                className="asset-download-icon"
                href={`${API_BASE_URL}/api/assets/${activeAsset.id}/download`}
                title={t.download}
                aria-label={t.download}
              >
                ↓
              </a>
              <button
                type="button"
                className={`asset-copy-prompt-icon ${copiedAssetId === activeAsset.id ? 'is-copied' : ''}`}
                title={copiedAssetId === activeAsset.id ? t.copied : t.copyPrompt}
                aria-label={copiedAssetId === activeAsset.id ? t.promptCopied : t.copyPrompt}
                disabled={!activeAsset.prompt}
                onClick={() => copyPrompt(activeAsset).catch(() => setCopiedAssetId('copy-error'))}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8 7h10v13H8V7Zm2 2v9h6V9h-6Z" />
                  <path d="M5 4h10v2H7v10H5V4Z" />
                </svg>
              </button>
            </div>

            <div className="asset-meta-list">
              <span>{t.style} <strong>{activeAsset.style_name}</strong></span>
              <span>{t.ratio} <strong>{activeAsset.aspect_ratio}</strong></span>
              <span>{t.size} <strong>{activeAsset.width}x{activeAsset.height}</strong></span>
              <span>{t.seed} <strong>{activeAsset.seed}</strong></span>
              <span>{t.created} <strong>{formatDate(activeAsset.created_at)}</strong></span>
            </div>
          </div>
        </div>
      ) : null}
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
