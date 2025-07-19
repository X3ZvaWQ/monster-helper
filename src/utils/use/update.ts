import { NotificationApiInjection } from "naive-ui/es/notification/src/NotificationProvider";
import { checkUpdate as _checkUpdate } from "../update";
import { openUrl } from "@/utils/actions";

export const useCheckUpdate = (notification: NotificationApiInjection) => {
    return {
        checkUpdate() {
            _checkUpdate()
                .then(({ isNewest, newestVersion, changeLogs }) => {
                    if (isNewest) {
                        notification.create({
                            type: "success",
                            title: "版本检查",
                            description: "当前已经是最新版本咯~",
                        });
                    } else {
                        const versionNodes: any[] = [];
                        for (const log of changeLogs) {
                            versionNodes.push(
                                h(
                                    resolveComponent("n-text"),
                                    { class: "c-update-version" },
                                    {
                                        default: () => log.version,
                                    }
                                ),
                                h("div", {
                                    class: "c-update-logs",
                                    innerHTML: log.content,
                                })
                            );
                        }

                        const n = notification.create({
                            type: "warning",
                            title: "版本检查",
                            description: () =>
                                h(
                                    "div",
                                    {
                                        class: "c-update-notification",
                                    },
                                    [
                                        h(
                                            resolveComponent("n-text"),
                                            {
                                                class: "c-update-title",
                                            },
                                            {
                                                default: () =>
                                                    `有更新的版本！最新版本为 ${newestVersion}，请前往魔盒下载最新版本。以下是当前版本到最新版本的变更记录：`,
                                            }
                                        ),
                                        h(
                                            resolveComponent("n-flex"),
                                            {
                                                class: "c-update-logs-container",
                                                vertical: true,
                                                size: 2,
                                            },
                                            {
                                                default: () => versionNodes,
                                            }
                                        ),
                                    ]
                                ),
                            duration: 0, // 持续显示
                            closable: true, // 可关闭
                            action: () =>
                                h(
                                    resolveComponent("n-button"),
                                    {
                                        text: true,
                                        type: "primary",
                                        onClick: () => {
                                            n.destroy();
                                            openUrl("https://www.jx3box.com/tool/101669");
                                        },
                                    },
                                    {
                                        default: () => "Go!",
                                    }
                                ),
                        });
                    }
                })
                .catch((error) => {
                    notification.create({
                        type: "error",
                        title: "版本检查",
                        description: error.message,
                    });
                });
        },
    };
};
