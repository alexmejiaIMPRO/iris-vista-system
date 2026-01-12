'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Link2,
  Loader2,
  ShoppingCart,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Package,
  Zap,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { purchaseRequestsApi, type ProductMetadata } from '@/lib/api';
import { Badge } from '@/components/ui/badge';

export default function NewPurchaseRequestPage() {
  const { language } = useLanguage();
  const router = useRouter();

  const [url, setUrl] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [justification, setJustification] = useState('');
  const [urgency, setUrgency] = useState<'normal' | 'urgent'>('normal');

  const [metadata, setMetadata] = useState<ProductMetadata | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const text = {
    en: {
      title: 'New Purchase Request',
      subtitle: 'Submit a product URL for approval',
      urlLabel: 'Product URL',
      urlPlaceholder: 'Paste the product URL (Amazon, MercadoLibre, or any site)',
      urlHint: 'We\'ll automatically extract product details from the link',
      fetchDetails: 'Fetch Details',
      productPreview: 'Product Preview',
      quantity: 'Quantity',
      justification: 'Justification',
      justificationPlaceholder: 'Why do you need this product?',
      urgency: 'Urgency',
      normal: 'Normal',
      urgent: 'Urgent',
      submit: 'Submit Request',
      submitting: 'Submitting...',
      success: 'Request submitted successfully!',
      successMessage: 'Your request has been sent for approval.',
      viewRequests: 'View My Requests',
      createAnother: 'Create Another',
      error: 'Error',
      amazonBadge: 'Amazon - Auto Cart',
      amazonHint: 'This product will be automatically added to the Amazon cart when approved',
      manualBadge: 'Manual Purchase',
      manualHint: 'This product will need to be purchased manually after approval',
      price: 'Estimated Price',
      noImage: 'No image available',
      fetchError: 'Could not fetch product details. You can fill them manually.',
    },
    zh: {
      title: '新建采购请求',
      subtitle: '提交产品链接以待批准',
      urlLabel: '产品链接',
      urlPlaceholder: '粘贴产品链接（Amazon、MercadoLibre或任何网站）',
      urlHint: '我们将自动从链接中提取产品详情',
      fetchDetails: '获取详情',
      productPreview: '产品预览',
      quantity: '数量',
      justification: '申请理由',
      justificationPlaceholder: '您为什么需要这个产品？',
      urgency: '紧急程度',
      normal: '普通',
      urgent: '紧急',
      submit: '提交请求',
      submitting: '提交中...',
      success: '请求提交成功！',
      successMessage: '您的请求已发送等待批准。',
      viewRequests: '查看我的请求',
      createAnother: '再创建一个',
      error: '错误',
      amazonBadge: 'Amazon - 自动加购',
      amazonHint: '批准后，此产品将自动添加到Amazon购物车',
      manualBadge: '手动采购',
      manualHint: '批准后，此产品需要手动购买',
      price: '预估价格',
      noImage: '无图片',
      fetchError: '无法获取产品详情。您可以手动填写。',
    },
    es: {
      title: 'Nueva Solicitud de Compra',
      subtitle: 'Enviar URL de producto para aprobacion',
      urlLabel: 'URL del Producto',
      urlPlaceholder: 'Pega la URL del producto (Amazon, MercadoLibre, o cualquier sitio)',
      urlHint: 'Extraeremos automaticamente los detalles del producto',
      fetchDetails: 'Obtener Detalles',
      productPreview: 'Vista Previa del Producto',
      quantity: 'Cantidad',
      justification: 'Justificacion',
      justificationPlaceholder: 'Por que necesitas este producto?',
      urgency: 'Urgencia',
      normal: 'Normal',
      urgent: 'Urgente',
      submit: 'Enviar Solicitud',
      submitting: 'Enviando...',
      success: 'Solicitud enviada exitosamente!',
      successMessage: 'Tu solicitud ha sido enviada para aprobacion.',
      viewRequests: 'Ver Mis Solicitudes',
      createAnother: 'Crear Otra',
      error: 'Error',
      amazonBadge: 'Amazon - Carrito Auto',
      amazonHint: 'Este producto se agregara automaticamente al carrito de Amazon al aprobarse',
      manualBadge: 'Compra Manual',
      manualHint: 'Este producto debera comprarse manualmente despues de la aprobacion',
      price: 'Precio Estimado',
      noImage: 'Sin imagen',
      fetchError: 'No se pudieron obtener los detalles del producto. Puedes llenarlos manualmente.',
    },
  };

  const t = text[language];

  const fetchMetadata = async () => {
    if (!url.trim()) return;

    setIsLoadingMetadata(true);
    setError(null);

    try {
      const data = await purchaseRequestsApi.extractMetadata(url);
      setMetadata(data);
      if (data.error) {
        setError(t.fetchError);
      }
    } catch (err) {
      console.error('Failed to fetch metadata:', err);
      setError(t.fetchError);
      // Create minimal metadata for manual input
      setMetadata({
        url,
        title: '',
        description: '',
        image_url: '',
        price: null,
        currency: 'MXN',
        site_name: '',
        is_amazon: url.toLowerCase().includes('amazon'),
        amazon_asin: '',
        error: 'Failed to fetch',
      });
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim() || !justification.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await purchaseRequestsApi.create({
        url,
        quantity,
        justification,
        urgency,
        product_title: metadata?.title,
        product_image_url: metadata?.image_url,
        product_description: metadata?.description,
        estimated_price: metadata?.price || undefined,
        currency: metadata?.currency || 'MXN',
      });

      setSuccess(true);
    } catch (err) {
      console.error('Failed to submit request:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setUrl('');
    setQuantity(1);
    setJustification('');
    setUrgency('normal');
    setMetadata(null);
    setError(null);
    setSuccess(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-semibold text-[#2C2C2C] mb-2">{t.success}</h2>
          <p className="text-[#6E6B67] mb-6">{t.successMessage}</p>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/requests')}
              className="flex-1 rounded-lg bg-gradient-to-r from-[#75534B] to-[#5D423C] px-4 py-3 text-white font-medium"
            >
              {t.viewRequests}
            </button>
            <button
              onClick={resetForm}
              className="flex-1 rounded-lg border border-[#E4E1DD] px-4 py-3 text-[#2C2C2C] font-medium hover:bg-[#F9F8F6]"
            >
              {t.createAnother}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      {/* Header */}
      <section className="border-b border-[#E4E1DD] bg-white px-8 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#75534B] to-[#5D423C] flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-white" />
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

      {/* Form */}
      <section className="px-8 py-8">
        <div className="mx-auto max-w-3xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* URL Input */}
            <div className="bg-white rounded-xl border border-[#E4E1DD] p-6">
              <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">
                {t.urlLabel} <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6E6B67]" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={t.urlPlaceholder}
                    className="w-full rounded-lg border border-[#E4E1DD] bg-white py-3 pl-12 pr-4 text-sm text-[#2C2C2C] transition-all placeholder:text-[#9B9792] focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={fetchMetadata}
                  disabled={!url.trim() || isLoadingMetadata}
                  className="flex items-center gap-2 rounded-lg bg-[#F9F8F6] border border-[#E4E1DD] px-4 py-3 text-[#2C2C2C] font-medium hover:bg-[#E4E1DD] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingMetadata ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Package className="h-4 w-4" />
                  )}
                  {t.fetchDetails}
                </button>
              </div>
              <p className="text-sm text-[#9B9792] mt-2">{t.urlHint}</p>
            </div>

            {/* Product Preview */}
            {metadata && (
              <div className="bg-white rounded-xl border border-[#E4E1DD] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-[#2C2C2C]">{t.productPreview}</h3>
                  {metadata.is_amazon ? (
                    <Badge className="bg-[#E08A4B]/10 text-[#E08A4B] border-[#E08A4B]/30">
                      <Zap className="h-3 w-3 mr-1" />
                      {t.amazonBadge}
                    </Badge>
                  ) : (
                    <Badge className="bg-[#6E6B67]/10 text-[#6E6B67] border-[#6E6B67]/30">
                      {t.manualBadge}
                    </Badge>
                  )}
                </div>

                <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="w-32 h-32 rounded-lg bg-[#F9F8F6] border border-[#E4E1DD] flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {metadata.image_url ? (
                      <img
                        src={metadata.image_url}
                        alt={metadata.title}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <span className="text-[#9B9792] text-xs text-center px-2">{t.noImage}</span>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-[#2C2C2C] line-clamp-2 mb-1">
                      {metadata.title || url}
                    </h4>
                    {metadata.description && (
                      <p className="text-sm text-[#6E6B67] line-clamp-2 mb-2">
                        {metadata.description}
                      </p>
                    )}
                    {metadata.price && (
                      <p className="text-lg font-bold text-[#75534B]">
                        {metadata.currency || 'MXN'} ${metadata.price.toFixed(2)}
                      </p>
                    )}
                    {metadata.site_name && (
                      <p className="text-xs text-[#9B9792] mt-1">{metadata.site_name}</p>
                    )}
                  </div>

                  {/* External Link */}
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 p-2 rounded-lg hover:bg-[#F9F8F6] text-[#6E6B67] hover:text-[#2C2C2C]"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </a>
                </div>

                {/* Hints */}
                <p className="text-xs text-[#9B9792] mt-4 p-2 bg-[#F9F8F6] rounded-lg">
                  {metadata.is_amazon ? t.amazonHint : t.manualHint}
                </p>
              </div>
            )}

            {/* Quantity and Urgency */}
            <div className="bg-white rounded-xl border border-[#E4E1DD] p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">
                    {t.quantity} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full rounded-lg border border-[#E4E1DD] bg-white py-3 px-4 text-sm text-[#2C2C2C] focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">
                    {t.urgency}
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setUrgency('normal')}
                      className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all ${
                        urgency === 'normal'
                          ? 'bg-[#75534B] text-white'
                          : 'bg-[#F9F8F6] text-[#6E6B67] border border-[#E4E1DD] hover:bg-[#E4E1DD]'
                      }`}
                    >
                      {t.normal}
                    </button>
                    <button
                      type="button"
                      onClick={() => setUrgency('urgent')}
                      className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all ${
                        urgency === 'urgent'
                          ? 'bg-[#D1625B] text-white'
                          : 'bg-[#F9F8F6] text-[#6E6B67] border border-[#E4E1DD] hover:bg-[#E4E1DD]'
                      }`}
                    >
                      {t.urgent}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Justification */}
            <div className="bg-white rounded-xl border border-[#E4E1DD] p-6">
              <label className="block text-sm font-semibold text-[#2C2C2C] mb-2">
                {t.justification} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder={t.justificationPlaceholder}
                rows={4}
                className="w-full rounded-lg border border-[#E4E1DD] bg-white py-3 px-4 text-sm text-[#2C2C2C] placeholder:text-[#9B9792] focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20 resize-none"
                required
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || !url.trim() || !justification.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#75534B] to-[#5D423C] px-6 py-4 text-white font-medium shadow-sm transition-all hover:shadow-lg active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t.submitting}
                </>
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5" />
                  {t.submit}
                </>
              )}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
