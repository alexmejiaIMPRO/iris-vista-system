'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, Loader2, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { requestsApi } from '@/lib/api';
import type { CreateRequestInput, Product } from '@/types';

export default function CartPage() {
  const { language } = useLanguage();
  const { items, updateQuantity, removeFromCart, clearCart, totalAmount } = useCart();
  const { user } = useAuth();
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [requestType, setRequestType] = useState<'issue' | 'pr'>('issue');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    reason: '',
    costCenter: user?.cost_center || '',
    purpose: '',
  });

  const text = {
    en: {
      title: 'Shopping Cart',
      subtitle: 'Review your selected items',
      emptyCart: 'Your cart is empty',
      browseCatalog: 'Browse Catalog',
      item: 'Item',
      quantity: 'Quantity',
      unitPrice: 'Unit Price',
      total: 'Total',
      remove: 'Remove',
      clearCart: 'Clear Cart',
      subtotal: 'Subtotal',
      submitRequest: 'Submit Request',
      backToCatalog: 'Continue Shopping',
      materialIssueRequest: 'Material Issue Request',
      purchaseRequisition: 'Purchase Requisition',
      reason: 'Reason',
      reasonPlaceholder: 'Reason for this request...',
      costCenter: 'Cost Center',
      costCenterPlaceholder: 'e.g., CC-2024-001',
      submit: 'Submit',
      cancel: 'Cancel',
      requestSubmitted: 'Request submitted successfully!',
    },
    zh: {
      title: '购物车',
      subtitle: '查看您选择的商品',
      emptyCart: '购物车为空',
      browseCatalog: '浏览目录',
      item: '商品',
      quantity: '数量',
      unitPrice: '单价',
      total: '总计',
      remove: '删除',
      clearCart: '清空购物车',
      subtotal: '小计',
      submitRequest: '提交请求',
      backToCatalog: '继续购物',
      materialIssueRequest: '物料发放请求',
      purchaseRequisition: '采购申请',
      reason: '原因',
      reasonPlaceholder: '此请求的原因...',
      costCenter: '成本中心',
      costCenterPlaceholder: '例如：CC-2024-001',
      submit: '提交',
      cancel: '取消',
      requestSubmitted: '请求提交成功！',
    },
    es: {
      title: 'Carrito de Compras',
      subtitle: 'Revise sus artículos seleccionados',
      emptyCart: 'Su carrito está vacío',
      browseCatalog: 'Navegar Catálogo',
      item: 'Artículo',
      quantity: 'Cantidad',
      unitPrice: 'Precio Unitario',
      total: 'Total',
      remove: 'Eliminar',
      clearCart: 'Vaciar Carrito',
      subtotal: 'Subtotal',
      submitRequest: 'Enviar Solicitud',
      backToCatalog: 'Continuar Comprando',
      materialIssueRequest: 'Solicitud de Emisión de Material',
      purchaseRequisition: 'Requisición de Compra',
      reason: 'Razón',
      reasonPlaceholder: 'Razón para esta solicitud...',
      costCenter: 'Centro de Costos',
      costCenterPlaceholder: 'ej., CC-2024-001',
      submit: 'Enviar',
      cancel: 'Cancelar',
      requestSubmitted: '¡Solicitud enviada exitosamente!',
    },
  };

  const t = text[language];

  const getProductName = (product: Product) => {
    if (language === 'zh') return product.name_zh || product.name;
    if (language === 'es') return product.name_es || product.name;
    return product.name;
  };

  const handleSubmit = () => {
    const allItemsHaveStock = items.every((item) => item.product.stock > 0);
    setRequestType(allItemsHaveStock ? 'issue' : 'pr');
    setShowSubmitModal(true);
  };

  const submitRequest = async () => {
    setIsSubmitting(true);
    try {
      const requestData: CreateRequestInput = {
        type: requestType === 'issue' ? 'material_issue' : 'purchase_requisition',
        cost_center: formData.costCenter,
        purpose: formData.reason || formData.purpose,
        priority: 'normal',
        items: items.map((item) => ({
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
      setFormData({ reason: '', costCenter: user?.cost_center || '', purpose: '' });
    } catch (error) {
      console.error('Failed to submit request:', error);
      alert('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F9F8F6]">
        <section className="border-b border-[#E4E1DD] bg-white px-8 py-8">
          <div className="mx-auto max-w-7xl">
            <h1 className="mb-2 text-4xl text-[#2C2C2C]" style={{ fontWeight: 600 }}>
              {t.title}
            </h1>
            <p className="text-base text-[#6E6B67]">{t.subtitle}</p>
          </div>
        </section>

        <section className="px-8 py-8">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-lg bg-white shadow-sm border border-[#E4E1DD] p-12 text-center">
              <ShoppingCart className="h-16 w-16 text-[#E4E1DD] mx-auto mb-4" />
              <p className="text-xl text-[#6E6B67] mb-6">{t.emptyCart}</p>
              <Link
                href="/catalog"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#75534B] to-[#5D423C] px-6 py-3 text-white font-medium shadow-sm transition-all hover:shadow-lg active:scale-95"
              >
                {t.browseCatalog}
              </Link>
            </div>
          </div>
        </section>
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

      {/* Cart Content */}
      <section className="px-8 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="rounded-lg bg-white shadow-sm border border-[#E4E1DD] overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E4E1DD] bg-[#F9F8F6]">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#2C2C2C] uppercase tracking-wide">
                        {t.item}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#2C2C2C] uppercase tracking-wide">
                        {t.quantity}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#2C2C2C] uppercase tracking-wide">
                        {t.unitPrice}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#2C2C2C] uppercase tracking-wide">
                        {t.total}
                      </th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr
                        key={item.product.id}
                        className="border-b border-[#E4E1DD] last:border-0"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <span className="text-3xl">
                              {item.product.image_emoji || '📦'}
                            </span>
                            <div>
                              <p className="font-semibold text-[#2C2C2C]">
                                {getProductName(item.product)}
                              </p>
                              <p className="text-sm text-[#6E6B67]">
                                {item.product.model}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                updateQuantity(item.product.id, item.quantity - 1)
                              }
                              className="h-8 w-8 rounded-lg border border-[#E4E1DD] flex items-center justify-center text-[#6E6B67] hover:bg-[#F9F8F6] transition-colors"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-12 text-center font-medium text-[#2C2C2C]">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.product.id, item.quantity + 1)
                              }
                              className="h-8 w-8 rounded-lg border border-[#E4E1DD] flex items-center justify-center text-[#6E6B67] hover:bg-[#F9F8F6] transition-colors"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#6E6B67]">
                          ${item.product.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-[#2C2C2C]">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-[#D1625B] hover:text-[#B5534E] transition-colors"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex justify-between">
                <Link
                  href="/catalog"
                  className="flex items-center gap-2 text-[#75534B] hover:text-[#5D423C] transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t.backToCatalog}
                </Link>
                <button
                  onClick={clearCart}
                  className="flex items-center gap-2 text-[#D1625B] hover:text-[#B5534E] transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  {t.clearCart}
                </button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="rounded-lg bg-white shadow-sm border border-[#E4E1DD] p-6 sticky top-[100px]">
                <h2 className="text-lg font-semibold text-[#2C2C2C] mb-4">
                  Order Summary
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6E6B67]">
                      {items.length} item{items.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-[#2C2C2C]">${totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="border-t border-[#E4E1DD] pt-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-[#2C2C2C]">
                      {t.subtotal}
                    </span>
                    <span className="text-xl font-bold text-[#75534B]">
                      ${totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  className="w-full rounded-lg bg-gradient-to-r from-[#75534B] to-[#5D423C] px-4 py-3 text-white font-medium shadow-sm transition-all hover:shadow-lg active:scale-95"
                >
                  {t.submitRequest}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
            <div className="bg-gradient-to-r from-[#75534B] to-[#5D423C] p-6 rounded-t-xl flex items-center justify-between">
              <h2 className="text-xl text-white font-semibold">
                {requestType === 'issue' ? t.materialIssueRequest : t.purchaseRequisition}
              </h2>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-white hover:text-white/80"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#2C2C2C]">
                  {t.reason} <span className="text-[#EF4444]">*</span>
                </label>
                <textarea
                  rows={3}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder={t.reasonPlaceholder}
                  className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 text-sm text-[#2C2C2C] transition-all placeholder:text-[#6E6B67] focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
                ></textarea>
              </div>

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
            </div>

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
