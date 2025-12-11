'use client';

import { useState, useEffect } from 'react';
import {
  CheckSquare,
  Clock,
  User,
  X,
  Check,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { approvalsApi } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import type { PurchaseRequest } from '@/types';

export default function ApprovalsPage() {
  const { language } = useLanguage();
  const [approvals, setApprovals] = useState<PurchaseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('pending');
  const [selectedApproval, setSelectedApproval] = useState<PurchaseRequest | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const text = {
    en: {
      title: 'Approvals',
      subtitle: 'Review and Approve Purchase Requests',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      prNumber: 'PR Number',
      requester: 'Requester',
      amount: 'Amount',
      date: 'Date',
      status: 'Status',
      actions: 'Actions',
      review: 'Review',
      approvalWorkflow: 'Approval Workflow',
      approve: 'Approve',
      reject: 'Reject',
      returnModify: 'Return for Modification',
      addComment: 'Add Comment',
      commentPlaceholder: 'Add your review comments...',
      itemDetails: 'Item Details',
      item: 'Item',
      specification: 'Specification',
      quantity: 'Quantity',
      unitPrice: 'Unit Price',
      total: 'Total',
      supplier: 'Supplier',
      urgent: 'Urgent',
      noApprovals: 'No pending approvals',
      statuses: {
        pending: 'Pending',
        approved: 'Approved',
        rejected: 'Rejected',
        processing: 'Processing',
        completed: 'Completed',
      },
    },
    zh: {
      title: '审批',
      subtitle: '审核和批准采购请求',
      pending: '待审批',
      approved: '已批准',
      rejected: '已拒绝',
      prNumber: 'PR编号',
      requester: '请求人',
      amount: '金额',
      date: '日期',
      status: '状态',
      actions: '操作',
      review: '审核',
      approvalWorkflow: '审批工作流',
      approve: '批准',
      reject: '拒绝',
      returnModify: '退回修改',
      addComment: '添加评论',
      commentPlaceholder: '添加您的审核意见...',
      itemDetails: '项目详情',
      item: '商品',
      specification: '规格',
      quantity: '数量',
      unitPrice: '单价',
      total: '总计',
      supplier: '供应商',
      urgent: '紧急',
      noApprovals: '没有待审批项目',
      statuses: {
        pending: '待审批',
        approved: '已批准',
        rejected: '已拒绝',
        processing: '处理中',
        completed: '已完成',
      },
    },
    es: {
      title: 'Aprobaciones',
      subtitle: 'Revisar y Aprobar Solicitudes de Compra',
      pending: 'Pendiente',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      prNumber: 'Número PR',
      requester: 'Solicitante',
      amount: 'Monto',
      date: 'Fecha',
      status: 'Estado',
      actions: 'Acciones',
      review: 'Revisar',
      approvalWorkflow: 'Flujo de Aprobación',
      approve: 'Aprobar',
      reject: 'Rechazar',
      returnModify: 'Devolver para Modificación',
      addComment: 'Agregar Comentario',
      commentPlaceholder: 'Agregar sus comentarios de revisión...',
      itemDetails: 'Detalles del Artículo',
      item: 'Artículo',
      specification: 'Especificación',
      quantity: 'Cantidad',
      unitPrice: 'Precio Unitario',
      total: 'Total',
      supplier: 'Proveedor',
      urgent: 'Urgente',
      noApprovals: 'No hay aprobaciones pendientes',
      statuses: {
        pending: 'Pendiente',
        approved: 'Aprobado',
        rejected: 'Rechazado',
        processing: 'Procesando',
        completed: 'Completado',
      },
    },
  };

  const t = text[language];

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      const response = await approvalsApi.listPending({ per_page: 50 });
      setApprovals(response.data || []);
    } catch (error) {
      console.error('Failed to fetch approvals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { bg: string; text: string } } = {
      pending: { bg: '#E1A948', text: '#E1A948' },
      approved: { bg: '#4BAF7E', text: '#4BAF7E' },
      rejected: { bg: '#D1625B', text: '#D1625B' },
      processing: { bg: '#3A6EA5', text: '#3A6EA5' },
      completed: { bg: '#4BAF7E', text: '#4BAF7E' },
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

  const handleApprove = async () => {
    if (!selectedApproval) return;
    setIsSubmitting(true);
    try {
      await approvalsApi.approve(selectedApproval.id, comment);
      setSelectedApproval(null);
      setComment('');
      fetchApprovals();
    } catch (error) {
      console.error('Failed to approve:', error);
      alert('Failed to approve request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApproval || !comment) {
      alert('Please provide a reason for rejection');
      return;
    }
    setIsSubmitting(true);
    try {
      await approvalsApi.reject(selectedApproval.id, comment);
      setSelectedApproval(null);
      setComment('');
      fetchApprovals();
    } catch (error) {
      console.error('Failed to reject:', error);
      alert('Failed to reject request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturn = async () => {
    if (!selectedApproval || !comment) {
      alert('Please provide a reason for returning');
      return;
    }
    setIsSubmitting(true);
    try {
      await approvalsApi.return(selectedApproval.id, comment);
      setSelectedApproval(null);
      setComment('');
      fetchApprovals();
    } catch (error) {
      console.error('Failed to return:', error);
      alert('Failed to return request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredApprovals = approvals.filter((approval) => {
    if (selectedTab === 'pending') return approval.status === 'pending';
    if (selectedTab === 'approved') return approval.status === 'approved';
    if (selectedTab === 'rejected') return approval.status === 'rejected';
    return true;
  });

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

      {/* Main Content */}
      <section className="px-8 py-8">
        <div className="mx-auto max-w-7xl">
          {/* Tabs */}
          <div className="mb-6 flex gap-2">
            {(['pending', 'approved', 'rejected'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                  selectedTab === tab
                    ? 'bg-gradient-to-r from-[#75534B] to-[#5D423C] text-white shadow-sm'
                    : 'bg-white text-[#6E6B67] border border-[#E4E1DD] hover:bg-[#F9F8F6]'
                }`}
              >
                {t.statuses[tab]}
              </button>
            ))}
          </div>

          {/* Approvals Table */}
          {filteredApprovals.length === 0 ? (
            <div className="rounded-lg bg-white shadow-sm border border-[#E4E1DD] p-12 text-center">
              <CheckSquare className="h-12 w-12 text-[#E4E1DD] mx-auto mb-4" />
              <p className="text-[#6E6B67]">{t.noApprovals}</p>
            </div>
          ) : (
            <div className="rounded-lg bg-white shadow-sm border border-[#E4E1DD] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E4E1DD] bg-[#F9F8F6]">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#2C2C2C] uppercase tracking-wide">
                      {t.prNumber}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#2C2C2C] uppercase tracking-wide">
                      {t.requester}
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
                  {filteredApprovals.map((approval) => (
                    <tr
                      key={approval.id}
                      className="border-b border-[#E4E1DD] last:border-0 hover:bg-[#F9F8F6] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#2C2C2C]">
                            {approval.request_number}
                          </span>
                          {approval.priority === 'urgent' && (
                            <Badge className="bg-[#DC2626] text-white hover:bg-[#DC2626] border-0 animate-pulse">
                              {t.urgent}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#6E6B67]">
                        {approval.requester?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-[#2C2C2C]">
                        {approval.currency}${approval.total_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#6E6B67]">
                        {new Date(approval.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(approval.status)}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedApproval(approval)}
                          className="text-sm font-medium text-[#75534B] hover:text-[#5D423C] transition-colors"
                        >
                          {t.review}
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

      {/* Approval Details Panel */}
      {selectedApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-5xl my-8 rounded-xl bg-white shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#75534B] to-[#5D423C] p-6 rounded-t-xl flex items-center justify-between">
              <div>
                <h2 className="text-2xl text-white font-semibold mb-1">
                  {selectedApproval.request_number}
                </h2>
                <p className="text-white/80 text-sm">
                  {t.requester}: {selectedApproval.requester?.name || 'Unknown'}
                </p>
              </div>
              <button
                onClick={() => setSelectedApproval(null)}
                className="text-white hover:text-white/80"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Workflow Visualization */}
              {selectedApproval.history && selectedApproval.history.length > 0 && (
                <div>
                  <h3 className="text-lg text-[#2C2C2C] mb-6 font-semibold">
                    {t.approvalWorkflow}
                  </h3>

                  <div className="relative">
                    {selectedApproval.history.map((step, idx) => (
                      <div key={idx} className="relative">
                        {idx < selectedApproval.history!.length - 1 && (
                          <div
                            className="absolute left-6 top-16 w-0.5 h-12 z-0 bg-[#E4E1DD]"
                          ></div>
                        )}

                        <div className="relative z-10 flex items-start gap-4 mb-6">
                          <div
                            className={`flex h-12 w-12 items-center justify-center rounded-full flex-shrink-0 shadow-md border-4 border-white ${
                              step.new_status === 'approved'
                                ? 'bg-[#4EA27E]'
                                : step.new_status === 'rejected'
                                ? 'bg-[#D1625B]'
                                : 'bg-[#E4E1DD]'
                            }`}
                          >
                            {step.new_status === 'approved' ? (
                              <CheckCircle className="h-6 w-6 text-white" />
                            ) : step.new_status === 'rejected' ? (
                              <AlertCircle className="h-6 w-6 text-white" />
                            ) : (
                              <Clock className="h-6 w-6 text-[#6E6B67]" />
                            )}
                          </div>

                          <div className="flex-1 rounded-lg bg-[#F9F8F6] p-4 border border-[#E4E1DD]">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="text-[#2C2C2C] font-semibold mb-1">
                                  {step.action}
                                </p>
                                <p className="text-sm text-[#6E6B67]">
                                  {step.user?.name || 'System'}
                                </p>
                              </div>
                              <p className="text-xs text-[#6E6B67]">
                                {new Date(step.created_at).toLocaleString()}
                              </p>
                            </div>
                            {step.comment && (
                              <div className="mt-3 rounded-md bg-white p-3 border border-[#E4E1DD]">
                                <p className="text-sm text-[#2C2C2C]">{step.comment}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Item Details */}
              <div>
                <h3 className="text-lg text-[#2C2C2C] mb-4 font-semibold">
                  {t.itemDetails}
                </h3>

                <div className="rounded-lg border border-[#E4E1DD] overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#E4E1DD] bg-[#F9F8F6]">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#2C2C2C] uppercase tracking-wide">
                          {t.item}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#2C2C2C] uppercase tracking-wide">
                          {t.specification}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#2C2C2C] uppercase tracking-wide">
                          {t.quantity}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#2C2C2C] uppercase tracking-wide">
                          {t.unitPrice}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#2C2C2C] uppercase tracking-wide">
                          {t.total}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#2C2C2C] uppercase tracking-wide">
                          {t.supplier}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {selectedApproval.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-[#E4E1DD] last:border-0">
                          <td className="px-4 py-3 text-sm font-semibold text-[#2C2C2C]">
                            {item.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-[#6E6B67]">
                            {item.specification}
                          </td>
                          <td className="px-4 py-3 text-sm text-[#2C2C2C]">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-[#2C2C2C]">
                            ${item.unit_price.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-[#2C2C2C]">
                            ${item.total_price.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-[#6E6B67]">{item.supplier}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Decision Section */}
              {selectedApproval.status === 'pending' && (
                <div className="rounded-lg bg-[#F9F8F6] p-6 border border-[#E4E1DD]">
                  <h3 className="text-lg text-[#2C2C2C] mb-4 font-semibold">{t.addComment}</h3>

                  <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t.commentPlaceholder}
                    className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 text-sm text-[#2C2C2C] transition-all placeholder:text-[#6E6B67] focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
                  ></textarea>

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={handleApprove}
                      disabled={isSubmitting}
                      className="flex items-center justify-center gap-2 rounded-lg bg-[#10B981] px-5 py-3 text-white font-medium shadow-sm transition-all hover:bg-[#059669] active:scale-95 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Check className="h-5 w-5" />
                      )}
                      {t.approve}
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={isSubmitting}
                      className="flex items-center justify-center gap-2 rounded-lg bg-[#EF4444] px-5 py-3 text-white font-medium shadow-sm transition-all hover:bg-[#DC2626] active:scale-95 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <X className="h-5 w-5" />
                      )}
                      {t.reject}
                    </button>
                    <button
                      onClick={handleReturn}
                      disabled={isSubmitting}
                      className="flex items-center justify-center gap-2 rounded-lg bg-[#F59E0B] px-5 py-3 text-white font-medium shadow-sm transition-all hover:bg-[#D97706] active:scale-95 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <RotateCcw className="h-5 w-5" />
                      )}
                      {t.returnModify}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
