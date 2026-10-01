import { useEffect, useState } from "react";
import { millisecondsUntilNextLocalDay, todayDate } from "../../../lib/dates";

export function useLocalToday(): string {
  const [today, setToday] = useState(() => todayDate());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function refresh() {
      clearTimeout(timer);
      const now = new Date();
      setToday(todayDate(now));
      timer = setTimeout(refresh, millisecondsUntilNextLocalDay(now));
    }
    function onVisibilityChange() {
      if (document.visibilityState === "visible") refresh();
    }
    refresh();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);
  return today;
}
