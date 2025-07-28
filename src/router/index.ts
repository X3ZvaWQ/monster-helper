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
        path: "/stat/boss/:roleId",
        component: () => import("@/views/StatBoss.vue"),
        meta: {
            menu: "stat",
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
