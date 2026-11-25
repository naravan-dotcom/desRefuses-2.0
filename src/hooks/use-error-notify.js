"use client";

import { useEffect } from "react";
import { notify } from "@/components/ui/toast";

export default function useErrorNotify(error) {
  useEffect(() => {
    if (error) notify(error, "error");
  }, [error]);
}
