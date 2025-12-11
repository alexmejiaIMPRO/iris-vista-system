'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ClipboardList, Plus, Loader2, Eye, X, Clock, CheckCircle, XCircle, ArrowRight, User } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { requestsApi } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import type { PurchaseRequest } from '@/types';

export default function RequestsPage() {
  const { language } = useLanguage();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const text = {
    en: {
      title: 'My Requests',
      subtitle: 'View and manage your purchase requests',
      newRequest: 'New Request',
      requestNumber: 'Request Number',
      type: 'Type',
      amount: 'Amount',
      date: 'Date',
      status: 'Status',
      actions: 'Actions',
      view: 'View',
      noRequests: 'No requests found',
      createFirst: 'Create your first request from the catalog',
      browseCatalog: 'Browse Catalog',
      requestDetails: 'Request Details',
      costCenter: 'Cost Center',
      purpose: 'Purpose',
      items: 'Items',
      item: 'Item',
      quantity: 'Quantity',
      unitPrice: 'Unit Price',
      total: 'Total',
      types: {
        material_issue: 'Material Issue',
        purchase_requisition: 'Purchase Requisition',
      },
      statuses: {
        pending: 'Pending',
        approved: 'Approved',
        rejected: 'Rejected',
        processing: 'Processing',
        completed: 'Completed',
        cancelled: 'Cancelled',
      },
      history: 'History',
      actions: {
        created: 'Request Created',
        approved: 'Approved',
        rejected: 'Rejected',
        returned: 'Returned for Revision',
        cancelled: 'Cancelled',
        modified: 'Modified',
      },
      by: 'by',
      noHistory: 'No history available',
      rejectionReason: 'Rejection Reason',
      notes: 'Notes',
    },
    zh: {
      title: '我的请求',
      subtitle: '查看和管理您的采购请求',
      newRequest: '新建请求',
      requestNumber: '请求编号',
      type: '类型',
      amount: '金额',
      date: '日期',
      status: '状态',
      actions: '操作',
      view: '查看',
      noRequests: '没有找到请求',
      createFirst: '从目录创建您的第一个请求',
      browseCatalog: '浏览目录',
      requestDetails: '请求详情',
      costCenter: '成本中心',
      purpose: '目的',
      items: '商品',
      item: '商品',
      quantity: '数量',
      unitPrice: '单价',
      total: '总计',
      types: {
        material_issue: '物料发放',
        purchase_requisition: '采购申请',
      },
      statuses: {
        pending: '待审批',
        approved: '已批准',
        rejected: '已拒绝',
        processing: '处理中',
        completed: '已完成',
        cancelled: '已取消',
      },
      history: '历史记录',
      actions: {
        created: '请求已创建',
        approved: '已批准',
        rejected: '已拒绝',
        returned: '退回修改',
        cancelled: '已取消',
        modified: '已修改',
      },
      by: '由',
      noHistory: '暂无历史记录',
      rejectionReason: '拒绝原因',
      notes: '备注',
    },
    es: {
      title: 'Mis Solicitudes',
      subtitle: 'Ver y gestionar sus solicitudes de compra',
      newRequest: 'Nueva Solicitud',
      requestNumber: 'Número de Solicitud',
      type: 'Tipo',
      amount: 'Monto',
      date: 'Fecha',
      status: 'Estado',
      actions: 'Acciones',
      view: 'Ver',
      noRequests: 'No se encontraron solicitudes',
      createFirst: 'Cree su primera solicitud desde el catálogo',
      browseCatalog: 'Navegar Catálogo',
      requestDetails: 'Detalles de la Solicitud',
      costCenter: 'Centro de Costos',
      purpose: 'Propósito',
      items: 'Artículos',
      item: 'Artículo',
      quantity: 'Cantidad',
      unitPrice: 'Precio Unitario',
      total: 'Total',
      types: {
        material_issue: 'Emisión de Material',
        purchase_requisition: 'Requisición de Compra',
      },
      statuses: {
        pending: 'Pendiente',
        approved: 'Aprobado',
        rejected: 'Rechazado',
        processing: 'Procesando',
        completed: 'Completado',
        cancelled: 'Cancelado',
      },
      history: 'Historial',
      actions: {
        created: 'Solicitud Creada',
        approved: 'Aprobado',
        rejected: 'Rechazado',
        returned: 'Devuelto para Revisión',
        cancelled: 'Cancelado',
        modified: 'Modificado',
      },
      by: 'por',
      noHistory: 'Sin historial disponible',
      rejectionReason: 'Motivo de Rechazo',
      notes: 'Notas',
    },
  };

  const t = text[language];

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await requestsApi.getMyRequests({ per_page: 50 });
      setRequests(response.data || []);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const viewRequestDetails = async (requestId: number) => {
    setIsLoadingDetail(true);
    try {
      const fullRequest = await requestsApi.get(requestId);
      setSelectedRequest(fullRequest);
    } catch (error) {
      console.error('Failed to fetch request details:', error);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { bg: string; text: string } } = {
      pending: { bg: '#E1A948', text: '#E1A948' },
      approved: { bg: '#4BAF7E', text: '#4BAF7E' },
      rejected: { bg: '#D1625B', text: '#D1625B' },
      processing: { bg: '#3A6EA5', text: '#3A6EA5' },
      completed: { bg: '#4BAF7E', text: '#4BAF7E' },
      cancelled: { bg: '#6B7280', text: '#6B7280' },
    };
    const s = statusMap[status] || statusMap.pending;
    return (
      <Badge
        style={{
          backgroundColor: `${s.bg}15`,
          color: s.text,
          borderColor: `${s.text}40`,
          borderWidth: '1px',
        }}
        className="font-medium"
      >
        {t.statuses[status as keyof typeof t.statuses] || status}
      </Badge>
    );
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <Clock className="h-4 w-4 text-[#3A6EA5]" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-[#4BAF7E]" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-[#D1625B]" />;
      case 'returned':
        return <ArrowRight className="h-4 w-4 text-[#E1A948]" />;
      case 'cancelled':
        return <X className="h-4 w-4 text-[#6B7280]" />;
      default:
        return <Clock className="h-4 w-4 text-[#6B7280]" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return '#3A6EA5';
      case 'approved':
        return '#4BAF7E';
      case 'rejected':
        return '#D1625B';
      case 'returned':
        return '#E1A948';
      case 'cancelled':
        return '#6B7280';
      default:
        return '#6B7280';
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
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-4xl text-[#2C2C2C]" style={{ fontWeight: 600 }}>
              {t.title}
            </h1>
            <p className="text-base text-[#6E6B67]">{t.subtitle}</p>
          </div>
          <Link
            href="/catalog"
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#75534B] to-[#5D423C] px-5 py-3 text-white font-medium shadow-sm transition-all hover:shadow-lg active:scale-95"
          >
            <Plus className="h-5 w-5" />
            {t.newRequest}
          </Link>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-8 py-8">
        <div className="mx-auto max-w-7xl">
          {requests.length === 0 ? (
            <div className="rounded-lg bg-white shadow-sm border border-[#E4E1DD] p-12 text-center">
              <ClipboardList className="h-12 w-12 text-[#E4E1DD] mx-auto mb-4" />
              <p className="text-[#6E6B67] mb-4">{t.noRequests}</p>
              <p className="text-sm text-[#6E6B67] mb-6">{t.createFirst}</p>
              <Link
                href="/catalog"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#75534B] to-[#5D423C] px-5 py-3 text-white font-medium shadow-sm transition-all hover:shadow-lg active:scale-95"
              >
                {t.browseCatalog}
              </Link>
            </div>
          ) : (
            <div className="rounded-lg bg-white shadow-sm border border-[#E4E1DD] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E4E1DD] bg-[#F9F8F6]">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#2C2C2C] uppercase tracking-wide">
                      {t.requestNumber}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#2C2C2C] uppercase tracking-wide">
                      {t.type}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#2C2C2C] uppercase tracking-wide">
                      {t.amount}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#2C2C2C] uppercase tracking-wide">
                      {t.date}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#2C2C2C] uppercase tracking-wide">
                      {t.status}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#2C2C2C] uppercase tracking-wide">
                      {t.actions}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr
                      key={request.id}
                      className="border-b border-[#E4E1DD] last:border-0 hover:bg-[#F9F8F6] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-[#2C2C2C]">
                          {request.request_number}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#6E6B67]">
                        {t.types[request.type as keyof typeof t.types] || request.type}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-[#2C2C2C]">
                        {request.currency}${request.total_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#6E6B67]">
                        {new Date(request.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(request.status)}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => viewRequestDetails(request.id)}
                          disabled={isLoadingDetail}
                          className="text-sm font-medium text-[#75534B] hover:text-[#5D423C] transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                          {isLoadingDetail ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                          {t.view}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-xl bg-white shadow-2xl max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-[#75534B] to-[#5D423C] p-6 rounded-t-xl flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-2xl text-white font-semibold mb-1">
                  {selectedRequest.request_number}
                </h2>
                <p className="text-white/80 text-sm">
                  {t.types[selectedRequest.type as keyof typeof t.types]}
                </p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-white hover:text-white/80"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#6E6B67]">{t.costCenter}</p>
                  <p className="font-medium text-[#2C2C2C]">{selectedRequest.cost_center}</p>
                </div>
                <div>
                  <p className="text-sm text-[#6E6B67]">{t.status}</p>
                  {getStatusBadge(selectedRequest.status)}
                </div>
              </div>

              {selectedRequest.purpose && (
                <div>
                  <p className="text-sm text-[#6E6B67]">{t.purpose}</p>
                  <p className="font-medium text-[#2C2C2C]">{selectedRequest.purpose}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-[#6E6B67] mb-2">{t.items}</p>
                <div className="rounded-lg border border-[#E4E1DD] overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#E4E1DD] bg-[#F9F8F6]">
                        <th className="px-4 py-2 text-left text-xs font-semibold text-[#2C2C2C]">
                          {t.item}
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-[#2C2C2C]">
                          {t.quantity}
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-[#2C2C2C]">
                          {t.unitPrice}
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-[#2C2C2C]">
                          {t.total}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRequest.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-[#E4E1DD] last:border-0">
                          <td className="px-4 py-2 text-sm text-[#2C2C2C]">{item.name}</td>
                          <td className="px-4 py-2 text-sm text-[#6E6B67]">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm text-[#6E6B67]">
                            ${item.unit_price.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-sm font-semibold text-[#2C2C2C]">
                            ${item.total_price.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E4E1DD] flex justify-between items-center">
                <span className="text-lg font-semibold text-[#2C2C2C]">{t.total}:</span>
                <span className="text-2xl font-bold text-[#75534B]">
                  {selectedRequest.currency}${selectedRequest.total_amount.toFixed(2)}
                </span>
              </div>

              {/* Rejection reason if rejected */}
              {selectedRequest.rejection_reason && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800">{t.rejectionReason}:</p>
                  <p className="text-sm text-red-700">{selectedRequest.rejection_reason}</p>
                </div>
              )}

              {/* Notes if present */}
              {selectedRequest.notes && (
                <div className="mt-4 p-3 bg-[#F9F8F6] border border-[#E4E1DD] rounded-lg">
                  <p className="text-sm font-medium text-[#2C2C2C]">{t.notes}:</p>
                  <p className="text-sm text-[#6E6B67]">{selectedRequest.notes}</p>
                </div>
              )}

              {/* History Timeline */}
              <div className="mt-6 pt-4 border-t border-[#E4E1DD]">
                <p className="text-sm font-semibold text-[#2C2C2C] mb-3">{t.history}</p>
                {selectedRequest.history && selectedRequest.history.length > 0 ? (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-[#E4E1DD]" />

                    <div className="space-y-4">
                      {selectedRequest.history.map((historyItem, idx) => (
                        <div key={historyItem.id || idx} className="relative pl-8">
                          {/* Timeline dot */}
                          <div
                            className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white border-2 flex items-center justify-center"
                            style={{ borderColor: getActionColor(historyItem.action) }}
                          >
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: getActionColor(historyItem.action) }}
                            />
                          </div>

                          <div className="bg-[#F9F8F6] rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              {getActionIcon(historyItem.action)}
                              <span className="font-medium text-sm text-[#2C2C2C]">
                                {t.actions[historyItem.action as keyof typeof t.actions] || historyItem.action}
                              </span>
                            </div>

                            {historyItem.comment && (
                              <p className="text-sm text-[#6E6B67] mb-1">{historyItem.comment}</p>
                            )}

                            <div className="flex items-center gap-2 text-xs text-[#9B9792]">
                              <User className="h-3 w-3" />
                              <span>
                                {historyItem.user?.name || `User #${historyItem.user_id}`}
                              </span>
                              <span>•</span>
                              <span>
                                {new Date(historyItem.created_at).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-[#9B9792]">{t.noHistory}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
