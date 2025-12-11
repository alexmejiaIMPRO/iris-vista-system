'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  Loader2,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usersApi } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import type { User } from '@/types';

export default function UsersPage() {
  const { language } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee' as User['role'],
    department: '',
    cost_center: '',
    company_code: '',
  });

  const text = {
    en: {
      title: 'User Management',
      subtitle: 'Manage user accounts and roles',
      addUser: 'Add User',
      search: 'Search users...',
      name: 'Name',
      email: 'Email',
      role: 'Role',
      department: 'Department',
      status: 'Status',
      actions: 'Actions',
      active: 'Active',
      inactive: 'Inactive',
      edit: 'Edit',
      delete: 'Delete',
      noUsers: 'No users found',
      createUser: 'Create User',
      editUser: 'Edit User',
      password: 'Password',
      passwordPlaceholder: 'Leave blank to keep current',
      costCenter: 'Cost Center',
      companyCode: 'Company Code',
      save: 'Save',
      cancel: 'Cancel',
      roles: {
        admin: 'Admin',
        supply_chain_manager: 'Supply Chain Manager',
        general_manager: 'General Manager',
        employee: 'Employee',
      },
    },
    zh: {
      title: '用户管理',
      subtitle: '管理用户账户和角色',
      addUser: '添加用户',
      search: '搜索用户...',
      name: '姓名',
      email: '邮箱',
      role: '角色',
      department: '部门',
      status: '状态',
      actions: '操作',
      active: '活跃',
      inactive: '禁用',
      edit: '编辑',
      delete: '删除',
      noUsers: '没有找到用户',
      createUser: '创建用户',
      editUser: '编辑用户',
      password: '密码',
      passwordPlaceholder: '留空保持当前密码',
      costCenter: '成本中心',
      companyCode: '公司代码',
      save: '保存',
      cancel: '取消',
      roles: {
        admin: '管理员',
        supply_chain_manager: '供应链经理',
        general_manager: '总经理',
        employee: '员工',
      },
    },
    es: {
      title: 'Gestión de Usuarios',
      subtitle: 'Gestionar cuentas de usuario y roles',
      addUser: 'Agregar Usuario',
      search: 'Buscar usuarios...',
      name: 'Nombre',
      email: 'Correo',
      role: 'Rol',
      department: 'Departamento',
      status: 'Estado',
      actions: 'Acciones',
      active: 'Activo',
      inactive: 'Inactivo',
      edit: 'Editar',
      delete: 'Eliminar',
      noUsers: 'No se encontraron usuarios',
      createUser: 'Crear Usuario',
      editUser: 'Editar Usuario',
      password: 'Contraseña',
      passwordPlaceholder: 'Dejar en blanco para mantener actual',
      costCenter: 'Centro de Costos',
      companyCode: 'Código de Empresa',
      save: 'Guardar',
      cancel: 'Cancelar',
      roles: {
        admin: 'Admin',
        supply_chain_manager: 'Gerente de Cadena de Suministro',
        general_manager: 'Gerente General',
        employee: 'Empleado',
      },
    },
  };

  const t = text[language];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await usersApi.list({ per_page: 100 });
      setUsers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        department: user.department,
        cost_center: user.cost_center,
        company_code: user.company_code,
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'employee',
        department: '',
        cost_center: '',
        company_code: '',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (editingUser) {
        const updateData: Partial<User> = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          department: formData.department,
          cost_center: formData.cost_center,
          company_code: formData.company_code,
        };
        await usersApi.update(editingUser.id, updateData);
      } else {
        await usersApi.create({
          ...formData,
          password: formData.password,
        });
      }
      setShowModal(false);
      fetchUsers();
    } catch (error) {
      console.error('Failed to save user:', error);
      alert('Failed to save user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await usersApi.toggleStatus(user.id);
      fetchUsers();
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Delete user ${user.name}?`)) return;
    try {
      await usersApi.delete(user.id);
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#75534B] to-[#5D423C] px-5 py-3 text-white font-medium shadow-sm transition-all hover:shadow-lg active:scale-95"
          >
            <Plus className="h-5 w-5" />
            {t.addUser}
          </button>
        </div>
      </section>

      {/* Search */}
      <section className="px-8 py-6 bg-white border-b border-[#E4E1DD]">
        <div className="mx-auto max-w-7xl">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6E6B67]" />
            <input
              type="text"
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-[#E4E1DD] bg-white py-2.5 pl-12 pr-4 text-sm text-[#2C2C2C] transition-all placeholder:text-[#6E6B67] focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
            />
          </div>
        </div>
      </section>

      {/* Users Table */}
      <section className="px-8 py-8">
        <div className="mx-auto max-w-7xl">
          {filteredUsers.length === 0 ? (
            <div className="rounded-lg bg-white shadow-sm border border-[#E4E1DD] p-12 text-center">
              <Users className="h-12 w-12 text-[#E4E1DD] mx-auto mb-4" />
              <p className="text-[#6E6B67]">{t.noUsers}</p>
            </div>
          ) : (
            <div className="rounded-lg bg-white shadow-sm border border-[#E4E1DD] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E4E1DD] bg-[#F9F8F6]">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#2C2C2C] uppercase tracking-wide">
                      {t.name}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#2C2C2C] uppercase tracking-wide">
                      {t.email}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#2C2C2C] uppercase tracking-wide">
                      {t.role}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-[#2C2C2C] uppercase tracking-wide">
                      {t.department}
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
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-[#E4E1DD] last:border-0 hover:bg-[#F9F8F6] transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold text-[#2C2C2C]">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#6E6B67]">{user.email}</td>
                      <td className="px-6 py-4">
                        <Badge className="bg-[#75534B]/10 text-[#75534B] hover:bg-[#75534B]/10 border-0">
                          {t.roles[user.role as keyof typeof t.roles] || user.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#6E6B67]">
                        {user.department}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className="flex items-center gap-2"
                        >
                          {user.status === 'active' ? (
                            <>
                              <ToggleRight className="h-6 w-6 text-[#4BAF7E]" />
                              <span className="text-sm text-[#4BAF7E]">{t.active}</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="h-6 w-6 text-[#6E6B67]" />
                              <span className="text-sm text-[#6E6B67]">{t.inactive}</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenModal(user)}
                            className="p-2 text-[#75534B] hover:bg-[#75534B]/10 rounded-lg transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            className="p-2 text-[#D1625B] hover:bg-[#D1625B]/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
            <div className="bg-gradient-to-r from-[#75534B] to-[#5D423C] p-6 rounded-t-xl flex items-center justify-between">
              <h2 className="text-xl text-white font-semibold">
                {editingUser ? t.editUser : t.createUser}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-white hover:text-white/80"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#2C2C2C]">
                  {t.name} <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 text-sm text-[#2C2C2C] transition-all focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#2C2C2C]">
                  {t.email} <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 text-sm text-[#2C2C2C] transition-all focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#2C2C2C]">
                    {t.password} <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? t.passwordPlaceholder : ''}
                    className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 text-sm text-[#2C2C2C] transition-all focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#2C2C2C]">
                  {t.role} <span className="text-[#EF4444]">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value as User['role'] })
                  }
                  className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 text-sm text-[#2C2C2C] transition-all focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
                >
                  {Object.entries(t.roles).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#2C2C2C]">
                    {t.department}
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 text-sm text-[#2C2C2C] transition-all focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#2C2C2C]">
                    {t.costCenter}
                  </label>
                  <input
                    type="text"
                    value={formData.cost_center}
                    onChange={(e) =>
                      setFormData({ ...formData, cost_center: e.target.value })
                    }
                    className="w-full rounded-lg border border-[#E4E1DD] bg-white px-4 py-3 text-sm text-[#2C2C2C] transition-all focus:border-[#75534B] focus:outline-none focus:ring-2 focus:ring-[#75534B]/20"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-[#E4E1DD] p-6 flex items-center justify-between">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 text-[#6E6B67] font-medium transition-colors hover:text-[#2C2C2C]"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#75534B] to-[#5D423C] text-white font-medium shadow-sm transition-all hover:shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
