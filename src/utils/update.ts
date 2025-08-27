import { getJx3boxPost } from "@/services/jx3box";
import { compare } from "semver";

export const getCurrentVersion = async () => {
    const pkg = await import("../../package.json");
    return pkg.version;
};

export const checkUpdate = async () => {
    const post = await getJx3boxPost(101669);
    if (!post || !post.post_content) throw new Error("更新检查失败：获取魔盒文章内容失败");
    // 解析文章内容
    const dom = document.createElement("div");
    dom.innerHTML = post.post_content;
    const changeLogDom = dom.querySelector(".change-logs");
    if (!changeLogDom) throw new Error("更新检查失败：文章中没有更新日志");
    const logDoms = changeLogDom.querySelectorAll("[data-version]");
    const logs = Array.from(logDoms)
        .map((dom) => {
            const version = dom.getAttribute("data-version")!;
            const content = dom.innerHTML.trim();
            return { version, content };
        })
        .filter((log) => log.version && log.content);
    const currentVersion = await getCurrentVersion();
    const isNewest = logs.every((log) => compare(currentVersion, log.version) >= 0);
    if (isNewest) return { isNewest };
    const newerLogs = logs.filter((log) => compare(currentVersion, log.version) < 0);
    return {
        isNewest,
        newestVersion: newerLogs[0].version,
        changeLogs: newerLogs,
    };
};
