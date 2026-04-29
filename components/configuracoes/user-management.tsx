
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Loader2, CheckCircle, XCircle, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  company: {
    companyName: string;
  } | null;
}

export default function UserManagement() {
  const { data: session } = useSession() || {};
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [userToToggle, setUserToToggle] = useState<User | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Verificar se é admin
  const isAdmin = session?.user?.email === "clubedoservidor@protonmail.com";

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/users");

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao carregar usuários");
      }
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = (user: User) => {
    setUserToToggle(user);
    setShowConfirmDialog(true);
  };

  const confirmToggleUserStatus = async () => {
    if (!userToToggle) return;

    try {
      setProcessingUserId(userToToggle.id);
      setShowConfirmDialog(false);

      const response = await fetch(
        `/api/users/${userToToggle.id}/toggle-active`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isActive: !userToToggle.isActive,
          }),
        }
      );

      if (response.ok) {
        toast.success(
          `Usuário ${!userToToggle.isActive ? "ativado" : "desativado"} com sucesso!`
        );
        loadUsers();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao atualizar status do usuário");
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status do usuário");
    } finally {
      setProcessingUserId(null);
      setUserToToggle(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestão de Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400">
            Acesso restrito a administradores.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestão de Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gestão de Usuários
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={loadUsers}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Atualizar Lista
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>
                  {users.filter((u) => u.isActive).length} usuários ativos
                </span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span>
                  {users.filter((u) => !u.isActive).length} usuários inativos
                </span>
              </div>
            </div>

            {users.length === 0 ? (
              <p className="text-center py-8 text-gray-500 dark:text-gray-400">
                Nenhum usuário cadastrado
              </p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Cadastro</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.name || "Sem nome"}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {user.company?.companyName || "Sem empresa"}
                        </TableCell>
                        <TableCell>
                          {user.role === "admin" ? (
                            <Badge
                              variant="default"
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              <Shield className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Usuário</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.isActive ? (
                            <Badge
                              variant="default"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Ativo
                            </Badge>
                          ) : (
                            <Badge
                              variant="destructive"
                              className="bg-red-600 hover:bg-red-700"
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Inativo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant={user.isActive ? "destructive" : "default"}
                            size="sm"
                            onClick={() => handleToggleUserStatus(user)}
                            disabled={
                              processingUserId === user.id ||
                              (user.email === "clubedoservidor@protonmail.com" &&
                                user.isActive)
                            }
                            className={
                              !user.isActive
                                ? "bg-green-600 hover:bg-green-700"
                                : ""
                            }
                          >
                            {processingUserId === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : user.isActive ? (
                              "Desativar"
                            ) : (
                              "Ativar"
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de Confirmação */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {userToToggle?.isActive ? "Desativar" : "Ativar"} Usuário
            </AlertDialogTitle>
            <AlertDialogDescription>
              {userToToggle?.isActive ? (
                <>
                  Tem certeza que deseja <strong>desativar</strong> o usuário{" "}
                  <strong>{userToToggle?.name || userToToggle?.email}</strong>?
                  <br />
                  <br />O usuário não conseguirá mais acessar o sistema até ser
                  reativado.
                </>
              ) : (
                <>
                  Tem certeza que deseja <strong>ativar</strong> o usuário{" "}
                  <strong>{userToToggle?.name || userToToggle?.email}</strong>?
                  <br />
                  <br />O usuário poderá acessar o sistema normalmente.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmToggleUserStatus}
              className={
                userToToggle?.isActive
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }
            >
              {userToToggle?.isActive ? "Desativar" : "Ativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
