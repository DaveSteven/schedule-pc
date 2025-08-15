import { useLocalStorage } from "@vueuse/core";

/**
 * 地址存储钩子函数
 * @returns 地址存储相关方法
 */
export function useAddressStorage() {
  const addressHistory = useLocalStorage<string[]>(
    "SCHEDULE_MOBILE_ADDRESS_HISTORY",
    []
  );

  const set = (list: string[]) => {
    addressHistory.value = list;
  };

  const get = (): string[] => {
    return addressHistory.value;
  };

  return {
    set,
    get,
  };
}
