import { useCallback, useEffect, useState } from 'react';
import type {
  AiUsageFilterState,
  AiUsageGraphResponse,
  AiUsageHistoryResponse,
  AiUsageOperationsResponse,
} from '../types';
import { AiUsageService } from '../services/aiUsageService';

interface UseAiUsageReturn {
  operations: AiUsageOperationsResponse | null;
  graph: AiUsageGraphResponse | null;
  history: AiUsageHistoryResponse | null;
  operationsLoading: boolean;
  graphLoading: boolean;
  historyLoading: boolean;
  operationsError: string | null;
  graphError: string | null;
  historyError: string | null;
  reloadOperations: () => Promise<void>;
  reloadGraph: () => Promise<void>;
  reloadHistory: () => Promise<void>;
}

export function useAiUsage(filters: AiUsageFilterState): UseAiUsageReturn {
  const [operations, setOperations] = useState<AiUsageOperationsResponse | null>(null);
  const [graph, setGraph] = useState<AiUsageGraphResponse | null>(null);
  const [history, setHistory] = useState<AiUsageHistoryResponse | null>(null);

  const [operationsLoading, setOperationsLoading] = useState(true);
  const [graphLoading, setGraphLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [operationsError, setOperationsError] = useState<string | null>(null);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const reloadOperations = useCallback(async () => {
    setOperationsLoading(true);
    setOperationsError(null);

    try {
      const response = await AiUsageService.getAiUsageOperations();
      if (response.success && response.data) {
        setOperations(response.data);
      } else {
        setOperationsError(response.message || 'Failed to load AI usage operations');
      }
    } catch (error) {
      setOperationsError(error instanceof Error ? error.message : 'Failed to load AI usage operations');
    } finally {
      setOperationsLoading(false);
    }
  }, []);

  const reloadGraph = useCallback(async () => {
    setGraphLoading(true);
    setGraphError(null);

    try {
      const response = await AiUsageService.getAiUsageGraph(filters);
      if (response.success && response.data) {
        setGraph(response.data);
      } else {
        setGraphError(response.message || 'Failed to load AI usage graph');
      }
    } catch (error) {
      setGraphError(error instanceof Error ? error.message : 'Failed to load AI usage graph');
    } finally {
      setGraphLoading(false);
    }
  }, [filters]);

  const reloadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const response = await AiUsageService.getAiUsageHistory(filters);
      if (response.success && response.data) {
        setHistory(response.data);
      } else {
        setHistoryError(response.message || 'Failed to load AI usage history');
      }
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : 'Failed to load AI usage history');
    } finally {
      setHistoryLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void reloadOperations();
  }, [reloadOperations]);

  useEffect(() => {
    void reloadGraph();
    void reloadHistory();
  }, [reloadGraph, reloadHistory]);

  return {
    operations,
    graph,
    history,
    operationsLoading,
    graphLoading,
    historyLoading,
    operationsError,
    graphError,
    historyError,
    reloadOperations,
    reloadGraph,
    reloadHistory,
  };
}
