'use client';

import { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Save,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
  Key,
  Globe,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { adminApi } from '@/lib/api';
import type { AmazonConfig } from '@/types';

const REGIONS = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'EU West (Ireland)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
];

const MARKETPLACES = [
  { value: 'www.amazon.com', label: 'Amazon.com (US)' },
  { value: 'www.amazon.co.uk', label: 'Amazon.co.uk (UK)' },
  { value: 'www.amazon.de', label: 'Amazon.de (Germany)' },
  { value: 'www.amazon.fr', label: 'Amazon.fr (France)' },
  { value: 'www.amazon.co.jp', label: 'Amazon.co.jp (Japan)' },
  { value: 'www.amazon.ca', label: 'Amazon.ca (Canada)' },
];

export default function AmazonConfigPage() {
  const { language } = useLanguage();
  const [config, setConfig] = useState<AmazonConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    // PA-API credentials
    access_key: '',
    secret_key: '',
    partner_tag: '',
    region: 'us-east-1',
    marketplace: 'www.amazon.com',
    // Business account credentials
    username: '',
    password: '',
    account_id: '',
    business_group: '',
    default_shipping_address: '',
    is_active: true,
  });

  const text = {
    en: {
      title: 'Amazon Integration',
      subtitle: 'Configure PA-API for product search and Business account for ordering',
      // PA-API section
      paapiSection: 'Product Advertising API (PA-API)',
      paapiDescription: 'Required for searching Amazon products. Get credentials from Amazon Associates.',
      accessKey: 'Access Key',
      secretKey: 'Secret Key',
      secretKeyPlaceholder: 'Enter secret key (leave blank to keep current)',
      partnerTag: 'Partner Tag (Associate ID)',
      partnerTagPlaceholder: 'your-tag-20',
      region: 'AWS Region',
      marketplace: 'Amazon Marketplace',
      // Business section
      businessSection: 'Amazon Business Account (Optional)',
      businessDescription: 'For automated ordering. Leave blank if not using automated checkout.',
      credentials: 'Credentials',
      username: 'Amazon Business Email',
      password: 'Password',
      passwordPlaceholder: 'Enter password (leave blank to keep current)',
      accountId: 'Account ID',
      businessGroup: 'Business Group',
      shippingAddress: 'Default Shipping Address',
      // Status
      status: 'Integration Status',
      paapiStatus: 'PA-API',
      businessStatus: 'Business Account',
      active: 'Active',
      inactive: 'Inactive',
      lastSync: 'Last Sync',
      lastTest: 'Last Test',
      never: 'Never',
      configured: 'Configured',
      notConfigured: 'Not Configured',
      // Actions
      testConnection: 'Test Connection',
      testing: 'Testing...',
      save: 'Save Configuration',
      saving: 'Saving...',
      testSuccess: 'Connection test successful',
      testFailed: 'Connection test failed',
      saveSuccess: 'Configuration saved successfully',
      saveFailed: 'Failed to save configuration',
      warning: 'Credentials will be encrypted before storage',
    },
    zh: {
      title: 'Amazon 集成',
      subtitle: '配置 PA-API 以搜索产品，配置 Business 账户以下单',
      paapiSection: '产品广告 API (PA-API)',
      paapiDescription: '搜索 Amazon 产品必需。从 Amazon Associates 获取凭证。',
      accessKey: '访问密钥',
      secretKey: '密钥',
      secretKeyPlaceholder: '输入密钥（留空保持当前）',
      partnerTag: '合作伙伴标签 (Associate ID)',
      partnerTagPlaceholder: 'your-tag-20',
      region: 'AWS 区域',
      marketplace: 'Amazon 市场',
      businessSection: 'Amazon Business 账户（可选）',
      businessDescription: '用于自动下单。如不使用自动结账可留空。',
      credentials: '凭证',
      username: 'Amazon Business 邮箱',
      password: '密码',
      passwordPlaceholder: '输入密码（留空保持当前密码）',
      accountId: '账户ID',
      businessGroup: '业务组',
      shippingAddress: '默认收货地址',
      status: '集成状态',
      paapiStatus: 'PA-API',
      businessStatus: 'Business 账户',
      active: '已启用',
      inactive: '未启用',
      lastSync: '上次同步',
      lastTest: '上次测试',
      never: '从未',
      configured: '已配置',
      notConfigured: '未配置',
      testConnection: '测试连接',
      testing: '测试中...',
      save: '保存配置',
      saving: '保存中...',
      testSuccess: '连接测试成功',
      testFailed: '连接测试失败',
      saveSuccess: '配置保存成功',
      saveFailed: '保存配置失败',
      warning: '凭证将在存储前加密',
    },
    es: {
      title: 'Integración de Amazon',
      subtitle: 'Configure PA-API para buscar productos y cuenta Business para pedidos',
      paapiSection: 'API de Publicidad de Productos (PA-API)',
      paapiDescription: 'Requerido para buscar productos de Amazon. Obtenga credenciales de Amazon Associates.',
      accessKey: 'Clave de Acceso',
      secretKey: 'Clave Secreta',
      secretKeyPlaceholder: 'Ingrese clave secreta (dejar en blanco para mantener actual)',
      partnerTag: 'Etiqueta de Socio (Associate ID)',
      partnerTagPlaceholder: 'your-tag-20',
      region: 'Región de AWS',
      marketplace: 'Mercado de Amazon',
      businessSection: 'Cuenta de Amazon Business (Opcional)',
      businessDescription: 'Para pedidos automatizados. Dejar en blanco si no usa checkout automático.',
      credentials: 'Credenciales',
      username: 'Email de Amazon Business',
      password: 'Contraseña',
      passwordPlaceholder: 'Ingrese contraseña (dejar en blanco para mantener actual)',
      accountId: 'ID de Cuenta',
      businessGroup: 'Grupo de Negocio',
      shippingAddress: 'Dirección de Envío Predeterminada',
      status: 'Estado de Integración',
      paapiStatus: 'PA-API',
      businessStatus: 'Cuenta Business',
      active: 'Activo',
      inactive: 'Inactivo',
      lastSync: 'Última Sincronización',
      lastTest: 'Última Prueba',
      never: 'Nunca',
      configured: 'Configurado',
      notConfigured: 'No Configurado',
      testConnection: 'Probar Conexión',
      testing: 'Probando...',
      save: 'Guardar Configuración',
      saving: 'Guardando...',
      testSuccess: 'Prueba de conexión exitosa',
      testFailed: 'Prueba de conexión fallida',
      saveSuccess: 'Configuración guardada exitosamente',
      saveFailed: 'Error al guardar configuración',
      warning: 'Las credenciales serán encriptadas antes de almacenarlas',
    },
  };

  const t = text[language];

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const data = await adminApi.getAmazonConfig();
      setConfig(data);
      if (data) {
        setFormData({
          access_key: data.access_key || '',
          secret_key: '',
          partner_tag: data.partner_tag || '',
          region: data.region || 'us-east-1',
          marketplace: data.marketplace || 'www.amazon.com',
          username: data.username || '',
          password: '',
          account_id: data.account_id || '',
          business_group: data.business_group || '',
          default_shipping_address: data.default_shipping_address || '',
          is_active: data.is_active ?? true,
        });
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      await adminApi.saveAmazonConfig(formData);
      setMessage({ type: 'success', text: t.saveSuccess });
      fetchConfig();
    } catch (error) {
      console.error('Failed to save config:', error);
      setMessage({ type: 'error', text: t.saveFailed });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setMessage(null);
    try {
      const result = await adminApi.testAmazonConnection();
      if (result.status === 'success') {
        setMessage({ type: 'success', text: t.testSuccess });
      } else {
        setMessage({ type: 'error', text: result.message || t.testFailed });
      }
      fetchConfig();
    } catch (error) {
      console.error('Failed to test connection:', error);
      setMessage({ type: 'error', text: t.testFailed });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-[#75534B]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      {/* Header */}
      <section className="border-b border-[#E4E1DD] bg-white px-8 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-12 w-12 rounded-xl bg-[#E08A4B] flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl text-[#2C2C2C]" style={{ fontWeight: 600 }}>
                {t.title}
              </h1>
              <p className="text-base text-[#6E6B67]">{t.subtitle}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-8 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Status Card */}
          <div className="rounded-xl bg-white border border-[#E4E1DD] p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#2C2C2C] mb-4">{t.status}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* PA-API Status */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-[#6E6B67]" />
                  <span className="text-sm text-[#6E6B67]">{t.paapiStatus}:</span>
                </div>
                {config?.paapi_configured ? (
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-[#4BAF7E]" />
                    <span className="text-sm text-[#4BAF7E]">{t.configured}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <XCircle className="h-4 w-4 text-[#D1625B]" />
                    <span className="text-sm text-[#D1625B]">{t.notConfigured}</span>
                  </div>
                )}
              </div>
              {/* Business Status */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-[#6E6B67]" />
                  <span className="text-sm text-[#6E6B67]">{t.businessStatus}:</span>
                </div>
                {config?.business_configured ? (
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-[#4BAF7E]" />
                    <span className="text-sm text-[#4BAF7E]">{t.configured}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <XCircle className="h-4 w-4 text-[#6E6B67]" />
                    <span className="text-sm text-[#6E6B67]">{t.notConfigured}</span>
                  </div>
                )}
              </div>
              {/* Active Status */}
              <div className="flex items-center gap-3">
                <div
                  className={`h-3 w-3 rounded-full ${
                    config?.is_active ? 'bg-[#4BAF7E]' : 'bg-[#D1625B]'
                  }`}
                />
                <span className="text-sm text-[#6E6B67]">
                  {config?.is_active ? t.active : t.inactive}
                </span>
              </div>
            </div>
            {config?.test_status && (
              <div
                className={`mt-4 p-3 rounded-lg ${
                  config.test_status === 'success'
                    ? 'bg-[#4BAF7E]/10 text-[#4BAF7E]'
                    : 'bg-[#D1625B]/10 text-[#D1625B]'
                }`}
              >
                <p className="text-sm font-medium">
                  {config.test_status === 'success' ? t.testSuccess : config.test_message}
                </p>
              </div>
            )}
          </div>

          {/* Message */}
          {message && (
            <div
              className={`p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-[#4BAF7E]/10 text-[#4BAF7E] border border-[#4BAF7E]/20'
                  : 'bg-[#D1625B]/10 text-[#D1625B] border border-[#D1625B]/20'
              }`}
            >
              <div className="flex items-center gap-2">
                {message.type === 'success' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <p className="font-medium">{message.text}</p>
              </div>
            </div>
          )}

          {/* PA-API Section */}
          <div className="rounded-xl bg-white border border-[#E4E1DD] p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Key className="h-5 w-5 text-[#E08A4B]" />
              <h2 className="text-lg font-semibold text-[#2C2C2C]">{t.paapiSection}</h2>
            </div>
            <p className="text-sm text-[#6E6B67] mb-4">{t.paapiDescription}</p>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#2C2C2C]">
                    {t.accessKey}
                  </label>
                  <input
                    type="text"
                    value={formData.access_key}
                    onChange={(e) => setFormData({ ...formData, access_key: e.target.value })}
                    className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 text-sm text-[#2C2C2C] transition-all focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
                    placeholder="AKIAIOSFODNN7EXAMPLE"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#2C2C2C]">
                    {t.partnerTag}
                  </label>
                  <input
                    type="text"
                    value={formData.partner_tag}
                    onChange={(e) => setFormData({ ...formData, partner_tag: e.target.value })}
                    className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 text-sm text-[#2C2C2C] transition-all focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
                    placeholder={t.partnerTagPlaceholder}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#2C2C2C]">
                  {t.secretKey}
                </label>
                <div className="relative">
                  <input
                    type={showSecretKey ? 'text' : 'password'}
                    value={formData.secret_key}
                    onChange={(e) => setFormData({ ...formData, secret_key: e.target.value })}
                    className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 pr-12 text-sm text-[#2C2C2C] transition-all focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
                    placeholder={t.secretKeyPlaceholder}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E6B67] hover:text-[#2C2C2C]"
                  >
                    {showSecretKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {config?.has_secret_key && (
                  <p className="mt-1 text-xs text-[#4BAF7E]">Secret key is configured</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#2C2C2C]">
                    {t.region}
                  </label>
                  <select
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 text-sm text-[#2C2C2C] transition-all focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
                  >
                    {REGIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#2C2C2C]">
                    {t.marketplace}
                  </label>
                  <select
                    value={formData.marketplace}
                    onChange={(e) => setFormData({ ...formData, marketplace: e.target.value })}
                    className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 text-sm text-[#2C2C2C] transition-all focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
                  >
                    {MARKETPLACES.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Business Account Section */}
          <div className="rounded-xl bg-white border border-[#E4E1DD] p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Globe className="h-5 w-5 text-[#75534B]" />
              <h2 className="text-lg font-semibold text-[#2C2C2C]">{t.businessSection}</h2>
            </div>
            <p className="text-sm text-[#6E6B67] mb-4">{t.businessDescription}</p>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#2C2C2C]">
                  {t.username}
                </label>
                <input
                  type="email"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 text-sm text-[#2C2C2C] transition-all focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
                  placeholder="amazon-business@company.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#2C2C2C]">
                  {t.password}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 pr-12 text-sm text-[#2C2C2C] transition-all focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
                    placeholder={t.passwordPlaceholder}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6E6B67] hover:text-[#2C2C2C]"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {config?.has_password && (
                  <p className="mt-1 text-xs text-[#4BAF7E]">Password is configured</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#2C2C2C]">
                    {t.accountId}
                  </label>
                  <input
                    type="text"
                    value={formData.account_id}
                    onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                    className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 text-sm text-[#2C2C2C] transition-all focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#2C2C2C]">
                    {t.businessGroup}
                  </label>
                  <input
                    type="text"
                    value={formData.business_group}
                    onChange={(e) => setFormData({ ...formData, business_group: e.target.value })}
                    className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 text-sm text-[#2C2C2C] transition-all focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#2C2C2C]">
                  {t.shippingAddress}
                </label>
                <textarea
                  value={formData.default_shipping_address}
                  onChange={(e) =>
                    setFormData({ ...formData, default_shipping_address: e.target.value })
                  }
                  rows={3}
                  className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 text-sm text-[#2C2C2C] transition-all focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Active Toggle & Warning */}
          <div className="rounded-xl bg-white border border-[#E4E1DD] p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    formData.is_active ? 'bg-[#4BAF7E]' : 'bg-[#E4E1DD]'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                      formData.is_active ? 'left-5' : 'left-0.5'
                    }`}
                  />
                </button>
                <span className="text-sm text-[#2C2C2C]">
                  {formData.is_active ? t.active : t.inactive}
                </span>
              </div>
              <p className="text-xs text-[#6E6B67] flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {t.warning}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleTest}
              disabled={isTesting || (!formData.access_key && !formData.username)}
              className="flex items-center gap-2 rounded-lg border border-[#E4E1DD] bg-white px-6 py-3 text-sm font-medium text-[#2C2C2C] transition-all hover:bg-[#F9F8F6] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {isTesting ? t.testing : t.testConnection}
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#75534B] to-[#5D423C] px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:shadow-lg active:scale-95 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? t.saving : t.save}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
