import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiClient, getErrorMessage } from "../api/apiClient.js";

export const useResource = (resourcePath, collectionKey) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get(resourcePath);
      setItems(response.data.data[collectionKey] || []);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to load data"));
    } finally {
      setLoading(false);
    }
  }, [resourcePath, collectionKey]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (payload, itemKey) => {
    const response = await apiClient.post(resourcePath, payload);
    const item = response.data.data[itemKey];
    setItems((current) => [item, ...current]);
    toast.success(response.data.message);
    return item;
  };

  const update = async (id, payload, itemKey) => {
    const response = await apiClient.patch(`${resourcePath}/${id}`, payload);
    const item = response.data.data[itemKey];
    setItems((current) => current.map((entry) => (entry.id === id ? item : entry)));
    toast.success(response.data.message);
    return item;
  };

  const remove = async (id) => {
    const response = await apiClient.delete(`${resourcePath}/${id}`);
    setItems((current) => current.filter((entry) => entry.id !== id));
    toast.success(response.data.message);
  };

  return { items, setItems, loading, error, load, create, update, remove };
};
