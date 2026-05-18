import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

/**
 * Gộp tiêu đề trang (dashboard) với thanh điều khiển phải (theme, thông báo, user)
 * thành một top bar duy nhất trên desktop; mobile dùng {@link mobileTitle}.
 */
const ShellTopBarContext = createContext(null);

export function ShellTopBarProvider({ children }) {
  const [payload, setPayloadState] = useState(null);
  const setTopBar = useCallback((next) => {
    setPayloadState(next == null ? null : next);
  }, []);
  const value = useMemo(
    () => ({ payload, setTopBar }),
    [payload, setTopBar],
  );
  return (
    <ShellTopBarContext.Provider value={value}>
      {children}
    </ShellTopBarContext.Provider>
  );
}

export function useShellTopBar() {
  const ctx = useContext(ShellTopBarContext);
  if (!ctx) {
    throw new Error("useShellTopBar cần ShellTopBarProvider");
  }
  return ctx;
}

/** Trả về null khi không nằm trong portal (vd. test tách layout). */
export function useShellTopBarOptional() {
  return useContext(ShellTopBarContext);
}
