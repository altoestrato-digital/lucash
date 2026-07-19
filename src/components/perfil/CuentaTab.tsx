"use client";

import { useState, useRef, useCallback } from "react";
import type { Perfil, AvatarDataUrl } from "@/types/perfil";
import AvatarUploader from "./AvatarUploader";

interface CuentaTabProps {
  perfil: Perfil;
  onSave: (data: Partial<Perfil>) => void;
  onAvatarChange: (dataUrl: AvatarDataUrl | undefined) => void;
  onContrasenaChange: (contrasena: string) => void;
  tieneContrasena: boolean;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_AVATAR_BYTES = 1_000_000;

export default function CuentaTab({ perfil, onSave, onAvatarChange, onContrasenaChange, tieneContrasena }: CuentaTabProps) {
  const [nombre, setNombre] = useState(perfil.nombre);
  const [email, setEmail] = useState(perfil.email ?? "");
  const [contrasena, setContrasena] = useState("");
  const [contrasena2, setContrasena2] = useState("");
  const [errors, setErrors] = useState<{ nombre?: string; email?: string; contrasena?: string; contrasena2?: string }>({});
  const [avatarFile, setAvatarFile] = useState<{ dataUrl: AvatarDataUrl; file: File } | undefined>(
    perfil.avatar ? { dataUrl: perfil.avatar, file: new File([], "") } : undefined
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  function validate() {
    const errs: { nombre?: string; email?: string; contrasena?: string; contrasena2?: string } = {};
    if (!nombre.trim()) errs.nombre = "El nombre es obligatorio";
    if (nombre.length > 60) errs.nombre = "Máximo 60 caracteres";
    if (email && !EMAIL_REGEX.test(email)) errs.email = "Correo inválido";
    if (contrasena && contrasena.length < 4) errs.contrasena = "Mínimo 4 caracteres";
    if (contrasena && contrasena !== contrasena2) errs.contrasena2 = "Las contraseñas no coinciden";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    onSave({ nombre: nombre.trim(), email: email.trim() || undefined });
    if (contrasena) {
      onContrasenaChange(contrasena);
      setContrasena("");
      setContrasena2("");
    }
  }

  const handleFilePick = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const allowed = ["image/jpeg", "image/png", "image/webp"];
      if (!allowed.includes(file.type)) {
        setErrors((prev) => ({ ...prev, email: "Solo JPG, PNG o WebP" }));
        return;
      }
      if (file.size > MAX_AVATAR_BYTES) {
        setErrors((prev) => ({ ...prev, email: "Máximo 1MB" }));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as AvatarDataUrl;
        setAvatarFile({ dataUrl, file });
        onAvatarChange(dataUrl);
      };
      reader.readAsDataURL(file);
    },
    [onAvatarChange]
  );

  const handleRemovePhoto = useCallback(() => {
    setAvatarFile(undefined);
    onAvatarChange(undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [onAvatarChange]);

  const inputClass = "w-full rounded-xl border border-border bg-surface-elevated px-3 py-2.5 text-sm text-foreground placeholder-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all";

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <div className="flex items-center gap-4">
        <AvatarUploader
          avatar={avatarFile?.dataUrl}
          nombre={nombre}
          perfilId={perfil.id}
        />
        <div className="flex flex-col gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-sm text-primary hover:text-primary-dark font-medium transition-colors"
          >
            Cambiar foto
          </button>
          {avatarFile && (
            <button
              onClick={handleRemovePhoto}
              className="text-sm text-danger hover:text-danger/80 font-medium transition-colors"
            >
              Quitar foto
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          onChange={handleFilePick}
          className="hidden"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-foreground">
          Nombre <span className="text-danger">*</span>
        </label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          maxLength={60}
          className={inputClass}
        />
        {errors.nombre && (
          <span className="text-xs text-danger">{errors.nombre}</span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-foreground">
          Email <span className="text-muted">(opcional)</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
        {errors.email && (
          <span className="text-xs text-danger">{errors.email}</span>
        )}
      </div>

      <div className="flex flex-col gap-3 pt-2 border-t border-border">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">
            Contraseña {tieneContrasena ? <span className="text-muted">(cambiar)</span> : <span className="text-muted">(opcional)</span>}
          </label>
          <input
            type="password"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            placeholder="Mínimo 4 caracteres"
            className={inputClass}
          />
          {errors.contrasena && (
            <span className="text-xs text-danger">{errors.contrasena}</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">
            Repetir contraseña
          </label>
          <input
            type="password"
            value={contrasena2}
            onChange={(e) => setContrasena2(e.target.value)}
            className={inputClass}
          />
          {errors.contrasena2 && (
            <span className="text-xs text-danger">{errors.contrasena2}</span>
          )}
        </div>
      </div>

      <div className="relative group">
        <button
          disabled
          className="w-full py-3 rounded-xl bg-surface-elevated border border-border text-muted text-sm font-medium cursor-not-allowed"
        >
          Cerrar sesión
        </button>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block px-3 py-1.5 bg-surface-elevated border border-border text-foreground text-xs rounded-xl whitespace-nowrap">
          No disponible en versión web
        </div>
      </div>

      <button
        onClick={handleSave}
        className="sticky bottom-4 w-full py-3 rounded-xl gradient-primary text-white font-semibold text-sm shadow-lg glow-primary hover:scale-[1.01] active:scale-[0.98] transition-all"
      >
        Guardar
      </button>
    </div>
  );
}
