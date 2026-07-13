"use client";

export const useTranslation = () => {
    return {
        t: (key: string) => key,
        language: "en",
        setLanguage: (lang: string) => {}
    };
};
