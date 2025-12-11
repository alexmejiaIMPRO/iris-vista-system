'use client';

import { useState, useEffect } from 'react';
import { Search, ShoppingCart, AlertCircle, CheckCircle, X, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { productsApi, requestsApi } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import type { Product, CreateRequestInput } from '@/types';

export default function CatalogPage() {
  const { language } = useLanguage();
  const { addToCart, items: cartItems, clearCart } = useCart();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [requestType, setRequestType] = useState<'issue' | 'pr' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    issueReason: '',
    costCenter: user?.cost_center || '',
    purpose: '',
  });

  const text = {
    en: {
      title: 'Internal Catalog',
      subtitle: 'Browse and order from internal inventory',
      search: 'Search products...',
      addToCart: 'Add to Cart',
      inStock: 'In Stock',
      outOfStock: 'Out of Stock',
      limitedStock: 'Limited Stock',
      categories: {
        all: 'All Products',
        office: 'Office Supplies',
        ppe: 'PPE',
        it: 'IT Equipment',
        cleaning: 'Cleaning Supplies',
      },
      sortOptions: {
        name: 'Name (A-Z)',
        priceAsc: 'Price: Low to High',
        priceDesc: 'Price: High to Low',
        stock: 'Stock Status',
      },
      supplier: 'Supplier',
      model: 'Model',
      specifications: 'Specifications',
      productsCount: 'products',
      submitRequest: 'Submit Request',
      materialIssueRequest: 'Material Issue Request',
      purchaseRequisition: 'Purchase Requisition',
      issueReason: 'Issue Reason',
      issueReasonPlaceholder: 'Reason for requesting this material...',
      costCenter: 'Cost Center',
      costCenterPlaceholder: 'e.g., CC-2024-001',
      purpose: 'Purpose / Reason',
      purposePlaceholder: 'Detailed purpose for this purchase...',
      submit: 'Submit',
      cancel: 'Cancel',
      itemsInCart: 'items in cart',
      requestSubmitted: 'Request submitted successfully!',
    },
    zh: {
      title: '内部目录',
      subtitle: '浏览并订购内部库存',
      search: '搜索产品...',
      addToCart: '加入购物车',
      inStock: '有货',
      outOfStock: '缺货',
      limitedStock: '库存有限',
      categories: {
        all: '所有产品',
        office: '办公用品',
        ppe: 'PPE',
        it: 'IT设备',
        cleaning: '清洁用品',
      },
      sortOptions: {
        name: '名称 (A-Z)',
        priceAsc: '价格：从低到高',
        priceDesc: '价格：从高到低',
        stock: '库存状态',
      },
      supplier: '供应商',
      model: '型号',
      specifications: '规格',
      productsCount: '个产品',
      submitRequest: '提交请求',
      materialIssueRequest: '物料发放请求',
      purchaseRequisition: '采购申请',
      issueReason: '发放原因',
      issueReasonPlaceholder: '请求此物料的原因...',
      costCenter: '成本中心',
      costCenterPlaceholder: '例如：CC-2024-001',
      purpose: '目的/原因',
      purposePlaceholder: '此次采购的详细目的...',
      submit: '提交',
      cancel: '取消',
      itemsInCart: '个商品在购物车',
      requestSubmitted: '请求提交成功！',
    },
    es: {
      title: 'Catálogo Interno',
      subtitle: 'Navegar y ordenar del inventario interno',
      search: 'Buscar productos...',
      addToCart: 'Agregar al Carrito',
      inStock: 'En Stock',
      outOfStock: 'Agotado',
      limitedStock: 'Stock Limitado',
      categories: {
        all: 'Todos los Productos',
        office: 'Suministros de Oficina',
        ppe: 'EPP',
        it: 'Equipo de TI',
        cleaning: 'Suministros de Limpieza',
      },
      sortOptions: {
        name: 'Nombre (A-Z)',
        priceAsc: 'Precio: Menor a Mayor',
        priceDesc: 'Precio: Mayor a Menor',
        stock: 'Estado de Stock',
      },
      supplier: 'Proveedor',
      model: 'Modelo',
      specifications: 'Especificaciones',
      productsCount: 'productos',
      submitRequest: 'Enviar Solicitud',
      materialIssueRequest: 'Solicitud de Emisión de Material',
      purchaseRequisition: 'Requisición de Compra',
      issueReason: 'Razón de Emisión',
      issueReasonPlaceholder: 'Razón para solicitar este material...',
      costCenter: 'Centro de Costos',
      costCenterPlaceholder: 'ej., CC-2024-001',
      purpose: 'Propósito / Razón',
      purposePlaceholder: 'Propósito detallado para esta compra...',
      submit: 'Enviar',
      cancel: 'Cancelar',
      itemsInCart: 'artículos en el carrito',
      requestSubmitted: '¡Solicitud enviada exitosamente!',
    },
  };

  const t = text[language];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsResponse, categoriesData] = await Promise.all([
          productsApi.list({ per_page: 100 }),
          productsApi.getCategories('internal'),
        ]);
        setProducts(productsResponse.data || []);
        setCategories(['all', ...categoriesData]);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getProductName = (product: Product) => {
    if (language === 'zh') return product.name_zh || product.name;
    if (language === 'es') return product.name_es || product.name;
    return product.name;
  };

  const getProductSpec = (product: Product) => {
    if (language === 'zh') return product.spec_zh || product.specification;
    if (language === 'es') return product.spec_es || product.specification;
    return product.specification;
  };

  const filteredProducts = products
    .filter((product) => selectedCategory === 'all' || product.category === selectedCategory)
    .filter((product) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        getProductName(product).toLowerCase().includes(query) ||
        product.model.toLowerCase().includes(query) ||
        getProductSpec(product).toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'name') return getProductName(a).localeCompare(getProductName(b));
      if (sortBy === 'priceAsc') return a.price - b.price;
      if (sortBy === 'priceDesc') return b.price - a.price;
      if (sortBy === 'stock') return b.stock - a.stock;
      return 0;
    });

  const getStockBadge = (product: Product) => {
    if (product.stock === 0 || product.stock_status === 'out_of_stock') {
      return (
        <Badge className="bg-[#E0E4E7] text-[#6B7280] hover:bg-[#E0E4E7] border-0 font-medium flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {t.outOfStock}
        </Badge>
      );
    } else if (product.stock < 100 || product.stock_status === 'limited') {
      return (
        <Badge className="bg-[#FEF3C7] text-[#F59E0B] hover:bg-[#FEF3C7] border-0 font-medium flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {t.limitedStock}
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-[#D1FAE5] text-[#10B981] hover:bg-[#D1FAE5] border-0 font-medium flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          {t.inStock}
        </Badge>
      );
    }
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
  };

  const handleSubmit = () => {
    const allItemsHaveStock = cartItems.every((item) => item.product.stock > 0);
    if (allItemsHaveStock) {
      setRequestType('issue');
    } else {
      setRequestType('pr');
    }
    setShowSubmitModal(true);
  };

  const submitRequest = async () => {
    setIsSubmitting(true);
    try {
      const requestData: CreateRequestInput = {
        type: requestType === 'issue' ? 'material_issue' : 'purchase_requisition',
        cost_center: formData.costCenter,
        purpose: requestType === 'issue' ? formData.issueReason : formData.purpose,
        priority: 'normal',
        items: cartItems.map((item) => ({
          product_id: item.product.id,
          name: item.product.name,
          specification: item.product.specification,
          quantity: item.quantity,
          unit_price: item.product.price,
          supplier: item.product.supplier,
          source: 'internal',
          image_url: item.product.image_url,
        })),
      };

      await requestsApi.create(requestData);
      alert(t.requestSubmitted);
      setShowSubmitModal(false);
      clearCart();
      setFormData({ issueReason: '', costCenter: user?.cost_center || '', purpose: '' });
    } catch (error) {
      console.error('Failed to submit request:', error);
      alert('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
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
        <div className="mx-auto max-w-7xl">
          <h1 className="mb-2 text-4xl text-[#2C2C2C]" style={{ fontWeight: 600 }}>
            {t.title}
          </h1>
          <p className="text-base text-[#6E6B67]">{t.subtitle}</p>
        </div>
      </section>

      {/* Filters & Search */}
      <section className="px-8 py-6 bg-white border-b border-[#E4E1DD]">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6E6B67]" />
              <input
                type="text"
                placeholder={t.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-[#E4E1DD] bg-white py-2.5 pl-12 pr-4 text-sm text-[#2C2C2C] transition-all placeholder:text-[#6E6B67] focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-[#E4E1DD] bg-white px-4 py-2.5 text-sm text-[#2C2C2C] font-medium transition-all focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
            >
              {Object.entries(t.sortOptions).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            {/* Cart Button */}
            {cartItems.length > 0 && (
              <button
                onClick={handleSubmit}
                className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#75534B] to-[#5D423C] px-5 py-3 text-white font-medium shadow-sm transition-all hover:shadow-lg active:scale-95"
              >
                <ShoppingCart className="h-5 w-5" />
                {t.submitRequest} ({cartItems.length})
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="mt-4 flex gap-2 flex-wrap">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-[#75534B] to-[#5D423C] text-white shadow-sm'
                    : 'bg-white text-[#75534B] border border-[#E4E1DD] hover:bg-[#F9F8F6]'
                }`}
              >
                {t.categories[category as keyof typeof t.categories] || category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="px-8 py-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-6 text-sm text-[#6E6B67]">
            {filteredProducts.length} {t.productsCount}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="rounded-lg bg-white border border-[#E4E1DD] p-5 shadow-sm hover:shadow-md transition-all"
              >
                <div className="text-5xl mb-4">{product.image_emoji || '📦'}</div>

                <h3 className="mb-1 text-base font-semibold text-[#2C2C2C]">
                  {getProductName(product)}
                </h3>

                <div className="mb-3 space-y-1">
                  <p className="text-xs text-[#6E6B67]">
                    <span className="font-medium">{t.model}:</span> {product.model}
                  </p>
                  <p className="text-xs text-[#6E6B67]">
                    <span className="font-medium">{t.specifications}:</span> {getProductSpec(product)}
                  </p>
                  <p className="text-xs text-[#6E6B67]">
                    <span className="font-medium">{t.supplier}:</span> {product.supplier}
                  </p>
                </div>

                <div className="mb-3 flex items-center justify-between">
                  <span className="text-lg font-semibold text-[#2C2C2C]">
                    {product.currency}${product.price.toFixed(2)}
                  </span>
                  {getStockBadge(product)}
                </div>

                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={product.stock === 0}
                  className="w-full rounded-lg bg-gradient-to-r from-[#75534B] to-[#5D423C] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t.addToCart}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#75534B] to-[#5D423C] p-6 rounded-t-xl flex items-center justify-between">
              <h2 className="text-2xl text-white font-semibold">
                {requestType === 'issue' ? t.materialIssueRequest : t.purchaseRequisition}
              </h2>
              <button onClick={() => setShowSubmitModal(false)} className="text-white hover:text-white/80">
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-5">
              {requestType === 'issue' && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#2C2C2C]">
                    {t.issueReason} <span className="text-[#EF4444]">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={formData.issueReason}
                    onChange={(e) => setFormData({ ...formData, issueReason: e.target.value })}
                    placeholder={t.issueReasonPlaceholder}
                    className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 text-sm text-[#2C2C2C] transition-all placeholder:text-[#6E6B67] focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
                  ></textarea>
                </div>
              )}

              {requestType === 'pr' && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#2C2C2C]">
                    {t.purpose} <span className="text-[#EF4444]">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    placeholder={t.purposePlaceholder}
                    className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 text-sm text-[#2C2C2C] transition-all placeholder:text-[#6E6B67] focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
                  ></textarea>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#2C2C2C]">
                  {t.costCenter} <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.costCenter}
                  onChange={(e) => setFormData({ ...formData, costCenter: e.target.value })}
                  placeholder={t.costCenterPlaceholder}
                  className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 text-sm text-[#2C2C2C] transition-all placeholder:text-[#6E6B67] focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
                />
              </div>

              {/* Items Summary */}
              <div className="rounded-lg bg-[#F9F8F6] p-4 border border-[#E4E1DD]">
                <p className="text-sm font-semibold text-[#2C2C2C] mb-2">
                  {t.itemsInCart}: {cartItems.length}
                </p>
                <div className="space-y-1">
                  {cartItems.slice(0, 3).map((item, idx) => (
                    <p key={idx} className="text-xs text-[#6E6B67]">
                      • {getProductName(item.product)} ({item.product.model}) x{item.quantity}
                    </p>
                  ))}
                  {cartItems.length > 3 && (
                    <p className="text-xs text-[#6E6B67]">
                      ... and {cartItems.length - 3} more items
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-[#E4E1DD] p-6 flex items-center justify-between">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-6 py-3 text-[#6E6B67] font-medium transition-colors hover:text-[#2C2C2C]"
              >
                {t.cancel}
              </button>
              <button
                onClick={submitRequest}
                disabled={isSubmitting}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#75534B] to-[#5D423C] text-white font-medium shadow-sm transition-all hover:shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {t.submit}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
