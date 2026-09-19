import { useEffect, useState } from "react";

export function useAnimatedText(active, type = "dots", speed = 600) {
    const [value, setValue] = useState("");

    useEffect(() => {
        if (!active) {
            setValue(type === "record" ? "🔴" : "");
            return;
        }

        const interval = setInterval(() => {

            // سه نقطه
            if (type === "dots") {
                setValue(prev => {
                    if (prev === "") return ".";
                    if (prev === ".") return "..";
                    if (prev === "..") return "...";
                    return "";
                });
            }

            // چشمک زدن دایره
            if (type === "record") {
                setValue(prev => (prev === "🔴" ? "⚪" : "🔴"));
            }

        }, speed);

        return () => clearInterval(interval);

    }, [active, type, speed]);

    return value;
}