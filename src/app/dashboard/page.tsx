"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCarteras } from "@/hooks/useCarteras";
import { usePresupuesto } from "@/hooks/usePresupuesto";
import { usePerfil } from "@/hooks/usePerfil";
import { usePreferencias } from "@/hooks/usePreferencias";
import { espacioTrabajoRepo, subscribe } from "@/lib/db";
import { bs, usd, type Money } from "@/lib/money";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useTransacciones } from "@/hooks/useHistorial";
import { esLiquida } from "@/types/cartera";
import { convertirAUSD, convertirABs } from "@/lib/conversion";
import { toIso } from "@/lib/dates";
import type { Transaccion } from "@/types/transaccion";
import type { EspacioTrabajo } from "@/types/espacio-trabajo";
import DashboardHero from "@/components/dashboard/DashboardHero";
import DashboardKpis from "@/components/dashboard/DashboardKpis";
import BalancePeriodoCard from "@/components/dashboard/BalancePeriodoCard";
import SpendingChart from "@/components/dashboard/SpendingChart";
import BudgetDonut from "@/components/dashboard/BudgetDonut";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import QuickTest from "@/components/dashboard/QuickTest";
import IncomeExpenseChart from "@/components/dashboard/IncomeExpenseChart";
import EspacioTrabajoSelector from "@/components/dashboard/EspacioTrabajoSelector";
import EspacioTrabajoEditor from "@/components/dashboard/EspacioTrabajoEditor";
import TransaccionDrawer from "@/components/historial/TransaccionDrawer";

