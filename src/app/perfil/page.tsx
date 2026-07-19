"use client";

import { useState, useCallback } from "react";
import { usePerfil } from "@/hooks/usePerfil";
import { usePreferencias } from "@/hooks/usePreferencias";
import { useFuenteTasa } from "@/hooks/useDolarApiForDate";
import { useUsuario } from "@/hooks/useUsuario";
import { useUIStore } from "@/stores/ui";
import PerfilHeader from "@/components/perfil/PerfilHeader";
import CuentaTab from "@/components/perfil/CuentaTab";
import PreferenciasTab from "@/components/perfil/PreferenciasTab";
import SincronizacionTab from "@/components/perfil/SincronizacionTab";
import AcercaDeTab from "@/components/perfil/AcercaDeTab";

export default function PerfilPage() {
  const [activeTab, setActiveTab] = useState("Cuenta");
  const { perfil, updatePerfil, setAvatar } = usePerfil();
  const { preferencias, setMoneda, setFormatoFecha, setInicioSemana, setTema, setIdioma, setCoberturaModo } =
    usePreferencias();
  const { setFuente } = useFuenteTasa();
  const { updateUsuario } = useUsuario();
  const pushToast = useUIStore((s) => s.pushToast);

  const handleSavePerfil = useCallback((data: Parameters<typeof updatePerfil>[0]) => {
    updatePerfil(data);
    if (data.nombre !== undefined || data.email !== undefined) {
      updateUsuario({ nombre: data.nombre, email: data.email });
    }
    pushToast({ tone: "success", message: "Perfil actualizado" });
  }, [updatePerfil, updateUsuario, pushToast]);

  const handleContrasenaChange = useCallback((contrasena: string) => {
    updateUsuario({ contrasena });
    pushToast({ tone: "success", message: "Contraseña actualizada" });
  }, [updateUsuario, pushToast]);

  return (
    <div className="min-h-screen">
      <PerfilHeader activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === "Cuenta" && (
        <CuentaTab
          perfil={perfil}
          onSave={handleSavePerfil}
          onAvatarChange={setAvatar}
          onContrasenaChange={handleContrasenaChange}
          tieneContrasena={Boolean(perfil.usuarioId)}
        />
      )}
      {activeTab === "Preferencias" && (
        <PreferenciasTab
          preferencias={preferencias}
          onMonedaChange={setMoneda}
          onFormatoChange={setFormatoFecha}
          onSemanaChange={setInicioSemana}
          onTemaChange={setTema}
          onIdiomaChange={setIdioma}
          onFuenteTasaChange={setFuente}
          onCoberturaModoChange={setCoberturaModo}
        />
      )}
      {activeTab === "Sincronización" && <SincronizacionTab />}
      {activeTab === "Acerca de" && <AcercaDeTab />}
    </div>
  );
}
