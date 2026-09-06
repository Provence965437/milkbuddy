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

const navIcons = {
  workspace: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5h16v10H4V5Zm2 2v6h12V7H6Z" />
      <path d="M8 18h8v2H8v-2Zm3-3h2v4h-2v-4Z" />
    </svg>
  ),
  assets: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 4h14v16H5V4Zm2 2v12h10V6H7Z" />
      <path d="M8 14l2.5-3 2 2.4L14 12l2 3H8Zm1-6h3v2H9V8Z" />
    </svg>
  ),
  dashboard: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 13h4v7H4v-7Zm6-9h4v16h-4V4Zm6 5h4v11h-4V9Z" />
    </svg>
  ),
};

const text = {
  zh: {
    checkingSession: '检查登录状态',
    loadingAccount: '正在加载你的 ConceiveBody 账号状态',
    brandSubtitle: 'AI 图像工作室',
    navigation: '导航',
    workspace: '工作台',
    assets: '资产',
    credits: '积分',
    signOut: '退出',
    signIn: '登录',
    dashboard: '看板',
    startCreating: '开始创作',
    viewWorkspace: '进入工作台',
    homeHeroEyebrow: 'AI 图像创作平台',
    homeHeroTitle: '用文字和参考图，快速生成你想要的视觉角色',
    homeHeroCopy: 'ConceiveBody 聚焦高自由度 AI 生图工作流。先从文生图和图生图开始，逐步沉淀风格、资产和角色能力。',
    homePromptLabel: '输入你的画面描述',
    homePromptSample: '一个金发亚洲女孩，蓝色薄纱睡衣，电影感暖光，侧躺在黄色床上，娇羞表情...',
    homeGeneratePreview: '生成预览',
    homeModeText: '文生图',
    homeModeImage: '图生图',
    homeFeatureTitle: '从灵感到资产的完整链路',
    homeFeatureOneTitle: '多风格文生图',
    homeFeatureOneCopy: '选择风格后输入 prompt，系统自动拼接风格描述并生成多张结果。',
    homeFeatureTwoTitle: '参考图编辑',
    homeFeatureTwoCopy: '上传参考图，用自然语言描述要保留和修改的部分，适合角色微调。',
    homeFeatureThreeTitle: '资产沉淀',
    homeFeatureThreeCopy: '生成后的图片自动入库，可分页浏览、下载、删除、复制 prompt。',
    homeWorkflowTitle: '创作流程',
    homeStepOne: '选择文生图或图生图',
    homeStepTwo: '填写 prompt 和基础参数',
    homeStepThree: '生成、筛选并保存到资产库',
    homeStyleTitle: '当前可用风格',
    homePrivacyTitle: '面向私密创作的产品基础',
    homePrivacyCopy: '登录后才能访问工作台和资产页；生成资产存储在云端对象存储，后续可继续接入支付、队列、角色和聊天模块。',
    adminDashboard: '管理员看板',
    dashboardSubtitle: '核心增长、访问和生成使用量趋势',
    registeredUsers: '注册用户',
    siteVisits: '网站访问',
    activeUsers: '活跃用户',
    generationRuns: '生成次数',
    generatedImages: '生成图片',
    creditsConsumed: '消耗积分',
    last7Days: '近 7 天',
    trend14Days: '14 天趋势',
    userGrowth: '用户增长',
    usageTrend: '使用趋势',
    noMetricData: '暂无趋势数据',
    loadMetricsError: '加载看板失败',
    insufficientCreditsTitle: '积分不足',
    insufficientCreditsMessage: '当前积分不足，无法发起本次生成。',
    insufficientCreditsHint: '请减少生成数量，或联系管理员补充积分。',
    understood: '知道了',
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
    accountEyebrow: 'ConceiveBody 账号',
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
    blurPreview: '模糊预览',
    clearPreview: '清晰预览',
    previousPage: '上一页',
    nextPage: '下一页',
    pageStatus: (page, totalPages) => `第 ${page} / ${Math.max(totalPages, 1)} 页`,
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
    loadingAccount: 'Loading your ConceiveBody account state.',
    brandSubtitle: 'AI Image Studio',
    navigation: 'Navigation',
    workspace: 'Workspace',
    assets: 'Assets',
    credits: 'Credits',
    signOut: 'Sign out',
    signIn: 'Sign in',
    dashboard: 'Dashboard',
    startCreating: 'Start creating',
    viewWorkspace: 'Open workspace',
    homeHeroEyebrow: 'AI Image Creation Platform',
    homeHeroTitle: 'Create visual characters from text and reference images.',
    homeHeroCopy: 'ConceiveBody focuses on flexible AI image workflows. Start with text-to-image and image-to-image, then build toward styles, assets, characters, and chat.',
    homePromptLabel: 'Describe your scene',
    homePromptSample: 'A blonde Asian girl, blue sheer nightgown, cinematic warm light, lying sideways on a yellow bed, shy expression...',
    homeGeneratePreview: 'Generate preview',
    homeModeText: 'Text to image',
    homeModeImage: 'Image to image',
    homeFeatureTitle: 'A full path from idea to reusable assets',
    homeFeatureOneTitle: 'Multi-style text generation',
    homeFeatureOneCopy: 'Pick a style, write a prompt, and the system combines style instructions before generating image batches.',
    homeFeatureTwoTitle: 'Reference image editing',
    homeFeatureTwoCopy: 'Upload a reference image and describe what to keep or change with natural language.',
    homeFeatureThreeTitle: 'Asset library',
    homeFeatureThreeCopy: 'Completed generations are saved automatically, with pagination, download, delete, and prompt copy support.',
    homeWorkflowTitle: 'Creation flow',
    homeStepOne: 'Choose text-to-image or image-to-image',
    homeStepTwo: 'Write a prompt and basic parameters',
    homeStepThree: 'Generate, select, and save to the asset library',
    homeStyleTitle: 'Available styles',
    homePrivacyTitle: 'Built for private creation workflows',
    homePrivacyCopy: 'Workspace and assets require login. Generated assets are stored in cloud object storage, ready for payments, queues, characters, and chat modules later.',
    adminDashboard: 'Admin Dashboard',
    dashboardSubtitle: 'Core growth, traffic, and generation usage trends.',
    registeredUsers: 'Registered users',
    siteVisits: 'Site visits',
    activeUsers: 'Active users',
    generationRuns: 'Generation runs',
    generatedImages: 'Generated images',
    creditsConsumed: 'Credits consumed',
    last7Days: 'Last 7 days',
    trend14Days: '14-day trend',
    userGrowth: 'User growth',
    usageTrend: 'Usage trend',
    noMetricData: 'No trend data yet',
    loadMetricsError: 'Failed to load dashboard',
    insufficientCreditsTitle: 'Insufficient credits',
    insufficientCreditsMessage: 'You do not have enough credits for this generation.',
    insufficientCreditsHint: 'Reduce the image count or contact an administrator to add credits.',
    understood: 'Got it',
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
    accountEyebrow: 'ConceiveBody Account',
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
    blurPreview: 'Blur preview',
    clearPreview: 'Clear preview',
    previousPage: 'Previous',
    nextPage: 'Next',
    pageStatus: (page, totalPages) => `Page ${page} / ${Math.max(totalPages, 1)}`,
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
  { id: 'anime_bishoujo', name: { zh: '美少女动漫', en: 'Anime Girl' }, count: 1, image: '/assets/conceivebody-style-anime.png' },
  { id: 'anime_bishoujo_ultimate', name: { zh: '美少女(3d)', en: 'Anime Girl (3D)' }, count: 1, image: '/assets/conceivebody-style-anime-3d.png' },
  { id: 'ultimate_bishoujo', name: { zh: '真实写实', en: 'Realistic' }, count: 1, image: '/assets/conceivebody-style-realistic.png' },
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
  const [currentPage, setCurrentPage] = useState('home');
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
  const [creditDialogMessage, setCreditDialogMessage] = useState('');
  const [pendingImageCount, setPendingImageCount] = useState(Number(imageCount));
  const [assets, setAssets] = useState([]);
  const [assetTotal, setAssetTotal] = useState(0);
  const [assetPage, setAssetPage] = useState(1);
  const [assetPageSize] = useState(24);
  const [assetTotalPages, setAssetTotalPages] = useState(0);
  const [assetError, setAssetError] = useState('');
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [deletingAssetId, setDeletingAssetId] = useState('');
  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState('');
  const [referenceImage, setReferenceImage] = useState(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState('');
  const recentImages = assets.length ? assets.map((asset) => imageURL(asset.url)) : timelineCards;
  const t = text[language];

  const loadAssets = async (page = assetPage) => {
    if (!authUser) {
      return;
    }
    const nextPage = Math.max(1, page);
    setAssetsLoading(true);
    setAssetError('');
    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        page_size: String(assetPageSize),
      });
      const response = await fetch(`${API_BASE_URL}/api/assets?${params}`, { credentials: 'include' });
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
      setAssetPage(payload.page ?? nextPage);
      setAssetTotalPages(payload.total_pages ?? 0);
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

  const createCreditError = (message) => {
    const error = new Error(message || t.insufficientCreditsMessage);
    error.isCreditError = true;
    return error;
  };

  const handleGenerationError = (error) => {
    if (error.isCreditError) {
      setCreditDialogMessage(error.message);
      setGenerationError('');
      return;
    }
    setGenerationError(error.message);
  };

  const trackEvent = (eventName, page, metadata = {}) => {
    fetch(`${API_BASE_URL}/api/events`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_name: eventName, page, metadata }),
    }).catch(() => {});
  };

  const loadMetrics = async () => {
    if (!authUser?.is_admin) {
      return;
    }
    setMetricsLoading(true);
    setMetricsError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/metrics?days=14`, { credentials: 'include' });
      const payload = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          setAuthUser(null);
          setCurrentPage('auth');
        }
        throw new Error(payload.error || t.loadMetricsError);
      }
      setMetrics(payload);
    } catch (error) {
      setMetricsError(error.message);
    } finally {
      setMetricsLoading(false);
    }
  };

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
          if (response.status === 402) {
            throw createCreditError(payload.error || t.insufficientCreditsMessage);
          }
          throw new Error(payload.error || t.createImageToImageError);
        }
        setGenerationJob(payload);
        if (typeof payload.credits_remaining === 'number') {
          setAuthUser((user) => (user ? { ...user, credits: payload.credits_remaining } : user));
        }
      } catch (error) {
        handleGenerationError(error);
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
        if (response.status === 402) {
          throw createCreditError(payload.error || t.insufficientCreditsMessage);
        }
        throw new Error(payload.error || t.createGenerationError);
      }
      setGenerationJob(payload);
      if (typeof payload.credits_remaining === 'number') {
        setAuthUser((user) => (user ? { ...user, credits: payload.credits_remaining } : user));
      }
    } catch (error) {
      handleGenerationError(error);
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
      const nextTotal = Math.max(0, assetTotal - 1);
      const nextTotalPages = Math.ceil(nextTotal / assetPageSize);
      const nextPage = Math.min(assetPage, Math.max(1, nextTotalPages));
      setAssetTotal(nextTotal);
      loadAssets(nextPage);
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
          loadAssets(1);
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
          setCurrentPage((page) => (page === 'auth' ? 'workspace' : page));
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
      loadAssets(1);
    } else {
      setAssets([]);
      setAssetTotal(0);
      setAssetPage(1);
      setAssetTotalPages(0);
      setMetrics(null);
    }
  }, [authUser]);

  useEffect(() => {
    if (currentPage === 'dashboard' && authUser && !authUser.is_admin) {
      setCurrentPage('workspace');
    }
  }, [authUser, currentPage]);

  useEffect(() => {
    if (currentPage === 'dashboard' && authUser?.is_admin) {
      loadMetrics();
    }
  }, [authUser, currentPage]);

  useEffect(() => {
    if (!authChecked) {
      return;
    }
    trackEvent('page_view', authUser ? currentPage : 'auth', {
      authenticated: Boolean(authUser),
    });
  }, [authChecked, authUser?.id, currentPage]);

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
    <>
    <main className="app-shell">
      <header className="topbar">
        <button
          type="button"
          className="brand-block brand-button"
          onClick={() => setCurrentPage('home')}
        >
          <div className="brand-mark">ConceiveBody</div>
          <div className="brand-subtitle">{t.brandSubtitle}</div>
        </button>

        <div className="status-strip">
          {authUser ? (
            <div className="nav-cluster">
              <span className="nav-title">{t.navigation}</span>
              <nav
                className={`top-nav ${currentPage === 'assets' ? 'is-assets-page' : ''} ${currentPage === 'dashboard' ? 'is-dashboard-page' : ''}`}
                aria-label="Primary"
              >
                <span className="top-nav-indicator" aria-hidden="true" />
                <button
                  type="button"
                  className={currentPage === 'workspace' ? 'is-active' : ''}
                  onClick={() => setCurrentPage('workspace')}
                >
                  {navIcons.workspace}
                  <span>{t.workspace}</span>
                </button>
                <button
                  type="button"
                  className={currentPage === 'assets' ? 'is-active' : ''}
                  onClick={() => setCurrentPage('assets')}
                >
                  {navIcons.assets}
                  <span>{t.assets}</span>
                </button>
              </nav>
            </div>
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
                    {authUser.is_admin ? (
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentPage('dashboard');
                          setUserMenuOpen(false);
                        }}
                      >
                        {navIcons.dashboard}
                        <span>{t.dashboard}</span>
                      </button>
                    ) : null}
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

      {currentPage === 'home' ? (
        <HomePage
          language={language}
          onStart={() => {
            if (authUser) {
              setCurrentPage('workspace');
              return;
            }
            setAuthMode('register');
            setCurrentPage('auth');
          }}
          t={t}
        />
      ) : currentPage === 'auth' ? (
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
      ) : !authUser ? (
        <HomePage
          language={language}
          onStart={() => {
            setAuthMode('register');
            setCurrentPage('auth');
          }}
          t={t}
        />
      ) : currentPage === 'assets' ? (
        <AssetsPage
          assets={assets}
          total={assetTotal}
          page={assetPage}
          totalPages={assetTotalPages}
          loading={assetsLoading}
          error={assetError}
          onRefresh={loadAssets}
          onPageChange={loadAssets}
          onDeleteAsset={deleteAsset}
          deletingAssetId={deletingAssetId}
          t={t}
        />
      ) : currentPage === 'dashboard' && authUser.is_admin ? (
        <DashboardPage
          metrics={metrics}
          loading={metricsLoading}
          error={metricsError}
          onRefresh={loadMetrics}
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
    {creditDialogMessage ? (
      <div className="asset-modal credit-modal" role="dialog" aria-modal="true" aria-label={t.insufficientCreditsTitle} onClick={() => setCreditDialogMessage('')}>
        <div className="credit-modal-panel panel" onClick={(event) => event.stopPropagation()}>
          <div className="asset-modal-header">
            <div>
              <span className="eyebrow">{t.credits}</span>
              <h2>{t.insufficientCreditsTitle}</h2>
            </div>
            <button type="button" className="asset-modal-close" aria-label={t.insufficientCreditsTitle} onClick={() => setCreditDialogMessage('')}>
              x
            </button>
          </div>
          <p>{creditDialogMessage}</p>
          <span>{t.insufficientCreditsHint}</span>
          <button type="button" className="credit-modal-action" onClick={() => setCreditDialogMessage('')}>
            {t.understood}
          </button>
        </div>
      </div>
    ) : null}
    </>
  );
}

function HomePage({ language, onStart, t }) {
  const galleryImages = [
    '/assets/conceivebody-style-realistic.png',
    '/assets/conceivebody-style-anime.png',
    '/assets/conceivebody-style-anime-3d.png',
  ];
  const features = [
    { title: t.homeFeatureOneTitle, copy: t.homeFeatureOneCopy },
    { title: t.homeFeatureTwoTitle, copy: t.homeFeatureTwoCopy },
    { title: t.homeFeatureThreeTitle, copy: t.homeFeatureThreeCopy },
  ];
  const steps = [t.homeStepOne, t.homeStepTwo, t.homeStepThree];

  return (
    <section className="home-page">
      <div className="home-hero">
        <div className="home-hero-copy">
          <span className="eyebrow">{t.homeHeroEyebrow}</span>
          <h1>{t.homeHeroTitle}</h1>
          <p>{t.homeHeroCopy}</p>
          <div className="home-cta-row">
            <button type="button" className="home-primary-cta" onClick={onStart}>
              {t.startCreating}
            </button>
            <span>Text to Image · Image to Image · Asset Library</span>
          </div>
        </div>

        <div className="home-generator-card panel">
          <div className="home-mode-pills">
            <span>{t.homeModeText}</span>
            <span>{t.homeModeImage}</span>
          </div>
          <label>
            <span>{t.homePromptLabel}</span>
            <div className="home-prompt-box">{t.homePromptSample}</div>
          </label>
          <button type="button" onClick={onStart}>{t.homeGeneratePreview}</button>
          <div className="home-preview-grid">
            {galleryImages.map((image) => (
              <img key={image} src={image} alt="" />
            ))}
          </div>
        </div>
      </div>

      <div className="home-section">
        <div className="home-section-heading">
          <span className="eyebrow">{t.homeFeatureTitle}</span>
          <h2>{t.homeWorkflowTitle}</h2>
        </div>
        <div className="home-feature-grid">
          {features.map((feature, index) => (
            <article className="home-feature-card panel" key={feature.title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{feature.title}</h3>
              <p>{feature.copy}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="home-workflow panel">
        {steps.map((step, index) => (
          <div className="home-workflow-step" key={step}>
            <strong>{index + 1}</strong>
            <span>{step}</span>
          </div>
        ))}
      </div>

      <div className="home-section">
        <div className="home-section-heading">
          <span className="eyebrow">{t.homeStyleTitle}</span>
          <h2>{language === 'zh' ? '先用少量风格跑通质量闭环' : 'Start with focused styles and quality loops'}</h2>
        </div>
        <div className="home-style-row">
          {stylePacks.map((style) => (
            <article className="home-style-card" key={style.id}>
              <img src={style.image} alt="" />
              <strong>{style.name[language]}</strong>
            </article>
          ))}
        </div>
      </div>

      <div className="home-bottom-cta panel">
        <div>
          <span className="eyebrow">{t.homePrivacyTitle}</span>
          <h2>{t.viewWorkspace}</h2>
          <p>{t.homePrivacyCopy}</p>
        </div>
        <button type="button" className="home-primary-cta" onClick={onStart}>
          {t.startCreating}
        </button>
      </div>
    </section>
  );
}

function DashboardPage({ metrics, loading, error, onRefresh, t }) {
  const totals = metrics?.totals ?? {};
  const trend = metrics?.trend ?? [];
  const maxTrend = Math.max(
    1,
    ...trend.map((point) => Math.max(point.visits ?? 0, point.generation_runs ?? 0, point.generated_images ?? 0)),
  );
  const cards = [
    { label: t.registeredUsers, value: totals.users, delta: totals.last_7_day_users },
    { label: t.siteVisits, value: totals.visits, delta: totals.last_7_day_visits },
    { label: t.activeUsers, value: totals.active_users },
    { label: t.generationRuns, value: totals.generation_runs, delta: totals.last_7_day_runs },
    { label: t.generatedImages, value: totals.generated_images, delta: totals.last_7_day_images },
    { label: t.creditsConsumed, value: totals.credits_consumed },
  ];

  return (
    <section className="dashboard-page">
      <div className="dashboard-hero panel">
        <div>
          <span className="eyebrow">{t.dashboard}</span>
          <h1>{t.adminDashboard}</h1>
          <p>{t.dashboardSubtitle}</p>
        </div>
        <button type="button" className="dashboard-refresh" onClick={onRefresh} disabled={loading}>
          {loading ? t.loading : t.refresh}
        </button>
      </div>

      {error ? <p className="asset-error">{error}</p> : null}

      <div className="dashboard-card-grid">
        {cards.map((card) => (
          <article className="dashboard-stat-card panel" key={card.label}>
            <span>{card.label}</span>
            <strong>{formatNumber(card.value ?? 0)}</strong>
            {typeof card.delta === 'number' ? <small>{t.last7Days}: +{formatNumber(card.delta)}</small> : null}
          </article>
        ))}
      </div>

      <div className="dashboard-chart panel">
        <div className="panel-heading">
          <h2>{t.trend14Days}</h2>
          <span className="chart-legend">
            <i className="legend-visits" /> {t.siteVisits}
            <i className="legend-runs" /> {t.generationRuns}
            <i className="legend-images" /> {t.generatedImages}
          </span>
        </div>

        {trend.length ? (
          <div className="trend-bars">
            {trend.map((point) => (
              <div className="trend-day" key={point.date}>
                <div className="trend-stack">
                  <span className="trend-bar visits" style={{ height: `${Math.max(5, ((point.visits ?? 0) / maxTrend) * 100)}%` }} />
                  <span className="trend-bar runs" style={{ height: `${Math.max(5, ((point.generation_runs ?? 0) / maxTrend) * 100)}%` }} />
                  <span className="trend-bar images" style={{ height: `${Math.max(5, ((point.generated_images ?? 0) / maxTrend) * 100)}%` }} />
                </div>
                <small>{point.date.slice(5)}</small>
              </div>
            ))}
          </div>
        ) : (
          <div className="result-empty result-grid-empty">
            <strong>{t.noMetricData}</strong>
          </div>
        )}
      </div>
    </section>
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

function AssetsPage({
  assets,
  total,
  page,
  totalPages,
  loading,
  error,
  onRefresh,
  onPageChange,
  onDeleteAsset,
  deletingAssetId,
  t,
}) {
  const [activeAssetId, setActiveAssetId] = useState('');
  const [copiedAssetId, setCopiedAssetId] = useState('');
  const [blurAssets, setBlurAssets] = useState(true);
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
              <button
                type="button"
                className={`asset-blur-toggle ${blurAssets ? 'is-on' : ''}`}
                aria-pressed={blurAssets}
                onClick={() => setBlurAssets((value) => !value)}
              >
                <span className="asset-blur-toggle-track" aria-hidden="true">
                  <span />
                </span>
                {blurAssets ? t.blurPreview : t.clearPreview}
              </button>
              <button type="button" onClick={() => onRefresh(page)}>{loading ? t.loading : t.refresh}</button>
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
                    <img className={`asset-image ${blurAssets ? 'is-blurred' : ''}`} src={imageURL(asset.url)} alt="" />
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

          <div className="asset-pagination">
            <button
              type="button"
              disabled={loading || page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              {t.previousPage}
            </button>
            <span>{t.pageStatus(page, totalPages)}</span>
            <button
              type="button"
              disabled={loading || page >= Math.max(totalPages, 1)}
              onClick={() => onPageChange(page + 1)}
            >
              {t.nextPage}
            </button>
          </div>
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
              <img className={`asset-image ${blurAssets ? 'is-blurred' : ''}`} src={imageURL(activeAsset.url)} alt="" />
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

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value);
}
