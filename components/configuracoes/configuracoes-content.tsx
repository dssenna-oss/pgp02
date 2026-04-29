
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, Mail, Bell, Shield, Download, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import CompanyLogoUploader from "./company-logo-uploader";
import UserManagement from "./user-management";
import toast from "react-hot-toast";

interface ConfiguracoesContentProps {
  session?: any;
}

interface SystemSettings {
  smtpServer: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  deadlineReminders: boolean;
  incidentAlerts: boolean;
  twoFactorAuth: boolean;
  sessionTimeout: boolean;
  sessionTimeoutMinutes: number;
  autoBackup: boolean;
  backupTime: string;
  autoDarkMode: boolean;
  language: string;
}

export default function ConfiguracoesContent({ session }: ConfiguracoesContentProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Configurações de Email
  const [smtpServer, setSmtpServer] = useState("");
  const [smtpPort, setSmtpPort] = useState("");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  
  // Notificações
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [deadlineReminders, setDeadlineReminders] = useState(true);
  const [incidentAlerts, setIncidentAlerts] = useState(true);
  
  // Segurança
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(true);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(30);
  
  // Sistema
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupTime, setBackupTime] = useState("02:00");
  const [autoDarkMode, setAutoDarkMode] = useState(false);
  const [language, setLanguage] = useState("pt-BR");

  // Carregar configurações ao montar o componente
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/system-settings");
      
      if (response.ok) {
        const data = await response.json();
        
        // Configurações de Email
        setSmtpServer(data.smtpServer || "");
        setSmtpPort(data.smtpPort || "");
        setSmtpUser(data.smtpUser || "");
        setSmtpPassword(data.smtpPassword || "");
        
        // Notificações
        setEmailNotifications(data.emailNotifications ?? true);
        setPushNotifications(data.pushNotifications ?? true);
        setDeadlineReminders(data.deadlineReminders ?? true);
        setIncidentAlerts(data.incidentAlerts ?? true);
        
        // Segurança
        setTwoFactorAuth(data.twoFactorAuth ?? false);
        setSessionTimeout(data.sessionTimeout ?? true);
        setSessionTimeoutMinutes(data.sessionTimeoutMinutes ?? 30);
        
        // Sistema
        setAutoBackup(data.autoBackup ?? true);
        setBackupTime(data.backupTime || "02:00");
        setAutoDarkMode(data.autoDarkMode ?? false);
        setLanguage(data.language || "pt-BR");
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      const settings = {
        // Configurações de Email
        smtpServer,
        smtpPort,
        smtpUser,
        smtpPassword,
        // Notificações
        emailNotifications,
        pushNotifications,
        deadlineReminders,
        incidentAlerts,
        // Segurança
        twoFactorAuth,
        sessionTimeout,
        sessionTimeoutMinutes,
        // Sistema
        autoBackup,
        backupTime,
        autoDarkMode,
        language,
      };
      
      const response = await fetch("/api/system-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });
      
      if (response.ok) {
        toast.success("Configurações salvas com sucesso!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao salvar configurações");
      }
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Configurações do Sistema
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Personalize e configure o sistema conforme suas necessidades
          </p>
        </div>
      </div>

      {/* Logo da Empresa */}
      <CompanyLogoUploader />

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Configurações de Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtpServer">Servidor SMTP</Label>
              <Input
                id="smtpServer"
                value={smtpServer}
                onChange={(e) => setSmtpServer(e.target.value)}
                placeholder="smtp.exemplo.com"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpPort">Porta SMTP</Label>
              <Input
                id="smtpPort"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
                placeholder="587"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpUser">Usuário SMTP</Label>
              <Input
                id="smtpUser"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                placeholder="usuario@exemplo.com"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpPassword">Senha SMTP</Label>
              <Input
                id="smtpPassword"
                type="password"
                value={smtpPassword}
                onChange={(e) => setSmtpPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button 
              onClick={() => alert('Teste de configuração será implementado em breve')}
              disabled={loading}
            >
              Testar Configuração
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações por Email</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receber notificações importantes por email
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
              disabled={loading}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações Push</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receber notificações no navegador
              </p>
            </div>
            <Switch
              checked={pushNotifications}
              onCheckedChange={setPushNotifications}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Lembretes de Prazos</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receber lembretes sobre prazos importantes
              </p>
            </div>
            <Switch 
              checked={deadlineReminders}
              onCheckedChange={setDeadlineReminders}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alertas de Incidentes</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Notificações imediatas sobre incidentes críticos
              </p>
            </div>
            <Switch 
              checked={incidentAlerts}
              onCheckedChange={setIncidentAlerts}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Segurança
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Autenticação de Dois Fatores</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Adicionar camada extra de segurança no login
              </p>
            </div>
            <Switch
              checked={twoFactorAuth}
              onCheckedChange={setTwoFactorAuth}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Timeout de Sessão</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Deslogar automaticamente após inatividade
              </p>
            </div>
            <Switch 
              checked={sessionTimeout}
              onCheckedChange={setSessionTimeout}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sessionTimeout">Tempo Limite (minutos)</Label>
            <Input
              id="sessionTimeout"
              type="number"
              value={sessionTimeoutMinutes}
              onChange={(e) => setSessionTimeoutMinutes(parseInt(e.target.value) || 30)}
              className="w-32"
              disabled={loading}
            />
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white">Alterar Senha</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <Input id="currentPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input id="newPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input id="confirmPassword" type="password" />
              </div>
            </div>
            <Button 
              variant="outline"
              onClick={() => alert('Alteração de senha será implementada em breve')}
            >
              Alterar Senha
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Backup Automático</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Realizar backup automático dos dados diariamente
              </p>
            </div>
            <Switch
              checked={autoBackup}
              onCheckedChange={setAutoBackup}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="backupTime">Horário do Backup</Label>
            <Input
              id="backupTime"
              type="time"
              value={backupTime}
              onChange={(e) => setBackupTime(e.target.value)}
              className="w-32"
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Modo Escuro Automático</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Alternar automaticamente baseado no horário
              </p>
            </div>
            <Switch 
              checked={autoDarkMode}
              onCheckedChange={setAutoDarkMode}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Idioma do Sistema</Label>
            <select 
              id="language"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={loading}
            >
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en-US">English (US)</option>
              <option value="es-ES">Español</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportação de Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Exporte todos os dados do sistema para backup ou migração
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline"
              onClick={() => alert('Exportação de inventário será implementada em breve')}
            >
              Exportar Inventário
            </Button>
            <Button 
              variant="outline"
              onClick={() => alert('Exportação de documentos será implementada em breve')}
            >
              Exportar Documentos
            </Button>
            <Button 
              variant="outline"
              onClick={() => alert('Exportação de configurações será implementada em breve')}
            >
              Exportar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Management */}
      <UserManagement />

      {/* Save Settings */}
      <div className="flex justify-end gap-4">
        <Button 
          variant="outline"
          onClick={loadSettings}
          disabled={loading || saving}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          Descartar Alterações
        </Button>
        <Button 
          className="px-8"
          onClick={handleSaveSettings}
          disabled={loading || saving}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
