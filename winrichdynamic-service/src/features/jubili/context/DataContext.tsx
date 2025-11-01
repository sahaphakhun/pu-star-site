"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import {
  mockActivities,
  mockCustomers,
  mockOpportunities,
  mockProjects,
  mockQuotations,
  mockReports,
  mockSalesOrders,
  dashboardData,
} from "@/features/jubili/data/mockData";

type AnyRecord = Record<string, any>;

interface DataContextValue {
  customers: AnyRecord[];
  projects: AnyRecord[];
  opportunities: AnyRecord[];
  quotations: AnyRecord[];
  salesOrders: AnyRecord[];
  activities: AnyRecord[];
  reports: AnyRecord;
  dashboard: AnyRecord;
  addCustomer: (customer: AnyRecord) => AnyRecord;
  updateCustomer: (id: number | string, updatedCustomer: AnyRecord) => void;
  deleteCustomer: (id: number | string) => void;
  addQuotation: (quotation: AnyRecord) => AnyRecord;
  updateQuotation: (id: number | string, updatedQuotation: AnyRecord) => void;
  deleteQuotation: (id: number | string) => void;
  addSalesOrder: (salesOrder: AnyRecord) => AnyRecord;
  updateSalesOrder: (id: number | string, updatedSalesOrder: AnyRecord) => void;
  deleteSalesOrder: (id: number | string) => void;
  addActivity: (activity: AnyRecord) => AnyRecord;
  updateActivity: (id: number | string, updatedActivity: AnyRecord) => void;
  deleteActivity: (id: number | string) => void;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

const readLocalStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") {
    return fallback;
  }
  try {
    const value = window.localStorage.getItem(key);
    if (!value) return fallback;
    const parsed = JSON.parse(value);
    return parsed;
  } catch {
    return fallback;
  }
};

