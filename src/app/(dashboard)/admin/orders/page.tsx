'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  ShoppingCart,
  Package,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { adminApi } from '@/lib/api';
import type { PurchaseRequest } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

type FilterType = 'all' | 'amazon_cart' | 'pending_manual' | 'purchased';

export default function ApprovedOrdersPage() {
  const { language } = useLanguage();
  const [orders, setOrders] = useState<PurchaseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [processingId, setProcessingId] = useState<number | null>(null);

  const text = {
    en: {
      title: 'Approved Orders',
      subtitle: 'Manage approved purchase requests',
      all: 'All',
      amazonCart: 'In Amazon Cart',
      pendingManual: 'Pending Manual',
      purchased: 'Purchased',
      markPurchased: 'Mark as Purchased',
      retryCart: 'Retry Cart',
      viewProduct: 'View Product',
      noOrders: 'No orders found',
      quantity: 'Qty',
      status: 'Status',
      approvedBy: 'Approved by',
      requester: 'Requester',
      inCart: 'In Cart',
      cartError: 'Cart Error',
      pending: 'Pending',
    },
    zh: {
      title: '已批准订单',
      subtitle: '管理已批准的采购请求',
      all: '全部',
      amazonCart: '在亚马逊购物车',
      pendingManual: '待手动处理',
      purchased: '已购买',
      markPurchased: '标记为已购买',
      retryCart: '重试购物车',
      viewProduct: '查看商品',
      noOrders: '未找到订单',
      quantity: '数量',
      status: '状态',
      approvedBy: '批准人',
      requester: '申请人',
      inCart: '在购物车中',
      cartError: '购物车错误',
      pending: '待处理',
    },
    es: {
      title: 'Órdenes Aprobadas',
      subtitle: 'Gestionar solicitudes de compra aprobadas',
      all: 'Todas',
      amazonCart: 'En Carrito Amazon',
      pendingManual: 'Pendiente Manual',
      purchased: 'Comprado',
      markPurchased: 'Marcar como Comprado',
      retryCart: 'Reintentar Carrito',
      viewProduct: 'Ver Producto',
      noOrders: 'No se encontraron órdenes',
      quantity: 'Cant',
      status: 'Estado',
      approvedBy: 'Aprobado por',
      requester: 'Solicitante',
      inCart: 'En Carrito',
      cartError: 'Error de Carrito',
      pending: 'Pendiente',
    },
  };

  const t = text[language];

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getApprovedOrders({ filter });
      setOrders(response.data || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const handleMarkPurchased = async (id: number) => {
    setProcessingId(id);
    try {
      await adminApi.markAsPurchased(id, 'Marked as purchased from admin panel');
      fetchOrders();
    } catch (error) {
      console.error('Failed to mark as purchased:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRetryCart = async (id: number) => {
    setProcessingId(id);
    try {
      await adminApi.retryAddToCart(id);
      fetchOrders();
    } catch (error) {
      console.error('Failed to retry cart:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (order: PurchaseRequest) => {
    if (order.status === 'purchased') {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          {t.purchased}
        </Badge>
      );
    }
    if (order.added_to_cart) {
      return (
        <Badge className="bg-blue-100 text-blue-800">
          <ShoppingCart className="h-3 w-3 mr-1" />
          {t.inCart}
        </Badge>
      );
    }
    if (order.cart_error) {
      return (
        <Badge className="bg-red-100 text-red-800">
          <AlertCircle className="h-3 w-3 mr-1" />
          {t.cartError}
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-100 text-yellow-800">
        <Package className="h-3 w-3 mr-1" />
        {t.pending}
      </Badge>
    );
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: t.all },
    { key: 'amazon_cart', label: t.amazonCart },
    { key: 'pending_manual', label: t.pendingManual },
    { key: 'purchased', label: t.purchased },
  ];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#75534B]">{t.title}</h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>
        <Button variant="outline" onClick={fetchOrders} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Filter className="h-5 w-5 text-gray-500 mt-1" />
        {filters.map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f.key)}
            className={filter === f.key ? 'bg-[#75534B] hover:bg-[#5D423C]' : ''}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Orders Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#75534B]" />
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t.noOrders}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {order.request_number}
                  </CardTitle>
                  {getStatusBadge(order)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Product Image */}
                {order.product_image_url && (
                  <div className="relative h-32 bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={order.product_image_url}
                      alt={order.product_title}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )}

                {/* Product Info */}
                <div>
                  <h3 className="font-medium text-[#75534B] line-clamp-2">
                    {order.product_title || 'Product'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                    <span>{t.quantity}: {order.quantity}</span>
                    {order.estimated_price && (
                      <span className="font-medium">
                        ${order.estimated_price.toLocaleString()} {order.currency}
                      </span>
                    )}
                  </div>
                </div>

                {/* Amazon Badge */}
                {order.is_amazon_url && (
                  <Badge variant="outline" className="bg-orange-50 border-orange-200 text-orange-700">
                    Amazon
                  </Badge>
                )}

                {/* Cart Error Message */}
                {order.cart_error && (
                  <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
                    {order.cart_error}
                  </p>
                )}

                {/* Requester Info */}
                <div className="text-xs text-gray-500">
                  <p>{t.requester}: {order.requester?.name}</p>
                  <p>{t.approvedBy}: {order.approved_by?.name}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(order.url, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    {t.viewProduct}
                  </Button>

                  {order.status !== 'purchased' && (
                    <>
                      {order.is_amazon_url && order.cart_error && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRetryCart(order.id)}
                          disabled={processingId === order.id}
                        >
                          {processingId === order.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleMarkPurchased(order.id)}
                        disabled={processingId === order.id}
                      >
                        {processingId === order.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3 w-3" />
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
