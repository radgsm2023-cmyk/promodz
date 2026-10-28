import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Utilisateur, RoleDefinition, RoleColor, RoleChantier } from '../types';
import {
  Users,
  ShieldCheck,
  CheckCircle2,
  Building,
  Phone,
  Mail,
  UserCheck,
  UserPlus,
  Shield,
  ShieldAlert,
  Search,
  Filter,
  Edit2,
  Trash2,
  Copy,
  Plus,
  Sliders,
  Table,
  Check,
  X,
  AlertTriangle,
  Lock,
  Unlock,
  Calendar,
  Layers,
  Sparkles,
  ChevronDown,
  Info,
  KeyRound,
} from 'lucide-react';
import { ChangePasswordModal } from './ChangePasswordModal';

type SubTab = 'utilisateurs' | 'roles' | 'matrice' | 'autonomie_chantiers';

const COLOR_CLASSES: Record<RoleColor, { bg: string; text: string; border: string; ring: string }> = {
  amber: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', ring: 'ring-amber-500/20' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', ring: 'ring-blue-500/20' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', ring: 'ring-emerald-500/20' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200', ring: 'ring-indigo-500/20' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200', ring: 'ring-purple-500/20' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-200', ring: 'ring-cyan-500/20' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200', ring: 'ring-rose-500/20' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200', ring: 'ring-slate-500/20' },
};

