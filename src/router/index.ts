import { useRoleStore } from "@/store/role";
import { createWebHistory, createRouter as _createRouter, RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
    { path: "/", redirect: "/home" },
    {
        name: "home",
        path: "/home",
        component: () => import("@/views/Home.vue"),
    },
    {
        name: "stat",
        path: "/stat",
        component: () => import("@/views/Stat.vue"),
    },
    {
        name: "stat-boss",
        path: "/stat/boss/:roleId?",
        component: () => import("@/views/StatBoss.vue"),
        beforeEnter(to, _, next) {
            const roleId = to.params.roleId;
            if (roleId) {
                next();
            } else {
                next({
                    name: "stat-boss",
                    params: {
                        roleId: useRoleStore().roles[0]?.id,
                    },
                });
            }
        },
    },
    {
        name: "role",
        path: "/role",
        component: () => import("@/views/Role.vue"),
    },
    {
        name: "setting",
        path: "/setting",
        component: () => import("@/views/Setting.vue"),
    },
];

export const createRouter = () => {
    return _createRouter({
        history: createWebHistory(),
        routes,
    });
};
