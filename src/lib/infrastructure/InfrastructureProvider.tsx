import React, { useEffect, useState } from "react";
import { validateEnv } from "./validate-env";
import { verifySystemHealth } from "./health-verification";
import { runRecoveryEngine } from "./recovery-engine";
import { HealthCheckResult } from "./types";

interface InfrastructureContextType {
  isValid: boolean;
  isVerifying: boolean;
  health: HealthCheckResult | null;
  refreshHealth: () => Promise<void>;
}

const InfrastructureContext = React.createContext<InfrastructureContextType | undefined>(undefined);

export function InfrastructureProvider({ children }: { children: React.ReactNode }) {
  const [isValid, setIsValid] = useState(true);
  const [isVerifying, setIsVerifying] = useState(true);
  const [health, setHealth] = useState<HealthCheckResult | null>(null);

  async function refreshHealth() {
    try {
      const healthResult = await verifySystemHealth();
      setHealth(healthResult);
      
      if (healthResult.status === 'critical' || healthResult.status === 'warning') {
        console.warn(`⚠️ System Health: ${healthResult.status}. Score: ${healthResult.score}`);
        
        // Auto-run recovery engine for critical/warning
        const recovery = await runRecoveryEngine();
        if (recovery && 'restored' in recovery && typeof recovery.restored === 'number' && recovery.restored > 0) {
          const updatedHealth = await verifySystemHealth();
          setHealth(updatedHealth);
        }
      }
    } catch (error) {
      console.error("Infrastructure verification failed:", error);
    } finally {
      setIsVerifying(false);
    }
  }

  useEffect(() => {
    refreshHealth();
  }, []);

  return (
    <InfrastructureContext.Provider value={{ isValid, isVerifying, health, refreshHealth }}>
      {children}
    </InfrastructureContext.Provider>
  );
}

export function useInfrastructure() {
  const context = React.useContext(InfrastructureContext);
  if (context === undefined) {
    throw new Error("useInfrastructure must be used within an InfrastructureProvider");
  }
  return context;
}