const writeLocalStorage = <T,>(key: string, value: T) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore write failures
  }
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error("useData must be used within a DataProvider");
  }
  return ctx;
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [customers, setCustomers] = useState<AnyRecord[]>(() =>
    readLocalStorage("winrich_customers", mockCustomers)
  );

  const [projects, setProjects] = useState<AnyRecord[]>(() => {
    const stored = readLocalStorage("winrich_projects", mockProjects);
    return stored.length < mockProjects.length ? mockProjects : stored;
  });

  const [opportunities, setOpportunities] = useState<AnyRecord[]>(() => {
    const stored = readLocalStorage("winrich_opportunities", mockOpportunities);
    return stored.length < mockOpportunities.length
      ? mockOpportunities
      : stored;
  });

  const [quotations, setQuotations] = useState<AnyRecord[]>(() =>
    readLocalStorage("winrich_quotations", mockQuotations)
  );

  const [salesOrders, setSalesOrders] = useState<AnyRecord[]>(() =>
    readLocalStorage("winrich_salesOrders", mockSalesOrders)
  );

  const [activities, setActivities] = useState<AnyRecord[]>(() =>
    readLocalStorage("winrich_activities", mockActivities)
  );

  useEffect(() => {
    writeLocalStorage("winrich_customers", customers);
  }, [customers]);

  useEffect(() => {
    writeLocalStorage("winrich_projects", projects);
  }, [projects]);

  useEffect(() => {
    writeLocalStorage("winrich_opportunities", opportunities);
  }, [opportunities]);

  useEffect(() => {
    writeLocalStorage("winrich_quotations", quotations);
  }, [quotations]);

  useEffect(() => {
    writeLocalStorage("winrich_salesOrders", salesOrders);
  }, [salesOrders]);

  useEffect(() => {
    writeLocalStorage("winrich_activities", activities);
  }, [activities]);

  const addCustomer: DataContextValue["addCustomer"] = (customer) => {
    const nextId =
      Math.max(0, ...customers.map((c: AnyRecord) => Number(c.id) || 0)) + 1;
    const nextCode =
      Math.max(
        0,
        ...customers.map((c: AnyRecord) =>
          Number(String(c.code ?? "").replace(/\D/g, "")) || 0
        )
      ) + 1;

    const newCustomer = {
      ...customer,
      id: nextId,
      code: `C${String(nextCode).padStart(3, "0")}`,
    };
    setCustomers((prev: AnyRecord[]) => [...prev, newCustomer]);
    return newCustomer;
  };

  const updateCustomer: DataContextValue["updateCustomer"] = (
    id,
    updatedCustomer
  ) => {
    setCustomers((prev: AnyRecord[]) =>
      prev.map((c) => (String(c.id) === String(id) ? { ...c, ...updatedCustomer } : c))
    );
  };

  const deleteCustomer: DataContextValue["deleteCustomer"] = (id) => {
    setCustomers((prev: AnyRecord[]) =>
      prev.filter((c) => String(c.id) !== String(id))
    );
  };

  const addQuotation: DataContextValue["addQuotation"] = (quotation) => {
    const nextId =
      Math.max(0, ...quotations.map((q: AnyRecord) => Number(q.id) || 0)) + 1;
    const code = `Q#${new Date()
      .toISOString()
      .slice(2, 10)
      .replace(/-/g, "")}-${String(quotations.length + 1).padStart(4, "0")}`;

    const newQuotation = { ...quotation, id: nextId, code };
    setQuotations((prev: AnyRecord[]) => [...prev, newQuotation]);
    return newQuotation;
  };

  const updateQuotation: DataContextValue["updateQuotation"] = (
    id,
    updatedQuotation
  ) => {
    setQuotations((prev: AnyRecord[]) =>
      prev.map((q) => (String(q.id) === String(id) ? { ...q, ...updatedQuotation } : q))
    );
  };

  const deleteQuotation: DataContextValue["deleteQuotation"] = (id) => {
    setQuotations((prev: AnyRecord[]) =>
      prev.filter((q) => String(q.id) !== String(id))
    );
  };

  const addSalesOrder: DataContextValue["addSalesOrder"] = (salesOrder) => {
    const nextId =
      Math.max(0, ...salesOrders.map((so: AnyRecord) => Number(so.id) || 0)) +
      1;
    const code = `SO#${new Date()
      .toISOString()
      .slice(2, 10)
      .replace(/-/g, "")}-${String(salesOrders.length + 1).padStart(4, "0")}`;

    const newSalesOrder = { ...salesOrder, id: nextId, code };
    setSalesOrders((prev: AnyRecord[]) => [...prev, newSalesOrder]);
    return newSalesOrder;
  };

  const updateSalesOrder: DataContextValue["updateSalesOrder"] = (
    id,
    updatedSalesOrder
  ) => {
    setSalesOrders((prev: AnyRecord[]) =>
      prev.map((so) =>
        String(so.id) === String(id) ? { ...so, ...updatedSalesOrder } : so
      )
    );
  };

  const deleteSalesOrder: DataContextValue["deleteSalesOrder"] = (id) => {
    setSalesOrders((prev: AnyRecord[]) =>
      prev.filter((so) => String(so.id) !== String(id))
    );
  };

  const addActivity: DataContextValue["addActivity"] = (activity) => {
    const nextId =
      Math.max(0, ...activities.map((a: AnyRecord) => Number(a.id) || 0)) + 1;
    const newActivity = { ...activity, id: nextId };
    setActivities((prev: AnyRecord[]) => [...prev, newActivity]);
    return newActivity;
  };

  const updateActivity: DataContextValue["updateActivity"] = (
    id,
    updatedActivity
  ) => {
    setActivities((prev: AnyRecord[]) =>
      prev.map((a) =>
        String(a.id) === String(id) ? { ...a, ...updatedActivity } : a
      )
    );
  };

  const deleteActivity: DataContextValue["deleteActivity"] = (id) => {
    setActivities((prev: AnyRecord[]) =>
      prev.filter((a) => String(a.id) !== String(id))
    );
  };

  const value = useMemo<DataContextValue>(
    () => ({
      customers,
      projects,
      opportunities,
      quotations,
      salesOrders,
      activities,
      reports: mockReports,
      dashboard: dashboardData,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addQuotation,
      updateQuotation,
      deleteQuotation,
      addSalesOrder,
      updateSalesOrder,
      deleteSalesOrder,
      addActivity,
      updateActivity,
      deleteActivity,
    }),
    [
      activities,
      customers,
      opportunities,
      projects,
      quotations,
      salesOrders,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
