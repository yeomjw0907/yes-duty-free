import React, { createContext, useContext } from 'react';

/** 1 TWD = twdRatePerKrw KRW (예: 40 → 1 TWD = 40원). null이면 TWD 환산 불가 */
export interface ExchangeRateContextValue {
  twdRatePerKrw: number | null;
}

const ExchangeRateContext = createContext<ExchangeRateContextValue>({ twdRatePerKrw: null });

export function useExchangeRate(): ExchangeRateContextValue {
  return useContext(ExchangeRateContext);
}

export const ExchangeRateProvider = ExchangeRateContext.Provider;
export default ExchangeRateContext;
