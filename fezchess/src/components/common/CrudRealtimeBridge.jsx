/**
 * Task: Bridge Socket.IO `api:crud` to window CustomEvent for global listeners
 * Content: Re-subscribe on route changes so socket picks up token after login navigation.
 * Author: DucManh-BlueOC
 */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  subscribeApiCrud,
  API_CRUD_WINDOW_EVENT,
} from "../../services/crudSocketClient";

const CrudRealtimeBridge = () => {
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = subscribeApiCrud((payload) => {
      if (typeof window === "undefined") return;
      window.dispatchEvent(
        new CustomEvent(API_CRUD_WINDOW_EVENT, { detail: payload }),
      );
    });
    return unsubscribe;
  }, [location.pathname, location.key]);

  return null;
};

export default CrudRealtimeBridge;
