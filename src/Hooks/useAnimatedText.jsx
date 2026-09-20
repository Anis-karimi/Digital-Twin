import { useEffect, useState } from "react";

export function useAnimatedText(active, type = "dots", speed = 600) {
    const [value, setValue] = useState("");

    useEffect(() => {
        if (!active) {
            setValue(type === "record" ? "🔴" : "");
            return;
        }

        const interval = setInterval(() => {

            // Cycling ellipses animation
            if (type === "dots") {
                setValue(prev => {
                    if (prev === "") return ".";
                    if (prev === ".") return "..";
                    if (prev === "..") return "...";
                    return "";
                });
            }

            // Blinking record indicator
            if (type === "record") {
                setValue(prev => (prev === "🔴" ? "⚪" : "🔴"));
            }

        }, speed);

        return () => clearInterval(interval);

    }, [active, type, speed]);

    return value;
}