export const UtilisateursView: React.FC = () => {
  const {
    utilisateurs,
    roles,
    allPermissions,
    currentUser,
    setCurrentUser,
    chantiers,
    addUtilisateur,
    updateUtilisateur,
    deleteUtilisateur,
    toggleUtilisateurStatut,
    addRole,
    updateRole,
    deleteRole,
    getRoleByCode,
    getRoleLabel,
    reinitialiserMotDePasse,
  } = useApp();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<SubTab>('utilisateurs');

  // Search & Filters for Users Tab
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'actif' | 'inactif'>('all');
  const [chantierFilter, setChantierFilter] = useState<string>('all');

  // Modals state
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Utilisateur | null>(null);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'user' | 'role';
    id: string;
    label: string;
    details?: string;
  } | null>(null);

  // User Form State
  const [userForm, setUserForm] = useState<{
    nom: string;
    email: string;
    telephone: string;
    role: string;
    avatar: string;
    chantiersAssignes: string[];
    rolesParChantier: { chantierId: string; role: string }[];
    isGlobalChantier: boolean;
    statut: 'actif' | 'inactif';
  }>({
    nom: '',
    email: '',
    telephone: '',
    role: 'conducteur_travaux',
    avatar: '',
    chantiersAssignes: ['*'],
    rolesParChantier: [],
    isGlobalChantier: true,
    statut: 'actif',
  });

  // Role Form State
  const [roleForm, setRoleForm] = useState<{
    label: string;
    code: string;
    description: string;
    couleur: RoleColor;
    permissions: string[];
  }>({
    label: '',
    code: '',
    description: '',
    couleur: 'blue',
    permissions: [],
  });

  // Matrix Interactive State
  const [matrixSearch, setMatrixSearch] = useState('');
  const [matrixModuleFilter, setMatrixModuleFilter] = useState('all');
  const [matrixNotice, setMatrixNotice] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    return utilisateurs.filter((u) => {
      // Hide Integrator (superadmin) from this view
      if (u.role === 'superadmin') {
        return false;
      }

      const matchSearch =
        u.nom.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.telephone.toLowerCase().includes(userSearch.toLowerCase());

      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchStatus = statusFilter === 'all' || u.statut === statusFilter;
      const matchChantier =
        chantierFilter === 'all' ||
        u.chantiersAssignes.includes('*') ||
        u.chantiersAssignes.includes(chantierFilter);

      return matchSearch && matchRole && matchStatus && matchChantier;
    });
  }, [utilisateurs, userSearch, roleFilter, statusFilter, chantierFilter, currentUser]);

  // Modules grouped permissions
  const permissionsByModule = useMemo(() => {
    const map: Record<string, typeof allPermissions> = {};
    allPermissions.forEach((p) => {
      if (!map[p.module]) {
        map[p.module] = [];
      }
      map[p.module].push(p);
    });
    return map;
  }, [allPermissions]);

  // Filtered roles (exclude superadmin)
  const filteredRoles = useMemo(() => roles.filter(r => r.code !== 'superadmin'), [roles]);

  // Filtered permissions for Matrix view
  const filteredPermissionsByModule = useMemo(() => {
    const map: Record<string, typeof allPermissions> = {};
    allPermissions.forEach((p) => {
      const matchModule = matrixModuleFilter === 'all' || p.module === matrixModuleFilter;
      const matchSearch =
        matrixSearch.trim() === '' ||
        p.label.toLowerCase().includes(matrixSearch.toLowerCase()) ||
        p.description.toLowerCase().includes(matrixSearch.toLowerCase()) ||
        p.module.toLowerCase().includes(matrixSearch.toLowerCase());

      if (matchModule && matchSearch) {
        if (!map[p.module]) {
          map[p.module] = [];
        }
        map[p.module].push(p);
      }
    });
    return map;
  }, [allPermissions, matrixModuleFilter, matrixSearch]);

  // Direct Matrix Manipulation Handlers
  const toggleRolePermissionDirect = (roleId: string, permKey: string, permLabel: string) => {
    const targetRole = roles.find((r) => r.id === roleId);
    if (!targetRole) return;
    const isGranted = targetRole.permissions.includes(permKey);
    const updatedPerms = isGranted
      ? targetRole.permissions.filter((k) => k !== permKey)
      : [...targetRole.permissions, permKey];

    updateRole(roleId, { permissions: updatedPerms });
    setMatrixNotice(
      isGranted
        ? `Prérogative "${permLabel}" révoquée pour "${targetRole.label}"`
        : `Prérogative "${permLabel}" accordée à "${targetRole.label}"`
    );
    setTimeout(() => setMatrixNotice(null), 3500);
  };

  const toggleAllPermissionsForRole = (roleId: string, grantAll: boolean) => {
    const targetRole = roles.find((r) => r.id === roleId);
    if (!targetRole) return;
    const updatedPerms = grantAll ? allPermissions.map((p) => p.key) : [];
    updateRole(roleId, { permissions: updatedPerms });
    setMatrixNotice(
      grantAll
        ? `Toutes les prérogatives (${allPermissions.length}) accordées à "${targetRole.label}"`
        : `Toutes les prérogatives révoquées pour "${targetRole.label}"`
    );
    setTimeout(() => setMatrixNotice(null), 3500);
  };

  const togglePermissionForAllRoles = (permKey: string, permLabel: string, grantAll: boolean) => {
    roles.forEach((r) => {
      const hasIt = r.permissions.includes(permKey);
      if (grantAll && !hasIt) {
        updateRole(r.id, { permissions: [...r.permissions, permKey] });
      } else if (!grantAll && hasIt) {
        updateRole(r.id, { permissions: r.permissions.filter((k) => k !== permKey) });
      }
    });
    setMatrixNotice(
      grantAll
        ? `"${permLabel}" accordé à TOUS les rôles (${roles.length})`
        : `"${permLabel}" révoqué pour TOUS les rôles`
    );
    setTimeout(() => setMatrixNotice(null), 3500);
  };

  const toggleModuleForRole = (roleId: string, moduleName: string, grantAll: boolean) => {
    const targetRole = roles.find((r) => r.id === roleId);
    if (!targetRole) return;
    const moduleKeys = permissionsByModule[moduleName]?.map((p) => p.key) || [];
    let updatedPerms = [...targetRole.permissions];
    if (grantAll) {
      moduleKeys.forEach((k) => {
        if (!updatedPerms.includes(k)) updatedPerms.push(k);
      });
    } else {
      updatedPerms = updatedPerms.filter((k) => !moduleKeys.includes(k));
    }
    updateRole(roleId, { permissions: updatedPerms });
    setMatrixNotice(
      grantAll
        ? `Module "${moduleName}" (${moduleKeys.length} actions) accordé à "${targetRole.label}"`
        : `Module "${moduleName}" révoqué pour "${targetRole.label}"`
    );
    setTimeout(() => setMatrixNotice(null), 3500);
  };

  // Handlers for User Modal
  const openNewUserModal = () => {
    setEditingUser(null);
    setUserForm({
      nom: '',
      email: '',
      telephone: '+213 (0) ',
      role: filteredRoles[0]?.code || 'conducteur_travaux',
      avatar: '',
      chantiersAssignes: ['*'],
      rolesParChantier: [],
      isGlobalChantier: true,
      statut: 'actif',
    });
    setUserModalOpen(true);
  };

  const openEditUserModal = (user: Utilisateur) => {
    setEditingUser(user);
    const isGlobal = user.chantiersAssignes.includes('*');
    setUserForm({
      nom: user.nom,
      email: user.email,
      telephone: user.telephone,
      role: user.role,
      avatar: user.avatar || '',
      chantiersAssignes: [...user.chantiersAssignes],
      rolesParChantier: [...(user.rolesParChantier || [])],
      isGlobalChantier: isGlobal,
      statut: user.statut || 'actif',
    });
    setUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.nom.trim() || !userForm.email.trim() || !userForm.role) {
      return;
    }

    const assigned = userForm.isGlobalChantier ? ['*'] : userForm.chantiersAssignes;
    if (assigned.length === 0) {
      alert('Veuillez assigner au moins un chantier ou cocher l\'accès global.');
      return;
    }

    if (editingUser) {
      updateUtilisateur(editingUser.id, {
        nom: userForm.nom.trim(),
        email: userForm.email.trim(),
        telephone: userForm.telephone.trim(),
        role: userForm.role,
        rolesParChantier: userForm.rolesParChantier,
        avatar: userForm.avatar.trim() || undefined,
        chantiersAssignes: assigned,
        statut: userForm.statut,
      });
    } else {
      addUtilisateur({
        nom: userForm.nom.trim(),
        email: userForm.email.trim(),
        telephone: userForm.telephone.trim(),
        role: userForm.role,
        rolesParChantier: userForm.rolesParChantier,
        avatar: userForm.avatar.trim() || undefined,
        chantiersAssignes: assigned,
        statut: userForm.statut,
      });
    }

    setUserModalOpen(false);
  };

  // Handlers for Role Modal
  const openNewRoleModal = () => {
    setEditingRole(null);
    setRoleForm({
      label: '',
      code: '',
      description: '',
      couleur: 'blue',
      permissions: ['chantiers_view'],
    });
    setRoleModalOpen(true);
  };

  const openEditRoleModal = (role: RoleDefinition) => {
    setEditingRole(role);
    setRoleForm({
      label: role.label,
      code: role.code,
      description: role.description,
      couleur: role.couleur || 'blue',
      permissions: [...role.permissions],
    });
    setRoleModalOpen(true);
  };

  const openDuplicateRoleModal = (role: RoleDefinition) => {
    setEditingRole(null);
    setRoleForm({
      label: `${role.label} (Copie)`,
      code: `${role.code}_copie_${Date.now().toString().slice(-3)}`,
      description: `Copie personnalisée des habilitations de : ${role.label}`,
      couleur: 'cyan',
      permissions: [...role.permissions],
    });
    setRoleModalOpen(true);
  };

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.label.trim() || !roleForm.code.trim()) {
      return;
    }

    const cleanCode = roleForm.code
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_]/g, '_');

    if (roleForm.permissions.length === 0) {
      alert('Veuillez activer au moins une prérogative pour ce rôle.');
      return;
    }

    if (editingRole) {
      updateRole(editingRole.id, {
        label: roleForm.label.trim(),
        code: editingRole.isSystem ? editingRole.code : cleanCode,
        description: roleForm.description.trim(),
        couleur: roleForm.couleur,
        permissions: roleForm.permissions,
      });
    } else {
      // Check if code already exists
      if (roles.some((r) => r.code === cleanCode)) {
        alert(`Le code technique "${cleanCode}" est déjà utilisé par un autre rôle.`);
        return;
      }

      addRole({
        label: roleForm.label.trim(),
        code: cleanCode,
        description: roleForm.description.trim(),
        couleur: roleForm.couleur,
        permissions: roleForm.permissions,
      });
    }

    setRoleModalOpen(false);
  };

  // Toggle single permission in role form
  const togglePermission = (key: string) => {
    setRoleForm((prev) => {
      const exists = prev.permissions.includes(key);
      return {
        ...prev,
        permissions: exists ? prev.permissions.filter((p) => p !== key) : [...prev.permissions, key],
      };
    });
  };

  // Toggle all permissions for a module in role form
  const toggleModulePermissions = (moduleName: string, selectAll: boolean) => {
    const moduleKeys = permissionsByModule[moduleName]?.map((p) => p.key) || [];
    setRoleForm((prev) => {
      let nextPerms = [...prev.permissions];
      if (selectAll) {
        moduleKeys.forEach((k) => {
          if (!nextPerms.includes(k)) nextPerms.push(k);
        });
      } else {
        nextPerms = nextPerms.filter((k) => !moduleKeys.includes(k));
      }
      return { ...prev, permissions: nextPerms };
    });
  };

  // Stats calculation
  const stats = useMemo(() => {
    const totalUsers = filteredUsers.length;
    const activeUsers = filteredUsers.filter((u) => u.statut === 'actif').length;
    const totalRoles = filteredRoles.length;
    const customRoles = filteredRoles.filter((r) => !r.isSystem).length;
    return { totalUsers, activeUsers, totalRoles, customRoles };
  }, [filteredUsers, filteredRoles]);


  return (
    <div className="space-y-6">
      {/* Top Banner & Context Switcher Info */}
      <div className="p-5 bg-slate-900 text-white rounded-xl border border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                Administration & Contrôle d'Accès (RBAC)
              </span>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs text-slate-300 font-medium">BatiPromote DZ Enterprise</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Paramétrage des Utilisateurs, Rôles & Habilitations Métier
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Configurez dynamiquement les comptes collaborateurs, créez des rôles personnalisés avec une granularité complète
              sur chaque module (chantiers, caisses, clients VSP, situations de travaux, visas CTC et gestion des stocks).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsChangePasswordModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-300 bg-slate-800 hover:bg-slate-700 border border-amber-400/30 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>Changer mon mot de passe</span>
            </button>
            <button
              onClick={openNewUserModal}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Nouvel Utilisateur</span>
            </button>
            <button
              onClick={openNewRoleModal}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Nouveau Rôle RBAC</span>
            </button>
          </div>
        </div>

        {/* Quick summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 mt-4 border-t border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Collaborateurs Enregistrés</span>
            <span className="text-base font-bold text-white font-mono">
              {stats.activeUsers} <span className="text-xs text-slate-400 font-normal">/ {stats.totalUsers} actifs</span>
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Rôles & Profils Métier</span>
            <span className="text-base font-bold text-amber-400 font-mono">
              {stats.totalRoles}{' '}
              <span className="text-xs text-slate-400 font-normal">
                ({stats.customRoles} personnalisés)
              </span>
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Chantiers Couverts</span>
            <span className="text-base font-bold text-emerald-400 font-mono">{chantiers.length} opérations</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Session Active En Cours</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <strong className="text-white truncate font-medium">{currentUser.nom}</strong>
              <span className="text-[10px] text-amber-300 font-mono">({getRoleLabel(currentUser.role)})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('utilisateurs')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'utilisateurs'
                ? 'border-amber-500 text-slate-900 bg-amber-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Users className="w-4 h-4 text-amber-600" />
            <span>Comptes Utilisateurs ({utilisateurs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('roles')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'roles'
                ? 'border-amber-500 text-slate-900 bg-amber-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>Rôles & Paramétrage RBAC ({roles.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('matrice')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'matrice'
                ? 'border-amber-500 text-slate-900 bg-amber-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Table className="w-4 h-4 text-amber-600" />
            <span>Matrice Globale des Prérogatives</span>
          </button>

          <button
            onClick={() => setActiveTab('autonomie_chantiers')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'autonomie_chantiers'
                ? 'border-amber-500 text-slate-900 bg-amber-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Building className="w-4 h-4 text-amber-600" />
            <span>Gestion Autonome Chantiers ({chantiers.length})</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 hidden sm:block pr-2">
          Sélectionnez un profil pour tester l'ERP sous ses permissions réelles
        </div>
      </div>

      {/* TAB 1: UTILISATEURS */}
      {activeTab === 'utilisateurs' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-2 max-w-md">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, email, téléphone..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>
              {userSearch && (
                <button
                  onClick={() => setUserSearch('')}
                  className="p-1 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Role filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-3 h-3 text-slate-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden"
                >
                  <option value="all">Tous les Rôles ({roles.length})</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.code}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden"
              >
                <option value="all">Tous les Statuts</option>
                <option value="actif">Actif uniquement</option>
                <option value="inactif">Inactif uniquement</option>
              </select>

              {/* Chantier filter */}
              <select
                value={chantierFilter}
                onChange={(e) => setChantierFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden max-w-[180px] truncate"
              >
                <option value="all">Tous Chantiers</option>
                {chantiers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* User Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((u) => {
              const isCurrent = u.id === currentUser.id;
              const roleDef = getRoleByCode(u.role);
              const colorConfig = COLOR_CLASSES[roleDef?.couleur || 'slate'];
              const isGlobal = u.chantiersAssignes.includes('*');

              const assignedChantiersLabels = isGlobal
                ? 'Tous les chantiers (*)'
                : u.chantiersAssignes
                    .map((cid) => chantiers.find((c) => c.id === cid)?.nom)
                    .filter(Boolean)
                    .join(', ') || 'Aucun chantier';

              const rolePermsCount = roleDef?.permissions?.length || 0;

              return (
                <div
                  key={u.id}
                  className={`bg-white rounded-xl border p-5 shadow-2xs flex flex-col justify-between transition-all relative ${
                    isCurrent
                      ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-sm'
                      : u.statut === 'inactif'
                      ? 'border-slate-200 bg-slate-50/60 opacity-75'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    {/* Header info */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-base overflow-hidden border border-slate-200 shrink-0">
                          {u.avatar ? (
                            <img
                              src={u.avatar}
                              alt={u.nom}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            u.nom.charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-bold text-slate-900 leading-tight">{u.nom}</h4>
                            {isCurrent && (
                              <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded uppercase">
                                En cours
                              </span>
                            )}
                          </div>
                          <span
                            className={`inline-block mt-0.5 text-[11px] font-semibold px-2 py-0.5 rounded border ${colorConfig.bg} ${colorConfig.text} ${colorConfig.border}`}
                          >
                            {roleDef?.label || u.role}
                          </span>
                        </div>
                      </div>

                      {/* Statut indicator */}
                      <button
                        onClick={() => toggleUtilisateurStatut(u.id)}
                        title="Cliquer pour basculer actif/inactif"
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors cursor-pointer flex items-center gap-1 ${
                          u.statut === 'actif'
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                            : 'text-slate-500 bg-slate-100 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            u.statut === 'actif' ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {u.statut === 'actif' ? 'Actif' : 'Inactif'}
                      </button>
                    </div>

                    {/* Coordinates & Chantiers */}
                    <div className="space-y-1.5 text-xs text-slate-600 my-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate text-slate-700">{u.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono text-slate-700">{u.telephone}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span
                          className={`text-slate-700 line-clamp-1 ${
                            isGlobal ? 'font-semibold text-amber-900' : ''
                          }`}
                        >
                          {assignedChantiersLabels}
                        </span>
                      </div>

                      {u.rolesParChantier && u.rolesParChantier.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {u.rolesParChantier.map((rc, i) => {
                            const cNom = chantiers.find(c => c.id === rc.chantierId)?.nom || rc.chantierId;
                            return (
                              <span key={i} className="text-[9px] bg-slate-900 text-amber-400 px-1.5 py-0.5 rounded border border-slate-700 font-bold uppercase" title={`${cNom}: ${getRoleLabel(rc.role)}`}>
                                {cNom.slice(0, 3)}: {rc.role.slice(0, 3)}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Role summary & privileges badge */}
                    <div className="text-xs text-slate-600 mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          Habilitations :
                        </span>
                        <span className="text-[11px] font-mono text-slate-700 font-bold">
                          {rolePermsCount} / {allPermissions.length} actives
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 italic">
                        {roleDef?.description || 'Aucune description définie pour ce rôle.'}
                      </p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {isCurrent ? (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 py-1.5 px-3 rounded-lg border border-emerald-200 text-center flex-1">
                        Session Active
                      </span>
                    ) : (
                      <button
                        onClick={() => setCurrentUser(u)}
                        disabled={u.statut === 'inactif'}
                        className={`flex-1 py-1.5 px-2.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center ${
                          u.statut === 'inactif'
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-amber-400 hover:bg-amber-300 text-slate-900 shadow-2xs'
                        }`}
                      >
                        Basculer la session
                      </button>
                    )}

                    <button
                      onClick={() => openEditUserModal(u)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Modifier le compte"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm(`Voulez-vous réinitialiser le mot de passe de ${u.nom} au mot de passe par défaut ("bati2026") ?`)) {
                          const res = reinitialiserMotDePasse(u.id);
                          if (res.success) {
                            alert(res.message);
                          } else {
                            alert(res.message);
                          }
                        }
                      }}
                      className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                      title="Réinitialiser le mot de passe au mot de passe par défaut (bati2026)"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() =>
                        setDeleteConfirm({
                          type: 'user',
                          id: u.id,
                          label: u.nom,
                          details: `Êtes-vous certain de vouloir supprimer le compte collaborateur de ${u.nom} (${u.email}) ?`,
                        })
                      }
                      disabled={isCurrent}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isCurrent
                          ? 'text-slate-300 cursor-not-allowed'
                          : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                      }`}
                      title={isCurrent ? 'Impossible de supprimer la session active' : 'Supprimer'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredUsers.length === 0 && (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-2">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Aucun utilisateur ne correspond à vos filtres</p>
              <p className="text-xs text-slate-400">Modifiez votre recherche ou réinitialisez les critères.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ROLES & RBAC */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Catalogue des Rôles & Profils d'Habilitations</h3>
              <p className="text-xs text-slate-500">
                Chaque rôle définit les droits d'accès aux formulaires financiers, décaissements, visas de chantiers et déclarations.
              </p>
            </div>
            <button
              onClick={openNewRoleModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Créer un Rôle</span>
            </button>
          </div>

          {/* Roles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRoles.map((role) => {
              const colorConfig = COLOR_CLASSES[role.couleur || 'blue'];
              const assignedCount = filteredUsers.filter((u) => u.role === role.code).length;

              return (
                <div
                  key={role.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all"
                >
                  <div>
                    {/* Header with badges */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-slate-900">{role.label}</h4>
                          {role.isSystem ? (
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                              Système
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                              Personnalisé
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span
                            className={`text-[11px] font-mono px-2 py-0.5 rounded border ${colorConfig.bg} ${colorConfig.text} ${colorConfig.border}`}
                          >
                            code: {role.code}
                          </span>
                          <span className="text-slate-500">
                            • {assignedCount} collaborateur{assignedCount > 1 ? 's' : ''} assigné{assignedCount > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold font-mono text-slate-900">
                          {role.permissions.length}
                        </span>
                        <span className="text-[11px] text-slate-400 block">/ {allPermissions.length} droits</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 mb-4">{role.description}</p>

                    {/* Preview of enabled permissions grouped by module */}
                    <div className="space-y-2 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Couverture fonctionnelle :
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(permissionsByModule).map(([moduleName, perms]) => {
                          const activeInModule = perms.filter((p) => role.permissions.includes(p.key)).length;
                          if (activeInModule === 0) return null;
                          return (
                            <span
                              key={moduleName}
                              className="text-[10px] font-medium bg-white text-slate-700 border border-slate-200 px-2 py-0.5 rounded shadow-2xs flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              <span>{moduleName}</span>
                              <strong className="text-slate-900 font-mono">
                                ({activeInModule}/{perms.length})
                              </strong>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Actions for Role */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => openEditRoleModal(role)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Modifier Habilitations</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openDuplicateRoleModal(role)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Dupliquer ce rôle pour créer une variante"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Dupliquer</span>
                      </button>

                      {!role.isSystem && (
                        <button
                          onClick={() => {
                            if (assignedCount > 0) {
                              alert(
                                `Impossible de supprimer ce rôle car ${assignedCount} collaborateur(s) y sont actuellement affectés. Veuillez réassigner ces utilisateurs au préalable.`
                              );
                              return;
                            }
                            setDeleteConfirm({
                              type: 'role',
                              id: role.id,
                              label: role.label,
                              details: `Êtes-vous certain de vouloir supprimer le rôle "${role.label}" ? Cette action est irréversible.`,
                            });
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Supprimer ce rôle"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: MATRICE DES PRÉROGATIVES (TOTALEMENT INTERACTIVE & MODIFIABLE EN DIRECT) */}
      {activeTab === 'matrice' && (
        <div className="space-y-4">
          {/* Live Action Toast / Notification */}
          {matrixNotice && (
            <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-md flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{matrixNotice}</span>
              </div>
              <button
                onClick={() => setMatrixNotice(null)}
                className="text-emerald-100 hover:text-white p-0.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Matrix Top Info & Quick Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Matrice Interactive des Prérogatives & Droits Métier (RBAC)
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase">
                    Modifiable en direct
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cliquez directement sur n'importe quelle case pour accorder ou révoquer une habilitation en temps réel. Les modifications sont enregistrées automatiquement.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-semibold">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Clic = Révoquer
                </span>
                <span className="flex items-center gap-1.5 text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg font-medium">
                  <Plus className="w-3.5 h-3.5 text-slate-400" /> Clic = Accorder
                </span>
              </div>
            </div>

            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <div className="flex flex-1 items-center gap-2 max-w-lg">
                <div className="relative w-full">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filtrer par action ou mot-clé (ex: caisse, visa, vsp, stock, tiers)..."
                    value={matrixSearch}
                    onChange={(e) => setMatrixSearch(e.target.value)}
                    className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  />
                  {matrixSearch && (
                    <button
                      onClick={() => setMatrixSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <select
                  value={matrixModuleFilter}
                  onChange={(e) => setMatrixModuleFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden shrink-0"
                >
                  <option value="all">Tous les Modules ERP</option>
                  {Object.keys(permissionsByModule).map((mod) => (
                    <option key={mod} value={mod}>
                      {mod}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center gap-1 shrink-0">
                <Info className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  {Object.values(filteredPermissionsByModule).flat().length} / {allPermissions.length} prérogatives affichées
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Matrix Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white border-b border-slate-800">
                    <th className="py-3.5 px-4 font-semibold text-slate-200 min-w-[300px]">
                      <div className="flex items-center justify-between">
                        <span>Module ERP & Habilitation</span>
                        <span className="text-[10px] text-slate-400 font-normal">Actions globales</span>
                      </div>
                    </th>
                    {filteredRoles.map((r) => {
                      const colorConfig = COLOR_CLASSES[r.couleur || 'blue'];
                      const activeCount = r.permissions.length;

                      return (
                        <th
                          key={r.id}
                          className="py-3 px-3 font-semibold text-center whitespace-nowrap min-w-[155px] border-l border-slate-800"
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded border ${colorConfig.bg} ${colorConfig.text} ${colorConfig.border}`}
                            >
                              {r.label}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-mono text-amber-400 font-bold">
                                {activeCount} / {allPermissions.length}
                              </span>
                            </div>

                            {/* Header quick toggle buttons */}
                            <div className="flex items-center gap-1 mt-1">
                              <button
                                type="button"
                                onClick={() => toggleAllPermissionsForRole(r.id, true)}
                                title={`Tout accorder à ${r.label}`}
                                className="px-1.5 py-0.5 text-[9px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                              >
                                + Tout
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleAllPermissionsForRole(r.id, false)}
                                title={`Tout révoquer pour ${r.label}`}
                                className="px-1.5 py-0.5 text-[9px] font-bold text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                              >
                                - Aucun
                              </button>
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {Object.entries(filteredPermissionsByModule).map(([moduleName, perms]) => (
                    <React.Fragment key={moduleName}>
                      {/* Module Header Divider Row with Per-Role Batch Actions */}
                      <tr className="bg-slate-100/90 font-bold text-slate-800 border-t-2 border-slate-200">
                        <td className="py-2.5 px-4 uppercase tracking-wider text-[11px] text-slate-700 bg-slate-100">
                          <div className="flex items-center justify-between">
                            <span>
                              {moduleName} ({perms.length} actions)
                            </span>
                          </div>
                        </td>

                        {filteredRoles.map((r) => {
                          const moduleKeys = perms.map((p) => p.key);
                          const countInModule = moduleKeys.filter((k) => r.permissions.includes(k)).length;
                          const allInModuleChecked = countInModule === moduleKeys.length;

                          return (
                            <td
                              key={r.id}
                              className="py-1.5 px-2 text-center border-l border-slate-200 bg-slate-100"
                            >
                              <button
                                type="button"
                                onClick={() => toggleModuleForRole(r.id, moduleName, !allInModuleChecked)}
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-colors cursor-pointer ${
                                  allInModuleChecked
                                    ? 'text-emerald-700 bg-emerald-100/60 hover:bg-rose-100 hover:text-rose-700'
                                    : 'text-slate-600 bg-white hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200'
                                }`}
                                title={
                                  allInModuleChecked
                                    ? `Désactiver tout le module pour ${r.label}`
                                    : `Activer tout le module pour ${r.label}`
                                }
                              >
                                {allInModuleChecked ? 'Tout actif' : `${countInModule}/${perms.length}`}
                              </button>
                            </td>
                          );
                        })}
                      </tr>

                      {/* Permission Rows with Direct Clickable Cells */}
                      {perms.map((p) => (
                        <tr key={p.key} className="hover:bg-amber-50/20 transition-colors group">
                          {/* Permission info & Row-level quick toggles */}
                          <td className="py-2.5 px-4">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                  <span>{p.label}</span>
                                </div>
                                <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                                  {p.description}
                                </div>
                              </div>

                              {/* Row-level quick actions: grant or revoke for ALL roles */}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <button
                                  type="button"
                                  onClick={() => togglePermissionForAllRoles(p.key, p.label, true)}
                                  title="Accorder cette prérogative à TOUS les rôles"
                                  className="text-[9px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200 cursor-pointer"
                                >
                                  + Tous
                                </button>
                                <button
                                  type="button"
                                  onClick={() => togglePermissionForAllRoles(p.key, p.label, false)}
                                  title="Révoquer cette prérogative pour TOUS les rôles"
                                  className="text-[9px] font-bold text-slate-500 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 px-1.5 py-0.5 rounded border border-slate-200 cursor-pointer"
                                >
                                  - Aucun
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* Role Cells: 100% Clickable Interactive Buttons */}
                          {filteredRoles.map((r) => {
                            const isGranted = r.permissions.includes(p.key);

                            return (
                              <td
                                key={r.id}
                                className="py-2 px-2 text-center border-l border-slate-100"
                              >
                                <button
                                  type="button"
                                  onClick={() => toggleRolePermissionDirect(r.id, p.key, p.label)}
                                  title={
                                    isGranted
                                      ? `Droit ACTIF. Cliquez pour révoquer "${p.label}" pour ${r.label}`
                                      : `Droit INACTIF. Cliquez pour accorder "${p.label}" à ${r.label}`
                                  }
                                  className={`w-full py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border flex items-center justify-center gap-1.5 group/btn ${
                                    isGranted
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 shadow-2xs'
                                      : 'bg-slate-50/70 text-slate-400 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300'
                                  }`}
                                >
                                  {isGranted ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-600 group-hover/btn:hidden" />
                                      <X className="w-3.5 h-3.5 text-rose-600 hidden group-hover/btn:block" />
                                      <span className="group-hover/btn:hidden text-[11px] font-bold">
                                        Accordé
                                      </span>
                                      <span className="hidden group-hover/btn:inline text-[11px] font-bold text-rose-600">
                                        Révoquer
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-emerald-600" />
                                      <span className="text-[11px] group-hover/btn:hidden text-slate-400">
                                        — Non
                                      </span>
                                      <span className="hidden group-hover/btn:inline text-[11px] font-bold text-emerald-700">
                                        Activer
                                      </span>
                                    </>
                                  )}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {Object.keys(filteredPermissionsByModule).length === 0 && (
              <div className="p-8 text-center space-y-2">
                <Search className="w-7 h-7 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">
                  Aucune prérogative ne correspond à votre filtre "{matrixSearch}"
                </p>
                <button
                  onClick={() => {
                    setMatrixSearch('');
                    setMatrixModuleFilter('all');
                  }}
                  className="text-xs text-amber-700 font-semibold hover:underline cursor-pointer"
                >
                  Réinitialiser les filtres de recherche
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: AUTONOMIE DES CHANTIERS & ÉQUIPES LOCALES */}
      {activeTab === 'autonomie_chantiers' && (
        <div className="space-y-6">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-sm">
                <Building className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Gestion Centralisée (Siège) & Gestion Autonome par Chantier
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  BatiPromote DZ permet une double architecture de gouvernance : une administration centralisée par la Direction et le SuperAdmin,
                  couplée à une <strong>autonomie opérationnelle complète de chaque chantier</strong>. Les conducteurs de travaux et responsables de chantier
                  disposent d'habilitations spécifiques pour gérer leur équipe locale, enregistrer les pointages journaliers, piloter leur caisse de chantier
                  et suivre les stocks locaux sans avoir accès aux comptes financiers globaux du siège.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {chantiers.map((chantier) => {
              const localUsers = filteredUsers.filter(
                (u) =>
                  u.chantiersAssignes.includes('*') ||
                  u.chantiersAssignes.includes(chantier.id) ||
                  (u.rolesParChantier && u.rolesParChantier.some((rc) => rc.chantierId === chantier.id))
              );

              return (
                <div key={chantier.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-semibold">
                          {chantier.code}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">{chantier.nom}</h4>
                        <p className="text-[11px] text-slate-500 truncate">{chantier.commune}, {chantier.wilaya}</p>
                      </div>
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold">
                        {chantier.statut || 'En cours'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Équipe Autonome :</span>
                        <span className="font-bold text-slate-900 font-mono">{localUsers.length} collaborateurs</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Budget Global :</span>
                        <span className="font-bold text-amber-800 font-mono">
                          {chantier.budgetTotalDZD?.toLocaleString()} DZD
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                        Rôles & Habilitations sur ce site :
                      </p>
                      <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                        {localUsers.map((u) => {
                          const siteRoleObj = u.rolesParChantier?.find((rc) => rc.chantierId === chantier.id);
                          const activeRoleCode = siteRoleObj ? siteRoleObj.role : u.role;
                          const roleLabel = getRoleLabel(activeRoleCode);

                          return (
                            <div key={u.id} className="flex items-center justify-between text-[11px] p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                              <div className="flex items-center gap-2 truncate">
                                <div className="w-6 h-6 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                                  {u.nom.charAt(0)}
                                </div>
                                <span className="font-bold text-slate-900 truncate">{u.nom}</span>
                              </div>
                              <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-semibold shrink-0">
                                {roleLabel}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Autonomie locale active</span>
                    <button
                      onClick={() => setActiveTab('utilisateurs')}
                      className="text-amber-700 font-semibold hover:underline cursor-pointer"
                    >
                      Gérer les comptes →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= MODAL 1: UTILISATEUR ================= */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-900 flex items-center justify-center font-bold">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">
                    {editingUser ? 'Modifier le Collaborateur' : 'Créer un Nouveau Compte Collaborateur'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Définition des accès, rôles et chantiers assignés
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUserModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveUser} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Nom & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nom & Prénom <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Mounir Brahimi"
                    value={userForm.nom}
                    onChange={(e) => setUserForm({ ...userForm, nom: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rôle Métier & Permissions <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.code}>
                        {r.label} {r.isSystem ? '(Système)' : '(Personnalisé)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Email & Téléphone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Adresse Email Professionnelle <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="m.brahimi@batipromote-dz.com"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Numéro de Téléphone (DZ)
                  </label>
                  <input
                    type="text"
                    placeholder="+213 (0) 550 00 00 00"
                    value={userForm.telephone}
                    onChange={(e) => setUserForm({ ...userForm, telephone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Avatar URL & Statut */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    URL Avatar / Photo (Optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={userForm.avatar}
                    onChange={(e) => setUserForm({ ...userForm, avatar: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Statut du Compte
                  </label>
                  <select
                    value={userForm.statut}
                    onChange={(e) => setUserForm({ ...userForm, statut: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    <option value="actif">Actif (Peut se connecter)</option>
                    <option value="inactif">Inactif (Accès désactivé)</option>
                  </select>
                </div>
              </div>

              {/* Rôles Spécifiques par Chantier */}
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Rôles Spécifiques par Chantier
                    </label>
                    <p className="text-[10px] text-slate-500">Affectez des responsabilités différentes selon les sites</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const firstAvailableChantier = chantiers.find(c => !userForm.rolesParChantier.some(rc => rc.chantierId === c.id));
                      if (firstAvailableChantier) {
                        setUserForm({
                          ...userForm,
                          rolesParChantier: [...userForm.rolesParChantier, { chantierId: firstAvailableChantier.id, role: userForm.role }]
                        });
                      }
                    }}
                    className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[10px] font-bold hover:bg-amber-100 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Ajouter une Habilitation Site</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {userForm.rolesParChantier.map((rc, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 animate-in slide-in-from-left-2 duration-150">
                      <select
                        value={rc.chantierId}
                        onChange={(e) => {
                          const newRoles = [...userForm.rolesParChantier];
                          newRoles[index].chantierId = e.target.value;
                          setUserForm({ ...userForm, rolesParChantier: newRoles });
                        }}
                        className="flex-1 px-2 py-1.5 text-[11px] font-medium border border-slate-300 rounded-md focus:ring-1 focus:ring-amber-500 outline-none bg-white"
                      >
                        {chantiers.map(c => (
                          <option key={c.id} value={c.id}>{c.nom}</option>
                        ))}
                      </select>

                      <select
                        value={rc.role}
                        onChange={(e) => {
                          const newRoles = [...userForm.rolesParChantier];
                          newRoles[index].role = e.target.value;
                          setUserForm({ ...userForm, rolesParChantier: newRoles });
                        }}
                        className="flex-1 px-2 py-1.5 text-[11px] font-medium border border-slate-300 rounded-md focus:ring-1 focus:ring-amber-500 outline-none bg-white"
                      >
                        {roles.map(r => (
                          <option key={r.id} value={r.code}>{r.label}</option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          const newRoles = userForm.rolesParChantier.filter((_, i) => i !== index);
                          setUserForm({ ...userForm, rolesParChantier: newRoles });
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {userForm.rolesParChantier.length === 0 && (
                    <div className="py-4 text-center border border-dashed border-slate-300 rounded-xl">
                      <Shield className="w-6 h-6 text-slate-200 mx-auto mb-1" />
                      <p className="text-[10px] text-slate-400">Aucune habilitation spécifique définie (utilise le rôle global)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Chantiers Assignés */}
              <div className="pt-3 border-t border-slate-200">
                <label className="block text-xs font-semibold text-slate-900 mb-2">
                  Périmètre des Chantiers Autorisés
                </label>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-amber-200 bg-amber-50/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userForm.isGlobalChantier}
                      onChange={(e) =>
                        setUserForm({
                          ...userForm,
                          isGlobalChantier: e.target.checked,
                          chantiersAssignes: e.target.checked ? ['*'] : [],
                        })
                      }
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900">Accès Global à tous les chantiers (*)</span>
                      <p className="text-[11px] text-slate-500">
                        Idéal pour la Direction, Comptabilité, Trésorerie Centrale et Responsables Achats.
                      </p>
                    </div>
                  </label>

                  {!userForm.isGlobalChantier && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 mt-2">
                      <span className="text-[11px] font-semibold text-slate-700 block">
                        Cochez les chantiers spécifiques assignés :
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                        {chantiers.map((c) => {
                          const isChecked = userForm.chantiersAssignes.includes(c.id);
                          return (
                            <label
                              key={c.id}
                              className={`flex items-center gap-2 p-2 rounded border text-xs cursor-pointer transition-colors ${
                                isChecked
                                  ? 'bg-amber-50 border-amber-300 text-slate-900 font-medium'
                                  : 'bg-white border-slate-200 text-slate-600'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const updated = e.target.checked
                                    ? [...userForm.chantiersAssignes, c.id]
                                    : userForm.chantiersAssignes.filter((id) => id !== c.id);
                                  setUserForm({ ...userForm, chantiersAssignes: updated });
                                }}
                                className="rounded text-amber-500"
                              />
                              <span className="truncate">{c.nom}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {editingUser ? 'Enregistrer les Modifications' : 'Créer le Compte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: ROLE RBAC ================= */}
      {roleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-900 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">
                    {editingRole ? `Configurer le Rôle : ${editingRole.label}` : 'Créer un Nouveau Rôle Personnalisé'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Personnalisez les habilitations opérationnelles et financières
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRoleModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveRole} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Role Name & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Intitulé du Rôle <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Responsable Sécurité Chantier & HSE"
                    value={roleForm.label}
                    onChange={(e) => {
                      const newLabel = e.target.value;
                      // Auto slugify code if not editing existing system role
                      if (!editingRole?.isSystem) {
                        const autoCode = newLabel
                          .toLowerCase()
                          .replace(/[^a-z0-9]/g, '_')
                          .slice(0, 30);
                        setRoleForm({ ...roleForm, label: newLabel, code: autoCode });
                      } else {
                        setRoleForm({ ...roleForm, label: newLabel });
                      }
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Code Technique Interne <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={editingRole?.isSystem}
                    placeholder="ex: responsable_hse"
                    value={roleForm.code}
                    onChange={(e) => setRoleForm({ ...roleForm, code: e.target.value })}
                    className={`w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono ${
                      editingRole?.isSystem
                        ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
                        : 'focus:outline-hidden focus:ring-2 focus:ring-slate-900'
                    }`}
                  />
                  {editingRole?.isSystem && (
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Le code des rôles système par défaut est protégé.
                    </span>
                  )}
                </div>
              </div>

              {/* Description & Color Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Description des Responsabilités
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Précisez le champ d'action de ce collaborateur sur les chantiers et au siège..."
                    value={roleForm.description}
                    onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Couleur du Badge
                  </label>
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {(Object.keys(COLOR_CLASSES) as RoleColor[]).map((c) => {
                      const isSelected = roleForm.couleur === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setRoleForm({ ...roleForm, couleur: c })}
                          className={`h-7 rounded-md border flex items-center justify-center cursor-pointer transition-all ${
                            COLOR_CLASSES[c].bg
                          } ${COLOR_CLASSES[c].border} ${
                            isSelected ? 'ring-2 ring-slate-900 font-bold scale-105' : 'opacity-70 hover:opacity-100'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-slate-900" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Granular Permissions by Module */}
              <div className="pt-3 border-t border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Matrice des Droits & Prérogatives Accordées
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {roleForm.permissions.length} sur {allPermissions.length} actions cochées
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setRoleForm({
                          ...roleForm,
                          permissions: allPermissions.map((p) => p.key),
                        })
                      }
                      className="text-[11px] font-semibold text-amber-700 hover:underline cursor-pointer"
                    >
                      Tout cocher
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setRoleForm({ ...roleForm, permissions: [] })}
                      className="text-[11px] font-semibold text-slate-500 hover:underline cursor-pointer"
                    >
                      Tout décocher
                    </button>
                  </div>
                </div>

                {/* Modules Accordion / Groups */}
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {Object.entries(permissionsByModule).map(([moduleName, perms]) => {
                    const checkedInModule = perms.filter((p) => roleForm.permissions.includes(p.key)).length;
                    const allChecked = checkedInModule === perms.length;

                    return (
                      <div
                        key={moduleName}
                        className="bg-slate-50 rounded-xl border border-slate-200 p-3 space-y-2.5"
                      >
                        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{moduleName}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-white rounded border border-slate-200 text-slate-600">
                              {checkedInModule} / {perms.length}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleModulePermissions(moduleName, !allChecked)}
                            className="text-[11px] text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                          >
                            {allChecked ? 'Désélectionner le module' : 'Sélectionner tout le module'}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {perms.map((p) => {
                            const isChecked = roleForm.permissions.includes(p.key);
                            return (
                              <label
                                key={p.key}
                                className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                                  isChecked
                                    ? 'bg-white border-amber-300 text-slate-900 shadow-2xs'
                                    : 'bg-white/60 border-slate-200 text-slate-500 hover:bg-white'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => togglePermission(p.key)}
                                  className="mt-0.5 rounded text-amber-500 focus:ring-amber-400"
                                />
                                <div>
                                  <span className={`font-semibold block ${isChecked ? 'text-slate-900' : 'text-slate-700'}`}>
                                    {p.label}
                                  </span>
                                  <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                                    {p.description}
                                  </span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRoleModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {editingRole ? 'Enregistrer les Habilitations' : 'Créer le Rôle Métier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: CONFIRM DELETE ================= */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Confirmation de Suppression</h4>
                <p className="text-xs text-slate-500 font-mono">{deleteConfirm.label}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">{deleteConfirm.details}</p>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.type === 'user') {
                    deleteUtilisateur(deleteConfirm.id);
                  } else {
                    deleteRole(deleteConfirm.id);
                  }
                  setDeleteConfirm(null);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Confirmer la Suppression
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />
    </div>
  );
};
