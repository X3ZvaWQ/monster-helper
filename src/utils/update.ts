import { getJx3boxPost } from "@/services/jx3box";
import { compare } from "semver";
export const checkUpdate = async () => {
    const post = await getJx3boxPost(101669);
    if (!post) throw new Error("更新检查失败：获取魔盒文章内容失败");
    console.log(post);
    const postMeta = post.post_meta?.data?.[0];
    if (!postMeta) throw new Error("更新检查失败：文章中没有附件");
    const fileName = postMeta.name;
    if (!fileName) throw new Error("更新检查失败：文章附件没有名称");
    const versionMatch = fileName.match(/v(\d+\.\d+\.\d+)/);
    if (!versionMatch) throw new Error("更新检查失败：未从文章附件名称中匹配到版本号");
    const newestVersion = versionMatch[1];
    const currentVersion = await import("../../package.json").then((pkg) => pkg.version);
    const isNewest = compare(currentVersion, newestVersion) >= 0;
    return { isNewest, newestVersion };
};