export default function DashboardPage() {
  const router = useRouter();
  const { carteras } = useCarteras();
  const { presupuesto } = usePresupuesto();
  const { perfil } = usePerfil();
  const transacciones = useTransacciones();
  const { preferencias, setEspacioTrabajoId } = usePreferencias();

  const dashboardData = useDashboardData(carteras, presupuesto, transacciones);
  const [drawerTx, setDrawerTx] = useState<Transaccion | null>(null);

  const [espacios, setEspacios] = useState<EspacioTrabajo[]>(() => espacioTrabajoRepo.list());
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEspacio, setEditingEspacio] = useState<EspacioTrabajo | undefined>();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    if (espacioTrabajoRepo.list().length === 0) {
      espacioTrabajoRepo.create({ nombre: "Personal", esDefault: true, monedaDefault: preferencias.moneda });
    }
    if (!preferencias.espacioTrabajoId) {
      const despues = espacioTrabajoRepo.list();
      if (despues.length > 0) {
        setEspacioTrabajoId(despues[0].id);
      }
    }
  }, [preferencias.espacioTrabajoId, preferencias.moneda, setEspacioTrabajoId]);

  useEffect(() => {
    return subscribe(() => {
      setEspacios(espacioTrabajoRepo.list());
    });
  }, []);

  const handleSelectEspacio = useCallback((id: string) => {
    setEspacioTrabajoId(id);
  }, [setEspacioTrabajoId]);

  const handleCrearEspacio = useCallback(() => {
    setEditingEspacio(undefined);
    setEditorOpen(true);
  }, []);

  const handleEditarEspacio = useCallback((e: EspacioTrabajo) => {
    setEditingEspacio(e);
    setEditorOpen(true);
  }, []);

  const handleSaveEspacio = useCallback((data: { nombre: string; monedaDefault: import("@/types/cartera").Moneda }) => {
    if (editingEspacio) {
      espacioTrabajoRepo.update(editingEspacio.id, data);
    } else {
      const nuevo = espacioTrabajoRepo.create({ ...data, esDefault: false });
      setEspacioTrabajoId(nuevo.id);
    }
    setEditorOpen(false);
    setEditingEspacio(undefined);
  }, [editingEspacio, setEspacioTrabajoId]);

  const carterasNoLiquidas = carteras.filter((c) => c.activo && !esLiquida(c));
  const activas = carteras.filter((c) => c.activo);
  const hoy = toIso(new Date());
  let totalBsNum = 0;
  let totalUsdNum = 0;
  for (const c of activas) {
    if (c.moneda === "Bs") totalBsNum += c.saldo;
    else if (c.moneda === "USD" || c.moneda === "USDT") totalUsdNum += c.saldo;
  }
  const totalBsMoney = bs(totalBsNum);
  const totalUsdMoney = usd(totalUsdNum);
  const totalEnBs = Number(totalBsMoney) + Number(convertirABs(totalUsdMoney, hoy));
  const totalEnUsd = Number(totalUsdMoney) + Number(convertirAUSD(totalBsMoney, "Bs", hoy));

  return (
    <div className="min-h-screen bg-background">
      <DashboardHero nombre={perfil.nombre}>
        <EspacioTrabajoSelector
          espacios={espacios}
          activoId={preferencias.espacioTrabajoId}
          onSelect={handleSelectEspacio}
          onCrear={handleCrearEspacio}
          onEditar={handleEditarEspacio}
        />
      </DashboardHero>

      <div className="relative -mt-8 z-10">
        <DashboardKpis
          disponible={dashboardData.disponible}
          presupuestoPct={dashboardData.presupuestoCubiertoPct}
          gastadoMesBs={dashboardData.gastadoMesBs}
          gastadoMesUsd={dashboardData.gastadoMesUsd}
          totalBs={totalEnBs as Money}
          totalUsd={totalEnUsd as Money}
          onDisponibleClick={() => router.push("/carteras")}
          onPresupuestoClick={() => router.push("/presupuestos")}
          onGastadoClick={() => router.push("/historial")}
        />
      </div>

      <div className="mt-6">
        <BalancePeriodoCard
          ingresoMesBs={dashboardData.ingresoMesBs}
          ingresoMesUsd={dashboardData.ingresoMesUsd}
          gastadoMesBs={dashboardData.gastadoMesBs}
          gastadoMesUsd={dashboardData.gastadoMesUsd}
          balanceMesBs={dashboardData.balanceMesBs}
          balanceMesUsd={dashboardData.balanceMesUsd}
        />
      </div>

      <div className="px-4 mt-6 space-y-6 lg:grid lg:grid-cols-5 lg:gap-6 lg:px-6 lg:mt-8">
        <div className="lg:col-span-3 space-y-6">
          <SpendingChart
            gastosPorCategoria={dashboardData.gastosPorCat}
          />
          {dashboardData.gastosPorCat.length > 0 && (
            <BudgetDonut gastosPorCategoria={dashboardData.gastosPorCat} />
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <RecentTransactions
            transacciones={dashboardData.ultimasTransacciones}
            onTxClick={setDrawerTx}
            onVerTodos={() => router.push("/historial")}
          />
          <QuickTest
            disponible={dashboardData.disponible}
            total={{ bs: totalEnBs as Money, usd: totalEnUsd as Money }}
            carterasNoLiquidas={carterasNoLiquidas.map((c) => {
              const saldoEnBs = c.moneda === "Bs" ? c.saldo : Number(convertirABs(usd(c.saldo), hoy));
              const saldoEnUsd = c.moneda === "USD" || c.moneda === "USDT" ? c.saldo : Number(convertirAUSD(bs(c.saldo), "Bs", hoy));
              return {
                id: c.id,
                nombre: c.nombre,
                tipo: c.tipo,
                saldo: perfil.preferencias.moneda === "USD" ? saldoEnUsd : saldoEnBs,
                moneda: perfil.preferencias.moneda === "USD" ? "USD" : "Bs",
              };
            })}
          />
        </div>
      </div>

      <div className="px-4 mt-6 lg:px-6">
        <IncomeExpenseChart transacciones={transacciones} presupuesto={presupuesto} />
      </div>

      <TransaccionDrawer
        open={!!drawerTx}
        transaccion={drawerTx}
        onClose={() => setDrawerTx(null)}
      />

      <EspacioTrabajoEditor
        open={editorOpen}
        espacio={editingEspacio}
        onSave={handleSaveEspacio}
        onClose={() => { setEditorOpen(false); setEditingEspacio(undefined); }}
      />
    </div>
  );
}
