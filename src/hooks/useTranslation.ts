
"use client";

import { useContext } from "react";
import { AppContext } from "@/context/AppContext";

export const useTranslation = () => {
    const { t, language, setLanguage } = useContext(AppContext);
    return { t, language, setLanguage };
};
